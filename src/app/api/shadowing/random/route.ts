import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "@/lib/db";
import UserSettings from "@/models/UserSettings";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || 'default';

        const { searchParams } = new URL(req.url);
        let level = searchParams.get("level");

        if (!level) {
            await connectDB();
            const settings = await UserSettings.findOne({ userId });
            level = settings?.aiLevel || "B2";
        }

        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        Generate one random, natural English paragraph (2-4 sentences) for shadowing practice.
        Target CEFR level: ${level}.
        
        The text should be:
        1. Contextual (e.g., news, storytelling, formal speech, or casual conversation).
        2. Challenging but appropriate for the ${level} level.
        3. No more than 40 words total.
        
        Return ONLY a JSON object:
        {
            "text": "Full paragraph text...",
            "script": [
                { "text": "Sentence 1", "start": 0, "end": 2.5 },
                { "text": "Sentence 2", "start": 2.5, "end": 5.0 }
            ],
            "cefrLevel": "${level}"
        }
        Estimate the timestamps (in seconds) assuming a normal speaking pace (approx 130-150 words per minute).
        `;

        const result = await model.generateContent(prompt);
        const data = JSON.parse(result.response.text().trim());

        return NextResponse.json(data);
    } catch (e: any) {
        console.error("Shadowing Random API Error:", e);
        return NextResponse.json({ error: "Failed to generate text" }, { status: 500 });
    }
}
