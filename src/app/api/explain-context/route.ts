import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getCEFRPrompt } from "@/lib/cefr";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { text, contextSentence, level } = await req.json();

        if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const cefrDescriptor = getCEFRPrompt(level);

        const prompt = `
        Analyze the phrase '${text}' within the context of the sentence: '${contextSentence}'.
        Target Proficiency: ${level || "C1"} (${cefrDescriptor}).

        Provide a response in JSON format with:
        {
            "meaning": "A clear Vietnamese translation relevant to this specific context.",
            "grammar": "Identify the structure (e.g., Relative Clause, Idiom, Passive Voice, Phrasal Verb).",
            "synonyms": ["Synonym 1", "Synonym 2"] (2 academic synonyms at ${level} level),
            "nuance": "Briefly explain why this word/phrase was chosen over simpler alternatives. Focus on tone and precision."
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text();

        let data = {};
        try {
            data = JSON.parse(jsonText);
        } catch (e) {
            const match = jsonText.match(/\{[\s\S]*\}/);
            if (match) data = JSON.parse(match[0]);
        }

        return NextResponse.json(data);

    } catch (e: any) {
        console.error("Context Explanation Error", e);
        return NextResponse.json({ error: "Failed to analyze context" }, { status: 500 });
    }
}
