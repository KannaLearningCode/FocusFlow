import mongoose, { Schema, Model } from "mongoose";

export interface IShadowingScript {
    text: string;
    start: number; // seconds
    end: number;
}

export interface IShadowingSession {
    _id?: string;
    userId: string;
    targetText: string;
    script?: IShadowingScript[]; // Added
    userTranscription: string;
    accuracyScore: number;
    fluencyScore?: number;
    prosodyFeedback: string;
    detectedMistakes?: string[]; // Added
    cefrLevel: string;
    createdAt: Date;
}

const ShadowingSessionSchema = new Schema<IShadowingSession>({
    userId: { type: String, required: true, index: true, default: 'default' },
    targetText: { type: String, required: true },
    script: [{
        text: String,
        start: Number,
        end: Number
    }],
    userTranscription: { type: String, required: true },
    accuracyScore: { type: Number, required: true },
    fluencyScore: { type: Number },
    prosodyFeedback: { type: String, required: true },
    detectedMistakes: [String],
    cefrLevel: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Prevent stale model compilation in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.ShadowingSession;
}

const ShadowingSession: Model<IShadowingSession> = mongoose.models.ShadowingSession || mongoose.model("ShadowingSession", ShadowingSessionSchema);

export default ShadowingSession;
