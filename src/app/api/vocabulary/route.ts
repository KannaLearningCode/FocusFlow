import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Vocabulary from "@/models/Vocabulary";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET: Fetch all vocabulary
export async function GET() {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const words = await Vocabulary.find({ userId }).sort({ createdAt: -1 });
        return NextResponse.json(words);
    } catch (e: any) {
        console.error("Fetch Vocab Error:", e);
        return NextResponse.json({ error: e.message || "Failed to fetch vocabulary" }, { status: 500 });
    }
}

// POST: Add new word
export async function POST(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";
        const body = await req.json();

        // Basic duplicate check for this user
        const exists = await Vocabulary.findOne({
            userId,
            word: { $regex: new RegExp(`^${body.word}$`, "i") }
        });

        if (exists) {
            return NextResponse.json({ error: "Word already exists" }, { status: 409 });
        }

        const newWord = await Vocabulary.create({ ...body, userId });
        return NextResponse.json(newWord);
    } catch (e: any) {
        console.error("Add Word Error:", e);
        return NextResponse.json({ error: e.message || "Failed to add word" }, { status: 500 });
    }
}

// PUT: Update word (e.g. SRS level or details)
export async function PUT(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";
        const { _id, ...updates } = await req.json();

        if (!_id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        // Ensure user owns this word
        const updatedWord = await Vocabulary.findOneAndUpdate(
            { _id, userId },
            updates,
            { new: true }
        );

        if (!updatedWord) {
            return NextResponse.json({ error: "Word not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json(updatedWord);
    } catch (e: any) {
        console.error("Update Word Error:", e);
        return NextResponse.json({ error: "Failed to update word" }, { status: 500 });
    }
}

// DELETE: Remove word
export async function DELETE(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const deleted = await Vocabulary.findOneAndDelete({ _id: id, userId });

        if (!deleted) {
            return NextResponse.json({ error: "Word not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Delete Word Error:", e);
        return NextResponse.json({ error: "Failed to delete word" }, { status: 500 });
    }
}
