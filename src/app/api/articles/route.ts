import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Article from "@/models/Article";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const articles = await Article.find()
            .select("_id title readingTime difficulty_level topic originalPdfName createdAt")
            .sort({ createdAt: -1 });
        return NextResponse.json(articles);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to fetch articles" }, { status: 500 });
    }
}
