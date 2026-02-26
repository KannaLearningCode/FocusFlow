import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserProgress from "@/models/UserProgress";
import Vocabulary from "@/models/Vocabulary";
import UpgradedSentence from "@/models/UpgradedSentence";

export async function GET() {
    try {
        await connectDB();

        let progress = await UserProgress.findOne({ userId: 'default' });
        if (!progress) {
            progress = await UserProgress.create({ userId: 'default' });
        }

        // Calculate Words Mastered (assume SRS level > 4 is mastered)
        // Calculate Words Mastered (assume SRS level > 4 is mastered)
        const wordsMastered = await Vocabulary.countDocuments({ srsLevel: { $gte: 4 } });

        // Upgraded Sentences Stats
        const upgradedSentencesCount = await UpgradedSentence.countDocuments({ userId: 'default' });
        const latestUpgradedSentence = await UpgradedSentence.findOne({ userId: 'default' }).sort({ createdAt: -1 });

        return NextResponse.json({
            ...progress.toObject(),
            wordsMastered,
            upgradedSentencesCount,
            latestUpgradedSentence
        });

    } catch (e: any) {
        console.error("Dashboard Stats Error:", e);
        return NextResponse.json({ error: e.message || "Failed to fetch dashboard stats" }, { status: 500 });
    }
}
