import mongoose, { Schema, Model } from "mongoose";

export interface IDictationSession {
    _id?: string;
    userId: string; // Added for auth
    targetText: string;
    userTranscription: string;
    accuracyScore: number;
    feedback: string;
    errors: Array<{
        word: string;
        type: string;
        correction: string;
    }>;
    cefrLevel: string;
    createdAt: Date;
}

const DictationSessionSchema = new Schema<IDictationSession>({
    userId: { type: String, required: true, index: true, default: 'default' },
    targetText: { type: String, required: true },
    userTranscription: { type: String, required: true },
    accuracyScore: { type: Number, required: true },
    feedback: { type: String, required: true },
    errors: [{
        word: String,
        type: String,
        correction: String
    }],
    cefrLevel: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Prevent stale model compilation in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.DictationSession;
}

const DictationSession: Model<IDictationSession> = mongoose.models.DictationSession || mongoose.model("DictationSession", DictationSessionSchema);

export default DictationSession;
