import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Article from "@/models/Article";
import { getCEFRPrompt } from "@/lib/cefr";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { topic, level } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        await connectDB();

        // 1. Fetch recent titles to avoid repetition (Randomization Logic)
        const recentArticles = await Article.find().sort({ createdAt: -1 }).limit(10).select("title");
        const avoidTitles = recentArticles.map(a => a.title).join(", ");

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const cefrDescriptor = getCEFRPrompt(level);

        const prompt = `
        Act as a professional academic writer. Generate a sophisticated, engaging article on the topic of "${topic}".
        Target Proficiency: ${level || "C1"} (${cefrDescriptor}).

        Requirements:
        1. Length: 400-600 words.
        2. Tone: Matches the CEFR level (${cefrDescriptor}).
        3. Style: Vocabulary and syntax must align strictly with ${level || "C1"}.
        4. AVOID topics/titles similar to: ${avoidTitles}.
        5. Structure: Title, Introduction, Body, Conclusion.

        You MUST return a valid JSON object with:
        {
            "title": "Creative Title",
            "content": "Article text with \\n\\n for paragraphs.",
            "reading_time": "3 mins",
            "difficulty_level": "${level || "C1"}",
            "topic_category": "${topic}"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let articleData = null;
        try {
            articleData = JSON.parse(text);
        } catch (e) {
            // Fallback regex
            const match = text.match(/\{[\s\S]*\}/);
            if (match) articleData = JSON.parse(match[0]);
            else throw new Error("Failed to parse JSON");
        }

        // 2. Auto-save to MongoDB
        const newArticle = await Article.create({
            title: articleData.title,
            content: articleData.content,
            readingTime: articleData.reading_time, // Map snake_case from AI to camelCase model
            difficulty_level: articleData.difficulty_level,
            topic: topic
        });

        return NextResponse.json(newArticle);

    } catch (error: any) {
        console.error("Generate Article API Error:", error);
        return NextResponse.json({ error: "Failed to generate article" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await connectDB();
        const articles = await Article.find().sort({ createdAt: -1 });
        return NextResponse.json(articles);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
