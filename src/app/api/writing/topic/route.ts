import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash";

export async function GET() {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `
        Generate a unique and realistic IELTS Writing Task 2 topic. 
        It should follow the standard IELTS format: a statement followed by a specific question (e.g., "To what extent do you agree or disagree?", "Discuss both views and give your opinion", etc.).
        
        The topics should cover various common IELTS themes like Education, Environment, Technology, Health, Government, and Society.
        
        Return ONLY the topic text as a string. No JSON, no extra commentary.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        return NextResponse.json({ topic: text });
    } catch (e: any) {
        console.error("Topic Generation Error:", e);
        return NextResponse.json({ error: "Failed to generate topic" }, { status: 500 });
    }
}
