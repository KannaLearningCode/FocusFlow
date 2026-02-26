import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "@/lib/db";
import DictationSession from "@/models/DictationSession";
import UserSettings from "@/models/UserSettings";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash";

export async function POST(req: Request) {
    try {
        const { userTranscription, targetText } = await req.json();

        if (!userTranscription || !targetText) {
            return NextResponse.json({ error: "Missing transcription or target text" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `
        Act as a meticulous English Language Grader.
        Compare the user's transcription with the original target text.
        
        Target Text: "${targetText}"
        User Transcription: "${userTranscription}"
        
        Instructions:
        1. Calculate an accuracy score (0-100).
        2. Identify specific errors: spelling, punctuation, capitalization, or missing/misheard words.
        3. YOU MUST Provide all feedback in VIETNAMESE. Ensure the tone is helpful and professional.
        
        Return ONLY a JSON object:
        {
            "score": number,
            "feedback": "string (in Vietnamese)",
            "errors": [
                { "word": "string", "type": "spelling|missing|misheard", "correction": "string" }
            ],
            "isMatch": boolean
        }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI response");

        const data = JSON.parse(jsonMatch[0]);

        // Persistence
        await connectDB();
        const sessionAuth = await getServerSession(authOptions);
        const userId = sessionAuth?.user?.id || "default";

        const settings = await UserSettings.findOne({ userId });
        const level = settings?.aiLevel || "B2";

        const session = await DictationSession.create({
            userId,
            targetText,
            userTranscription,
            accuracyScore: data.score,
            feedback: data.feedback,
            errors: data.errors,
            cefrLevel: level
        });

        return NextResponse.json({
            id: session._id,
            ...data
        });
    } catch (e: any) {
        console.error("Dictation Evaluation API Error:", e);
        return NextResponse.json({ error: "Failed to evaluate transcription" }, { status: 500 });
    }
}
