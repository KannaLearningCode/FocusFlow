import mongoose, { Schema, Model } from "mongoose";

export interface IShadowingSession {
    _id?: string;
    userId: string; // Added for auth
    targetText: string;
    userTranscription: string;
    accuracyScore: number;
    prosodyFeedback: string;
    cefrLevel: string;
    createdAt: Date;
}

const ShadowingSessionSchema = new Schema<IShadowingSession>({
    userId: { type: String, required: true, index: true, default: 'default' },
    targetText: { type: String, required: true },
    userTranscription: { type: String, required: true },
    accuracyScore: { type: Number, required: true },
    prosodyFeedback: { type: String, required: true },
    cefrLevel: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Prevent stale model compilation in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.ShadowingSession;
}

const ShadowingSession: Model<IShadowingSession> = mongoose.models.ShadowingSession || mongoose.model("ShadowingSession", ShadowingSessionSchema);

export default ShadowingSession;
