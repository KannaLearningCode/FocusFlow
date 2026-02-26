import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UpgradedSentence from "@/models/UpgradedSentence";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { originalSentence, upgradedSentence, style, level, explanation } = body;

        if (!originalSentence || !upgradedSentence) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Duplicate Check
        const existing = await UpgradedSentence.findOne({
            originalSentence,
            upgradedSentence
        });

        if (existing) {
            return NextResponse.json({ error: "Already saved in collection" }, { status: 409 });
        }

        const newEntry = await UpgradedSentence.create({
            originalSentence,
            upgradedSentence,
            style,
            level,
            explanation
        });

        return NextResponse.json(newEntry);
    } catch (error) {
        console.error("Error saving upgraded sentence:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await connectDB();
        // Simple fetch recent
        const history = await UpgradedSentence.find().sort({ createdAt: -1 }).limit(20);
        return NextResponse.json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await UpgradedSentence.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting entry:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
