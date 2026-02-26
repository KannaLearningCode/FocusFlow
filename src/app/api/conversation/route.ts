import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let history = [];
        let user_latest = "";
        let audioPart = null;
        let isIELTSMode = false;

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            history = JSON.parse(formData.get("history") as string || "[]");
            isIELTSMode = formData.get("isIELTS") === "true";
            const audioFile = formData.get("audio") as File;

            if (audioFile && audioFile.size > 0) {
                const buffer = Buffer.from(await audioFile.arrayBuffer());
                audioPart = {
                    inlineData: {
                        data: buffer.toString("base64"),
                        mimeType: audioFile.type || "audio/webm"
                    }
                };
            }
        } else {
            const body = await req.json();
            history = body.history || [];
            user_latest = body.user_latest || "";
            isIELTSMode = body.isIELTS === true;
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const ieltsPrompt = `
        Act as a certified IELTS Speaking Examiner. 
        Conduct a formal speaking test (Part 1, 2, or 3).
        
        Recent chat history: ${JSON.stringify(history)}
        ${audioPart ? "The user responded via VOICE (attached)." : `User just said: "${user_latest}"`}

        INSTRUCTIONS:
        1. If voice is attached, FIRST transcribe what the user said accurately.
        2. Stay in character: Ask one question at a time. Be formal but encouraging.
        3. MONITOR COMPLETION: If the user says something like "I'm done", "That's all", "Thank you, that's my answer", OR if the conversation has reached a natural end (after 5-6 exchanges), YOU MUST set "test_completed": true.
        4. If "test_completed" is true:
           - Provide a "band_score" (0-9.0).
           - Provide "overall_feedback" summarizing their performance.
           - Provide "detailed_criteria": { "fluency": "...", "lexical_resource": "...", "grammar": "...", "pronunciation": "..." }.
        5. provide IPA and focus words for your response as usual.

        Return ONLY a JSON object:
        {
            "user_transcription": "...",
            "response_text": "Your next question or your closing statement",
            "test_completed": boolean,
            "band_score": number (optional),
            "overall_feedback": "string in VIETNAMESE (optional)",
            "detailed_criteria": { 
                "fluency": "In VIETNAMESE", 
                "lexical_resource": "In VIETNAMESE", 
                "grammar": "In VIETNAMESE", 
                "pronunciation": "In VIETNAMESE" 
            } (optional),
            "response_ipa": "...",
            "pronunciation_focus_words": [...]
        }
        `;

        const partnerPrompt = `
        Act as a friendly, engaging English Linguistic Partner.
        Your goal is to have a natural conversation with the user to help them practice speaking.
        
        Recent chat history: ${JSON.stringify(history)}
        ${audioPart ? "The user responded via VOICE (attached)." : `User just said: "${user_latest}"`}

        INSTRUCTIONS:
        1. If voice is attached, FIRST transcribe what the user said accurately.
        2. Respond naturally to the user (keep it brief, 1-2 sentences max).
        3. Ask a follow-up question to keep the conversation going.
        4. Provide the IPA transcription of YOUR response.
        5. Identify 1-3 "focus words" in YOUR response that might be tricky for a learner.

        Return ONLY a JSON object:
        {
            "user_transcription": "...",
            "response_text": "...",
            "response_ipa": "...",
            "pronunciation_focus_words": ["word1", "word2"]
        }
        `;

        const prompt = isIELTSMode ? ieltsPrompt : partnerPrompt;
        const result = await model.generateContent([prompt, ...(audioPart ? [audioPart] : [])]);
        const response = await result.response;
        const text = response.text();

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found in response: " + text);

            const data = JSON.parse(jsonMatch[0]);
            return NextResponse.json(data);
        } catch (e) {
            console.error("JSON Parse Error:", e, text);
            return NextResponse.json({ error: "Failed to generate valid response" }, { status: 500 });
        }

    } catch (error) {
        console.error("Error in conversation API:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Conversation failed"
        }, { status: 500 });
    }
}
