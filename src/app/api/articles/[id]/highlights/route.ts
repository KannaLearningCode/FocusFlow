
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import Vocabulary from "@/models/Vocabulary";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

interface HighlightRequest {
    action: 'add' | 'delete';
    text: string;
    index?: number;
    color?: string;
    source?: 'user' | 'AI';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const { action, text, index, color, source, translation: suppliedTranslation } = body as HighlightRequest & { translation?: string };

        if (!id) return NextResponse.json({ error: "Article ID is required" }, { status: 400 });
        if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

        // Normalize text for comparison
        const normalizedText = text.trim();
        const lowerText = normalizedText.toLowerCase();

        if (action === 'delete') {
            const updatedArticle = await Article.findOneAndUpdate(
                { _id: id },
                { $pull: { highlights: { text: normalizedText } } }, // Remove by EXACT text match (or should we use case-insensitive? standard pull is exact)
                // Actually better to pull by case-insensitive check? Mongo $pull with regex is tricky in arrays of objects.
                // Let's assume exact match for now, or fetch-filter-save if needed.
                // But for robust delete, we might need to handle casing. 
                // However, the UI sends back exactly what it received.
                { new: true }
            );

            // If standard pull fails due to casing, let's try a more robust approach:
            // Fetch, filter in JS, Save.
            if (!updatedArticle) return NextResponse.json({ error: "Article not found" }, { status: 404 });

            // Re-verify if it was removed. If not (due to casing), do manual filter.
            const exists = updatedArticle.highlights?.some((h: any) => h.text === normalizedText);
            if (exists) {
                const article = await Article.findById(id);
                if (article && article.highlights) {
                    article.highlights = article.highlights.filter((h: any) => h.text !== normalizedText);
                    await article.save();
                    return NextResponse.json({ message: "Deleted", highlights: article.highlights });
                }
            }

            return NextResponse.json({ message: "Deleted", highlights: updatedArticle.highlights || [] });
        }

        if (action === 'add') {
            // 1. Check Existence
            const article = await Article.findById(id).select('highlights');
            if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

            const exists = article.highlights?.some((h: any) => h.text.toLowerCase() === lowerText);
            if (exists) {
                return NextResponse.json({
                    message: "Highlight already exists",
                    highlights: article.highlights // Return existing state
                });
            }

            // 2. Resolve Translation
            let translation = "";

            if (suppliedTranslation) {
                translation = suppliedTranslation;
            } else {
                // A. Check Vocabulary (Smart Lookup)
                const vocabEntry = await Vocabulary.findOne({
                    word: { $regex: new RegExp(`^${normalizedText}$`, 'i') }
                }).select('meaningVN translation');

                if (vocabEntry && (vocabEntry.meaningVN || vocabEntry.translation)) {
                    translation = vocabEntry.meaningVN || vocabEntry.translation || "";
                } else {
                    // B. Gemini Fallback
                    try {
                        const prompt = `Translate this specific text to Vietnamese. Return ONLY the translation string, nothing else. Text: "${normalizedText}"`;
                        const result = await model.generateContent(prompt);
                        translation = result.response.text().trim();
                    } catch (e) {
                        console.error("Gemini Translation Error:", e);
                        translation = ""; // Fail gracefully
                    }
                }
            }

            // 3. Update DB
            const newHighlight = {
                text: normalizedText,
                index: index || 0,
                color: color || 'yellow',
                source: source || 'user',
                translation: translation
            };

            const updatedArticle = await Article.findOneAndUpdate(
                { _id: id },
                { $push: { highlights: newHighlight } },
                { new: true }
            );

            return NextResponse.json({
                message: "Added highlight",
                highlights: updatedArticle?.highlights || []
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (e: any) {
        console.error("Highlight Action Error:", e);
        return NextResponse.json({ error: e.message || "Server Error" }, { status: 500 });
    }
}
