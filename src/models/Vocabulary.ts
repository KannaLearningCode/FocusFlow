import mongoose, { Schema, Model } from "mongoose";

export interface IVocabulary {
    userId: string; // Added for auth
    word: string;
    wordClass: string;
    ipa?: string;
    definition: string;
    collocations?: string[];
    example?: string;
    meaningVN?: string;
    synonyms?: string[];
    antonyms?: string[];
    category?: string;
    srsLevel: number;
    nextReview: Date;
    createdAt: Date;
    type?: 'word' | 'phrase' | 'sentence';
    translation?: string; // Vietnamese translation
    grammarNote?: string;
}

const VocabularySchema = new Schema<IVocabulary>({
    userId: { type: String, required: true, index: true, default: 'default' },
    word: { type: String, required: true, index: true },
    wordClass: { type: String, default: 'unknown' },
    ipa: { type: String },
    definition: { type: String, required: true },
    collocations: [{ type: String }],
    example: { type: String },
    meaningVN: { type: String },
    synonyms: [{ type: String }],
    antonyms: [{ type: String }],
    category: { type: String, default: 'General' },
    srsLevel: { type: Number, default: 0 },
    nextReview: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    type: { type: String, enum: ['word', 'phrase', 'sentence'], default: 'word' },
    translation: { type: String }, // Vietnamese translation
    grammarNote: { type: String }, // For sentences/phrases
});

// Prevent overwrite on HMR
const Vocabulary: Model<IVocabulary> = mongoose.models.Vocabulary || mongoose.model("Vocabulary", VocabularySchema);

export default Vocabulary;
