import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ShadowingSession from "@/models/ShadowingSession";
import UserSettings from "@/models/UserSettings";

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
        Act as an expert English Pronunciation Coach. 
        I am giving you:
        1. A 'target_text' the student was supposed to read.
        2. An audio recording of the student reading it.

        Target Text: "${targetText}"

        Your tasks:
        1. Transcribe EXACTLY what the student said in the audio.
        2. Calculate an 'accuracy_score' (0-100) by comparing the transcription with the target_text.
        3. Provide 'prosody_feedback' focusing on word stress, rhythm, and intonation. YOU MUST PROVIDE FEEDBACK IN VIETNAMESE.
        4. Detect if the student missed any final consonants or sounds.

        Return ONLY a JSON object:
        {
            "user_transcription": "...",
            "accuracy_score": number,
            "prosody_feedback": "Detailed feedback string (IN VIETNAMESE)",
            "detected_mistakes": ["list", "of", "words", "mispronounced"]
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
        const settings = await UserSettings.findOne({ userId: 'default' });
        const level = settings?.aiLevel || "B2";

        const session = await ShadowingSession.create({
            targetText,
            userTranscription: analysis.user_transcription,
            accuracyScore: analysis.accuracy_score,
            prosodyFeedback: analysis.prosody_feedback,
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
