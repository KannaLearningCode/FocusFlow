import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/db";
import UserSettings from "@/models/UserSettings";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        let level = searchParams.get("level");

        if (!level) {
            await connectDB();
            const settings = await UserSettings.findOne({ userId: 'default' });
            level = settings?.aiLevel || "B2";
        }

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `
        Generate one random, natural English sentence or short paragraph for dictation practice.
        Target CEFR level: ${level}.
        
        The content should be:
        1. Engaging and realistic (e.g., a news snippet, a dialogue, or an academic fact).
        2. Appropriate for the ${level} level.
        3. Length: 15-40 words.
        
        Return ONLY the text as a string. No quotes, no intro, no JSON.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        return NextResponse.json({ text });
    } catch (e: any) {
        console.error("Dictation Generate API Error:", e);
        return NextResponse.json({ error: "Failed to generate dictation material" }, { status: 500 });
    }
}
