
import mongoose, { Schema, Document } from "mongoose";

export interface IExplainerHistory extends Document {
    query: string;
    answer: string;
    level: string;
    createdAt: Date;
}

const ExplainerHistorySchema: Schema = new Schema({
    query: { type: String, required: true },
    answer: { type: String, required: true },
    level: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Prevent model recompilation error in Next.js hot reload
const ExplainerHistory = mongoose.models.ExplainerHistory || mongoose.model<IExplainerHistory>("ExplainerHistory", ExplainerHistorySchema);

export default ExplainerHistory;
