import mongoose, { Schema, Document } from "mongoose";

export interface IWritingSession extends Document {
    userId: string;
    mode: "sentence" | "paragraph" | "ielts";
    topic: string;
    input: string;
    level: string;
    result: {
        band_score: number;
        breakdown: {
            TR: number;
            CC: number;
            LR: number;
            GRA: number;
        };
        examiner_comment: string;
        key_improvements: string[];
    };
    createdAt: Date;
}

const WritingSessionSchema = new Schema<IWritingSession>(
    {
        userId: { type: String, required: true, index: true, default: "default" },
        mode: { type: String, enum: ["sentence", "paragraph", "ielts"], required: true },
        topic: { type: String, required: true },
        input: { type: String, required: true },
        level: { type: String, required: true },
        result: {
            band_score: Number,
            breakdown: {
                TR: Number,
                CC: Number,
                LR: Number,
                GRA: Number,
            },
            examiner_comment: String,
            key_improvements: [String],
        },
    },
    { timestamps: true }
);

export default mongoose.models.WritingSession ||
    mongoose.model<IWritingSession>("WritingSession", WritingSessionSchema);
