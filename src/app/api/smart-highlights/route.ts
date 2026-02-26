import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text content is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

        const prompt = `
        Analyze the following text and extract 5-8 advanced academic words, idioms, or collocations (C1/C2 level).
        Return purely a JSON array of strings.
        
        Text: "${text.substring(0, 5000)}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonPoints = JSON.parse(response.text());

        return NextResponse.json(jsonPoints);

    } catch (e: any) {
        console.error("Smart Highlights Error:", e);
        return NextResponse.json({ error: "Failed to extract highlights" }, { status: 500 });
    }
}
