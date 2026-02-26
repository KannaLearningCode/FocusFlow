import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";
import { YoutubeTranscript } from "youtube-transcript";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Validate URL
        try {
            if (!ytdl.validateURL(url)) {
                return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
            }
        } catch (e) {
            console.error("YTDL Validation Error:", e);
            return NextResponse.json({ error: "Validation failed" }, { status: 400 });
        }

        // 1. Fetch Video Info (Audio URL)
        let audioUrl = "";
        let title = "";
        try {
            console.log("Fetching info for:", url);
            const info = await ytdl.getInfo(url);
            title = info.videoDetails.title;
            // Try to find audio only first, fallback to any format with audio
            const format = ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: "audioonly" });

            if (!format) {
                // Fallback: try to find any format with audio if audioonly fails (rare but possible)
                const fallbackFormat = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
                if (!fallbackFormat) throw new Error("No audio format found");
                audioUrl = fallbackFormat.url;
            } else {
                audioUrl = format.url;
            }

        } catch (e) {
            console.error("YTDL Info Fetch Error:", e);
            // Check for common errors
            const msg = e instanceof Error ? e.message : "Unknown error";
            if (msg.includes("410")) return NextResponse.json({ error: "Video is age-restricted or private (410 Gone)" }, { status: 422 });
            return NextResponse.json({ error: "Could not fetch video audio (Region restricted, private, or age-restricted?)" }, { status: 422 });
        }

        // 2. Fetch Transcript
        // This might fail if the video doesn't have captions.
        let transcriptItems = [];
        try {
            transcriptItems = await YoutubeTranscript.fetchTranscript(url);
        } catch (e) {
            console.error("Transcript fetch error:", e);
            return NextResponse.json({ error: "Could not fetch transcript (Video may lack captions/subtitles)" }, { status: 404 });
        }

        // Combine transcript for full text
        const fullTranscript = transcriptItems.map(item => item.text).join(" ");

        // Limit text length for Gemini to avoid huge tokens (approx 20 mins of speech is fine usually, but let's cap it)
        const textForAnalysis = fullTranscript.slice(0, 15000);

        // 3. Gemini Analysis
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
        Analyze the following English transcript from a video titled "${title}".
        
        Transcript: "${textForAnalysis}..."

        1. Identify 5 advanced/academic words used in this text that are suitable for checking user vocabulary.
        2. Identify 3 examples of connected speech or linking sounds (e.g., "want to" -> "wanna", consonant-vowel links) that users should watch out for.
        
        Return a JSON object:
        {
            "vocabulary_highlights": [
                { "word": "example", "definition": "short def" }
            ],
            "phonetic_highlights": [
                { "phrase": "phrase text", "feature": "description of linking/accent" }
            ]
        }
        `;

        let enrichedData = {};
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                enrichedData = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error("Gemini Analysis Error:", e);
            // Continue without enriched data if AI fails
        }



        const videoId = ytdl.getVideoID(url);

        return NextResponse.json({
            title,
            videoId, // Send ID for streaming proxy
            audioUrl, // Keep for fallback/debug
            transcript: fullTranscript,
            segments: transcriptItems,
            enrichedData
        });

    } catch (error) {
        console.error("YouTube Dictation API Error:", error);
        return NextResponse.json({ error: "Failed to process YouTube video" }, { status: 500 });
    }
}
