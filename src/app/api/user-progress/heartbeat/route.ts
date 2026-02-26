import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProgress from "@/models/UserProgress";

export async function POST() {
    try {
        await connectDB();

        let progress = await UserProgress.findOne({ userId: "default" });
        if (!progress) {
            progress = await UserProgress.create({ userId: "default", streak: 1, studyMinutes: 0 });
        }

        const now = new Date();
        const lastActive = new Date(progress.lastActive);

        // Normalize dates to midnight for streak calc
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutive day
            progress.streak += 1;
        } else if (diffDays > 1) {
            // Broken streak, reset to 1 (passed day 1)
            progress.streak = 1;
        }
        // If diffDays === 0, same day, keep streak

        progress.lastActive = now;
        progress.studyMinutes += 1; // Assume heartbeat is every 1 minute

        await progress.save();

        return NextResponse.json(progress);
    } catch (e: any) {
        console.error("Heartbeat Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
