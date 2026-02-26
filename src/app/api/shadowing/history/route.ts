import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ShadowingSession from "@/models/ShadowingSession";

export async function GET() {
    try {
        await connectDB();
        const history = await ShadowingSession.find()
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json({ history });
    } catch (e: any) {
        console.error("Shadowing History API Error:", e);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
