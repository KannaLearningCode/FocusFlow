import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserProgress from "@/models/UserProgress";
import Vocabulary from "@/models/Vocabulary";
import UpgradedSentence from "@/models/UpgradedSentence";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        let progress = await UserProgress.findOne({ userId });
        if (!progress) {
            progress = await UserProgress.create({ userId });
        }

        // Calculate Words Mastered for THIS USER
        const wordsMastered = await Vocabulary.countDocuments({ userId, srsLevel: { $gte: 4 } });

        // Upgraded Sentences Stats for THIS USER
        const upgradedSentencesCount = await UpgradedSentence.countDocuments({ userId });
        const latestUpgradedSentence = await UpgradedSentence.findOne({ userId }).sort({ createdAt: -1 });

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
