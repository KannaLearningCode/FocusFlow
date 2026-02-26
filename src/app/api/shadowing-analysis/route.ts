import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
        Analyze this text for shadowing practice: "${text}"
        Return a JSON object with a "sentences" array.
        Each item in "sentences" should have:
        - original: The sentence text.
        - ipa: The IPA transcription.
        - stress_pattern: array of numbers (0 or 1) indicating stress? Or just ignored for now.
        - focus_words: array of strings (words that should be emphasized).

        JSON only.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");

        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json(data);
    } catch (e: any) {
        console.error("Shadowing Analysis Error:", e);
        return NextResponse.json({ error: e.message || "Analysis failed" }, { status: 500 });
    }
}
