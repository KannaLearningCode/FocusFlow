import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
        return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Use ytdl to create the stream directly. 
        // This handles the signature deciphering and cookie usage internally better than a raw fetch.
        const stream = ytdl(videoUrl, {
            filter: "audioonly",
            quality: "highestaudio",
            highWaterMark: 1 << 62, // High buffer to prevent stream cutoffs
            liveBuffer: 1 << 62,
            dlChunkSize: 0, // Disable chunking to mimic browser request more closely
        });

        // Create a Web ReadableStream to pipe to the NextResponse
        const webStream = new ReadableStream({
            start(controller) {
                stream.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });
                stream.on('end', () => {
                    controller.close();
                });
                stream.on('error', (err) => {
                    console.error("YTDL Stream Error:", err);
                    controller.error(err);
                });
            }
        });

        return new NextResponse(webStream, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": `inline; filename="${videoId}.mp3"`
            }
        });

    } catch (error) {
        console.error("Audio Stream Route Error:", error);
        return NextResponse.json({ error: "Failed to init stream" }, { status: 500 });
    }
}
