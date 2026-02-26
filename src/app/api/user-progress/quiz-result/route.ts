import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProgress from "@/models/UserProgress";

export async function POST(req: Request) {
    try {
        await connectDB();
        const { score, total, topic } = await req.json();

        // Find default user (or authenticated user later)
        let prog = await UserProgress.findOne({ userId: 'default' });
        if (!prog) {
            prog = await UserProgress.create({ userId: 'default' });
        }

        // Add to history
        prog.quizHistory.push({
            date: new Date(),
            score,
            totalQuestions: total,
            topic
        });

        // Optionally update other stats if needed, but quizHistory is enough for now
        await prog.save();

        return NextResponse.json({ success: true, history: prog.quizHistory });

    } catch (e: any) {
        console.error("Save Quiz Result Error:", e);
        return NextResponse.json({ error: e.message || "Failed to save result" }, { status: 500 });
    }
}
