import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserProgress from "@/models/UserProgress";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const { score, total, topic } = await req.json();

        let prog = await UserProgress.findOne({ userId });
        if (!prog) {
            prog = await UserProgress.create({ userId });
        }

        // Add to history
        prog.quizHistory.push({
            date: new Date(),
            score,
            totalQuestions: total,
            topic
        });

        await prog.save();

        return NextResponse.json({ success: true, history: prog.quizHistory });

    } catch (e: any) {
        console.error("Save Quiz Result Error:", e);
        return NextResponse.json({ error: e.message || "Failed to save result" }, { status: 500 });
    }
}
