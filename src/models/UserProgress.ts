import mongoose, { Schema, Model } from "mongoose";

export interface IUserProgress {
    userId: string; // For future auth, assume 'default' for now
    studyMinutes: number;
    streak: number;
    wordsMastered: number;
    lastActive: Date;
    quizHistory: {
        date: Date;
        score: number;
        totalQuestions: number;
        topic: string;
    }[];
}

const UserProgressSchema = new Schema<IUserProgress>({
    userId: { type: String, required: true, unique: true, default: 'default' },
    studyMinutes: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    wordsMastered: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    quizHistory: [{
        date: { type: Date, default: Date.now },
        score: Number,
        totalQuestions: Number,
        topic: String
    }]
});

const UserProgress: Model<IUserProgress> = mongoose.models.UserProgress || mongoose.model("UserProgress", UserProgressSchema);

export default UserProgress;
