import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserSettings from "@/models/UserSettings";

export async function GET() {
    try {
        await connectDB();
        const settings = await UserSettings.findOne({ userId: 'default' });

        if (!settings) {
            return NextResponse.json({ aiLevel: "B2" });
        }

        return NextResponse.json({ aiLevel: settings.aiLevel });
    } catch (e: any) {
        console.error("User Settings GET API Error:", e);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { aiLevel } = await req.json();
        if (!aiLevel) {
            return NextResponse.json({ error: "aiLevel is required" }, { status: 400 });
        }

        await connectDB();
        const settings = await UserSettings.findOneAndUpdate(
            { userId: 'default' },
            { aiLevel },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, aiLevel: settings.aiLevel });
    } catch (e: any) {
        console.error("User Settings POST API Error:", e);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
