import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Vocabulary from "@/models/Vocabulary";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        await connectDB();
        const { text, category, level } = await req.json();

        // 1. Fetch recent words to avoid (Randomization) - Only for Generation Mode
        let promptExclusions = "";
        if (!text) {
            const recentWords = await Vocabulary.find({ category: category || "General" }).sort({ createdAt: -1 }).limit(20).select("word");
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
                "collocations": ["col1", "col2"],
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
                "collocations": ["col1", "col2"],
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
        const existing = await Vocabulary.findOne({ word: { $regex: new RegExp(`^${normalizedWord}$`, "i") } });

        if (existing) {
            // If already exists, we return the existing one, or arguably update it. 
            // For now, let's return the AI data but NOT save a duplicate, 
            // OR return the existing DB data? 
            // The user said: "Fix Duplication: Add a check to ensure the same word isn't saved twice."
            // If it's "Discovery" (random), getting a duplicate is bad luck. 
            // If it's "Analysis", it's fine, we just show it.
            // Let's just return the data with a flag or just return it. 
            // But if it's NOT saved, it won't be in the list? 
            // Actually, if it exists, it IS in the list.
            return NextResponse.json({ ...data, isDuplicate: true });
        } else {
            // Save new word
            const newWord = await Vocabulary.create({
                word: data.word,
                wordClass: data.wordClass,
                definition: data.definition,
                ipa: data.ipa,
                example: data.example,
                meaningVN: data.meaningVN,
                collocations: data.collocations || [],
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
