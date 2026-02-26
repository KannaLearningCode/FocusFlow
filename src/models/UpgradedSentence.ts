import mongoose, { Schema, Document } from "mongoose";

export interface IUpgradedSentence extends Document {
    userId: string; // Future proofing
    originalSentence: string;
    upgradedSentence: string;
    style: "Academic" | "Casual" | "Business";
    level: string;
    explanation: string;
    createdAt: Date;
}

const UpgradedSentenceSchema = new Schema<IUpgradedSentence>(
    {
        userId: { type: String, default: "default" },
        originalSentence: { type: String, required: true },
        upgradedSentence: { type: String, required: true },
        style: { type: String, required: true },
        level: { type: String, required: true },
        explanation: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.models.UpgradedSentence ||
    mongoose.model<IUpgradedSentence>("UpgradedSentence", UpgradedSentenceSchema);
