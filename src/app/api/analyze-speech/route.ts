import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Act as a strict Phonetics and Linguistics Professor. 
        Analyze this transcribed sentence spoken by a student: "${text}".

        1. Check for grammatical accuracy.
        2. Identify potential pronunciation pitfalls for a Vietnamese learner of English based on the specific words used (e.g., /s/ endings, th sounds, clusters).
        3. Provide an upgraded, more natural version of the sentence.

        Return ONLY a JSON object with this structure:
        {
            "original_transcription": "${text}",
            "upgraded_text": "Better version...",
            "grammar_corrections": "Explanation of any grammar mistakes or 'None' if perfect.",
            "pronunciation_tips": "Specific advice on 1-2 difficult words in this sentence (e.g., 'Make sure to pronounce the final /s/ in works').",
            "score": number (1-10 rating of the complexity/accuracy)
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");

            const data = JSON.parse(jsonMatch[0]);
            return NextResponse.json(data);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.error("Raw Text:", responseText);
            return NextResponse.json({ error: "Failed to parse analysis" }, { status: 500 });
        }

    } catch (error) {
        console.error("Error generating analysis:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
