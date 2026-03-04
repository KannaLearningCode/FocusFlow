import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Vocabulary from "@/models/Vocabulary";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const { text, category, level } = await req.json();

        // 1. Fetch recent words to avoid (Randomization) - Only for Generation Mode
        let promptExclusions = "";
        if (!text) {
            const recentWords = await Vocabulary.find({ userId, category: category || "General" }).sort({ createdAt: -1 }).limit(20).select("word");
            const avoidList = recentWords.map(w => w.word).join(", ");
            if (avoidList) promptExclusions = `Avoid these words: ${avoidList}.`;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        let prompt = "";

        if (text) {
            prompt = `
            Analyze the word or phrase: "${text}".
            Context: ${category || "General"}.
            Target Level: ${level || "C1"}.
            
            Return JSON:
            {
                "word": "${text}",
                "wordClass": "noun/verb...",
                "definition": "definition...",
                "ipa": "/.../",
                "example": "sentence...",
                "meaningVN": "Vietnamese meaning...",
                "collocations": ["limit to max 3 items"],
                "verbCollocations": ["limit to max 3 items"],
                "synonyms": ["syn1", "syn2"],
                "antonyms": ["ant1", "ant2"]
            }
            `;
        } else {
            prompt = `
            Generate a random, useful ${level || "C1"} academic English word related to: "${category || "General"}".
            ${promptExclusions}
            
            Return JSON:
            {
                "word": "the word",
                "wordClass": "noun/verb...",
                "definition": "definition...",
                "ipa": "/.../",
                "example": "sentence...",
                "meaningVN": "Vietnamese meaning...",
                "collocations": ["limit to max 3 items"],
                "verbCollocations": ["limit to max 3 items"],
                "synonyms": ["syn1", "syn2"],
                "antonyms": ["ant1", "ant2"]
            }
            `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        let data;
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("Failed to parse AI response");
        }

        // 2. Duplicate Check & Auto-Save
        // Normalize word for check
        const normalizedWord = data.word.trim();
        const existing = await Vocabulary.findOne({
            userId,
            word: { $regex: new RegExp(`^${normalizedWord}$`, "i") }
        });

        if (existing) {
            return NextResponse.json({ ...data, isDuplicate: true });
        } else {
            // Save new word
            const newWord = await Vocabulary.create({
                userId,
                word: data.word,
                wordClass: data.wordClass,
                definition: data.definition,
                ipa: data.ipa,
                example: data.example,
                meaningVN: data.meaningVN,
                collocations: data.collocations || [],
                verbCollocations: data.verbCollocations || [],
                synonyms: data.synonyms || [],
                antonyms: data.antonyms || [],
                category: category || "General",
                srsLevel: 0
            });
            return NextResponse.json(newWord);
        }

    } catch (error: any) {
        console.error("Error in discover-word:", error);
        return NextResponse.json({ error: error.message || "Failed to analyze word" }, { status: 500 });
    }
}
