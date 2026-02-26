
import mongoose, { Schema, Document } from "mongoose";

export interface IExplainerHistory extends Document {
    userId: string; // Added for auth
    query: string;
    answer: string;
    level: string;
    createdAt: Date;
}

const ExplainerHistorySchema: Schema = new Schema({
    userId: { type: String, required: true, index: true, default: 'default' },
    query: { type: String, required: true },
    answer: { type: String, required: true },
    level: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Prevent model recompilation error in Next.js hot reload
const ExplainerHistory = mongoose.models.ExplainerHistory || mongoose.model<IExplainerHistory>("ExplainerHistory", ExplainerHistorySchema);

export default ExplainerHistory;
