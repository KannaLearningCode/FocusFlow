import { NextResponse } from "next/server";
import WritingSession from "@/models/WritingSession";
import { connectDB } from "@/lib/db";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId") || "default";

        const sessions = await WritingSession.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json(sessions);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const session = await WritingSession.create({
            ...body,
            userId: body.userId || "default"
        });
        return NextResponse.json(session);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await WritingSession.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
