import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Article from "@/models/Article";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Định nghĩa kiểu dữ liệu đồng nhất cho params
type RouteContext = {
    params: Promise<{ id: string }>
};

export async function PATCH(req: Request, { params }: RouteContext) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const { id } = await params;
        const { highlights } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Article ID is required" }, { status: 400 });
        }

        const updatedArticle = await Article.findOneAndUpdate(
            { _id: id, userId },
            { highlights },
            { new: true }
        );

        if (!updatedArticle) {
            return NextResponse.json({ error: "Article not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json(updatedArticle);
    } catch (e: any) {
        console.error("Update Article Error:", e);
        return NextResponse.json({ error: e.message || "Failed to update article" }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: RouteContext
) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Article ID is required" }, { status: 400 });
        }

        const article = await Article.findOne({ _id: id, userId });

        if (!article) {
            return NextResponse.json({ error: "Article not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json(article);
    } catch (e: any) {
        console.error("Fetch Article Error:", e);
        return NextResponse.json({ error: e.message || "Failed to fetch article" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: RouteContext
) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Article ID is required" }, { status: 400 });
        }

        const article = await Article.findOneAndDelete({ _id: id, userId });

        if (!article) {
            return NextResponse.json({ error: "Article not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ message: "Article deleted successfully" });
    } catch (e) {
        console.error("Delete Article Error:", e);
        return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
    }
}
