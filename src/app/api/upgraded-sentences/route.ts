import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UpgradedSentence from "@/models/UpgradedSentence";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const body = await req.json();
        const { originalSentence, upgradedSentence, style, level, explanation } = body;

        if (!originalSentence || !upgradedSentence) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Duplicate Check for this user
        const existing = await UpgradedSentence.findOne({
            userId,
            originalSentence,
            upgradedSentence
        });

        if (existing) {
            return NextResponse.json({ error: "Already saved in collection" }, { status: 409 });
        }

        const newEntry = await UpgradedSentence.create({
            userId,
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
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const history = await UpgradedSentence.find({ userId }).sort({ createdAt: -1 }).limit(20);
        return NextResponse.json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const deleted = await UpgradedSentence.findOneAndDelete({ _id: id, userId });

        if (!deleted) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting entry:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
