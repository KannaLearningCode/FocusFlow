import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const articles = await Article.find({ userId })
            .select("_id title readingTime difficulty_level topic originalPdfName createdAt")
            .sort({ createdAt: -1 });
        return NextResponse.json(articles);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to fetch articles" }, { status: 500 });
    }
}
