import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DictationSession from "@/models/DictationSession";

export async function GET() {
    try {
        await connectDB();
        const history = await DictationSession.find()
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json({ history });
    } catch (e: any) {
        console.error("Dictation History API Error:", e);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
