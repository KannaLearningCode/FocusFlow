import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Vocabulary from "@/models/Vocabulary";

// GET: Fetch all vocabulary
export async function GET() {
    try {
        await connectDB();
        let words = await Vocabulary.find({}).sort({ createdAt: -1 });

        // Auto-seed if empty
        if (words.length === 0) {
            const seedWords = [
                {
                    word: "Analytical",
                    wordClass: "adjective",
                    definition: "Relating to or using analysis or logical reasoning.",
                    ipa: "/ˌan.əˈlɪt.ɪ.kəl/",
                    collocations: ["analytical skills", "analytical approach"],
                    example: "She has a very analytical mind.",
                    srsLevel: 0
                },
                {
                    word: "Substantial",
                    wordClass: "adjective",
                    definition: "Of considerable importance, size, or worth.",
                    ipa: "/səbˈstan.ʃəl/",
                    collocations: ["substantial amount", "substantial difference"],
                    example: "A substantial amount of money.",
                    srsLevel: 0
                },
                {
                    word: "Pragmatic",
                    wordClass: "adjective",
                    definition: "Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.",
                    ipa: "/pragˈmat.ɪk/",
                    collocations: ["pragmatic approach", "pragmatic solution"],
                    example: "We need a pragmatic solution to this problem.",
                    srsLevel: 0
                }
            ];
            await Vocabulary.insertMany(seedWords);
            words = await Vocabulary.find({}).sort({ createdAt: -1 }); // Re-fetch
        }

        return NextResponse.json(words);
    } catch (e: any) {
        console.error("Fetch Vocab Error:", e);
        // Ensure JSON response even on error
        return NextResponse.json({ error: e.message || "Failed to fetch vocabulary" }, { status: 500 });
    }
}

// POST: Add new word
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        // Basic duplicate check
        const exists = await Vocabulary.findOne({ word: { $regex: new RegExp(`^${body.word}$`, "i") } });
        if (exists) {
            return NextResponse.json({ error: "Word already exists" }, { status: 409 });
        }

        const newWord = await Vocabulary.create(body);
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
        const { _id, ...updates } = await req.json();

        if (!_id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const updatedWord = await Vocabulary.findByIdAndUpdate(_id, updates, { new: true });
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
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await Vocabulary.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Delete Word Error:", e);
        return NextResponse.json({ error: "Failed to delete word" }, { status: 500 });
    }
}
