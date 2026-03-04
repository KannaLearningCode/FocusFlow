import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ShadowingSession from "@/models/ShadowingSession";
import UserSettings from "@/models/UserSettings";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as Blob;
        const targetText = formData.get("targetText") as string;

        if (!audioFile || audioFile.size === 0 || !targetText) {
            return NextResponse.json({ error: "Audio or target text missing" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
        }

        // Convert Blob to Base64 for Gemini
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        const base64Audio = buffer.toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Act as a BRUTALLY CRITICAL English Pronunciation Coach (IELTS 9.0/Oxford Standard). 
        I am giving you:
        1. A 'target_text' the student was supposed to read.
        2. An audio recording that may contain TWO voices:
           - A BACKGROUND VOICE (Perfect, mechanical, native): This is the REFERENCE audio. IGNORE IT.
           - A FOREGROUND VOICE (Human, student): This is the USER'S recording. ONLY EVALUATE THIS VOICE.

        Target Text: "${targetText}"

        Your tasks:
        1. Transcribe EXHIBIT A: EXACTLY what the human student said. 
           - Capture every hesitation, stutter, and phoneme error.
           - DO NOT transcribe the background reference voice.
        2. Calculate 'accuracy_score' (0-100). Be EXTREMELY SEVERE.
           - 95-100: Flawless native-level precision.
           - 85-94: Minor vowel quality or cluster issues.
           - 70-84: Understandable but clearly non-native. 
           - 50-69: Heavy accent, missing endings (-s, -ed, -t), or vowel shifts.
           - Below 50: Incomprehensible.
           - PENALIZE HEAVILY for missing final consonants or incorrect word stress.
        3. Calculate 'fluency_score' (0-100).
           - Focus on: Rhythm, Liaisons (linking), and Natural Speed. 
           - ANY robotic/choppy pausing results in a score below 50.
        4. Provide 'prosody_feedback' in VIETNAMESE.
           - Be blunt and honest about the student's weaknesses.
           - Focus on: Intonation, Sentence Stress, and Vowel Clarity.
        5. List 'detected_mistakes' (words where the student failed to meet high standards).

        Return ONLY a JSON object:
        {
            "user_transcription": "...",
            "accuracy_score": number,
            "fluency_score": number,
            "prosody_feedback": "...",
            "detected_mistakes": ["..."]
        }
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Audio,
                    mimeType: audioFile.type || "audio/webm",
                },
            },
            { text: prompt },
        ]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI failed to return valid JSON");

        const analysis = JSON.parse(jsonMatch[0]);

        // Persistence
        await connectDB();
        const sessionAuth = await getServerSession(authOptions);
        const userId = sessionAuth?.user?.id || "default";

        const settings = await UserSettings.findOne({ userId });
        const level = settings?.aiLevel || "B2";

        const session = await ShadowingSession.create({
            userId,
            targetText,
            userTranscription: analysis.user_transcription,
            accuracyScore: analysis.accuracy_score,
            fluencyScore: analysis.fluency_score,
            prosodyFeedback: analysis.prosody_feedback,
            detectedMistakes: analysis.detected_mistakes,
            cefrLevel: level,
        });

        return NextResponse.json({
            id: session._id,
            ...analysis
        });

    } catch (error: any) {
        console.error("Evaluation API Error:", error);
        return NextResponse.json({ error: error.message || "Evaluation failed" }, { status: 500 });
    }
}
