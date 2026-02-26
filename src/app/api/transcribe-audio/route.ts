import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as Blob;
        console.log("Cloud STT API: Received audio file:", {
            size: audioFile?.size,
            type: audioFile?.type,
        });

        if (!audioFile || audioFile.size === 0) {
            console.error("Cloud STT API: Audio file is empty or missing");
            return NextResponse.json({ error: "No audio file provided or file is empty" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
        }

        // Convert Blob to Buffer/Base64 for Gemini
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        const base64Audio = buffer.toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Act as a strict Phonetics and Linguistics Professor.
        I am giving you an audio recording of a student speaking English.
        
        1. Transcribe EXACTLY what the student said, including stutters or mistakes.
        2. Check for grammatical accuracy in the spoken sentence.
        3. Identify specific pronunciation pitfalls for a Vietnamese learner of English based on the audio (e.g., missing final consonants, incorrect word stress).
        4. Provide an upgraded, more natural version of the sentence.
        
        Return ONLY a JSON object with this structure:
        {
            "original_transcription": "The exact words spoken...",
            "upgraded_text": "Better version...",
            "grammar_corrections": "Explanation of any grammar mistakes in VIETNAMESE.",
            "pronunciation_tips": "Specific advice in VIETNAMESE on 1-2 difficult words found in the audio.",
            "score": number (1-10 rating based on clarity and accuracy)
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

        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found in response");

            const data = JSON.parse(jsonMatch[0]);
            return NextResponse.json(data);
        } catch (e) {
            console.error("Transcription Parse Error:", e);
            console.error("Raw Text:", responseText);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Transcription API Error:", error);
        return NextResponse.json({ error: error.message || "Transcription failed" }, { status: 500 });
    }
}
