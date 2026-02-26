import mongoose, { Schema, Model } from "mongoose";

export interface IArticle {
    _id?: string;
    userId: string; // Added for auth
    title: string;
    content: string;
    readingTime: string; // Changed from reading_time to readingTime to match schema
    difficulty_level: string;
    topic: string;
    createdAt: Date;
    highlights?: Array<{
        text: string;
        color: string;
        index: number;
        source?: 'user' | 'AI';
        translation?: string;
    }>;
    // New fields for IELTS Practice
    originalPdfName?: string;
    questions?: Array<{
        id: string;
        questionType: string; // Renamed from type to avoid reserved keyword conflicts
        questionText: string;
        options?: string[];
        correctAnswer: string;
        explanation?: string;
    }>;
    answers?: Record<string, string>; // Map question ID to answer
}

const ArticleSchema = new Schema<IArticle>({
    userId: { type: String, required: true, index: true, default: 'default' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    readingTime: { type: String, required: true },
    difficulty_level: { type: String, required: true },
    topic: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    highlights: [{
        text: String,
        color: String,
        index: Number,
        source: { type: String, enum: ['user', 'AI'], default: 'user' },
        translation: String
    }],
    // New fields
    originalPdfName: String,
    questions: [{
        id: String,
        questionType: String,
        questionText: String,
        options: [String],
        correctAnswer: String,
        explanation: String
    }],
    answers: { type: Map, of: String }
});

// Prevent stale model compilation in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Article;
}

const Article: Model<IArticle> = mongoose.models.Article || mongoose.model("Article", ArticleSchema);

export default Article;
