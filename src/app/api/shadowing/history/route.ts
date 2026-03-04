import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ShadowingSession from "@/models/ShadowingSession";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const history = await ShadowingSession.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json({ history });
    } catch (e: any) {
        console.error("Shadowing History API Error:", e);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
