import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getCEFRPrompt } from "@/lib/cefr";
import { connectDB } from "@/lib/db";
import ExplainerHistory from "@/models/ExplainerHistory";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const history = await ExplainerHistory.find({ userId }).sort({ createdAt: -1 }).limit(20);
        return NextResponse.json(history);
    } catch (e) {
        console.error("Dashboard Explain History Error", e);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || "default";

        const { text, level } = await req.json();

        if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const cefrDescriptor = getCEFRPrompt(level);

        const prompt = `
        You are a helpful AI language tutor. 
        User Level: ${level || "B2"} (${cefrDescriptor}).
        
        User Query: "${text}"

        Please provide a clear, helpful, and accurate explanation suitable for the user's proficiency level. 
        If asking about a word, give definition and examples.
        If asking a question, answer it directly.
        Format your response in Markdown.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();

        // Save to history
        await ExplainerHistory.create({
            userId,
            query: text,
            answer,
            level: level || "B2"
        });

        return NextResponse.json({ answer });

    } catch (e: any) {
        console.error("Dashboard Explain Error", e);
        return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
    }
}
