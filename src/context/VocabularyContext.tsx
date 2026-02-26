"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface VocabularyItem {
    id: string; // Unified ID
    _id?: string;
    word: string;
    wordClass?: string;
    ipa?: string;
    definition: string;
    collocations?: string[];
    verbCollocations?: string[];
    synonyms?: string[];
    antonyms?: string[];
    example?: string;
    meaningVN?: string;
    category?: string;
    srsLevel: number;
    nextReview: Date;
    createdAt?: Date;
    box: number; // Made required
    type?: 'word' | 'phrase' | 'sentence';
    grammarNote?: string;
}

interface VocabularyContextType {
    vocabList: VocabularyItem[];
    isLoading: boolean;
    addWord: (word: string, wordClass: string | undefined, definition: string, example: string | undefined, ipa: string | undefined, details?: any) => Promise<boolean>;
    reviewWord: (id: string, success: boolean) => Promise<void>;
    deleteWord: (id: string) => Promise<void>;
    getDueWords: () => VocabularyItem[];
    refresh: () => Promise<void>;
}

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export function VocabularyProvider({ children }: { children: ReactNode }) {
    const [vocabList, setVocabulary] = useState<VocabularyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchVocabulary = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/vocabulary");
            const data = await res.json();

            if (Array.isArray(data)) {
                // Convert strings to Dates and normalize structure
                const parsed = data.map((item: any) => ({
                    ...item,
                    id: item._id || item.id, // Ensure id exists
                    box: item.srsLevel, // Ensure box exists
                    nextReview: new Date(item.nextReview),
                    createdAt: new Date(item.createdAt)
                }));
                setVocabulary(parsed);
            } else {
                console.error("API returned non-array:", data);
                setVocabulary([]);
            }
        } catch (error) {
            console.error("Failed to fetch vocabulary", error);
            setVocabulary([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVocabulary();
    }, []);

    const addWord = async (word: string, wordClass: string | undefined, definition: string, example: string | undefined, ipa: string | undefined, details: any = {}) => {
        const newItem = {
            word,
            wordClass: wordClass || 'unknown',
            definition,
            example,
            ipa,
            category: details.category || "General",
            srsLevel: 0,
            nextReview: new Date(),
            meaningVN: details.meaningVN,
            collocations: details.collocations,
            verbCollocations: details.verbCollocations,
            synonyms: details.synonyms,
            antonyms: details.antonyms,
            type: details.type || 'word',
            grammarNote: details.grammarNote
        };

        try {
            const res = await fetch("/api/vocabulary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem)
            });
            if (res.ok) {
                await fetchVocabulary(); // Refresh global list
                return true;
            }
            return false;
        } catch (e) {
            console.error("Error adding word", e);
            return false;
        }
    };

    const reviewWord = async (id: string, success: boolean) => {
        const item = vocabList.find(v => v.id === id || v._id === id);
        if (!item) return;

        let newLevel = item.srsLevel;
        if (success) {
            newLevel = Math.min(newLevel + 1, 5);
        } else {
            newLevel = Math.max(newLevel - 1, 0);
        }

        const now = new Date();
        let nextReview = new Date();
        if (newLevel === 1) nextReview.setMinutes(now.getMinutes() + 10);
        else if (newLevel === 2) nextReview.setHours(now.getHours() + 4);
        else if (newLevel === 3) nextReview.setDate(now.getDate() + 1);
        else if (newLevel === 4) nextReview.setDate(now.getDate() + 3);
        else if (newLevel === 5) nextReview.setDate(now.getDate() + 7);
        else nextReview = new Date();

        try {
            await fetch("/api/vocabulary", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ _id: item._id || item.id, srsLevel: newLevel, nextReview })
            });
            // Optimistic update or refresh? Refresh is safer for consistence
            fetchVocabulary();
        } catch (e) {
            console.error("Error reviewing word", e);
        }
    };

    const deleteWord = async (id: string) => {
        try {
            await fetch(`/api/vocabulary?id=${id}`, { method: "DELETE" });
            fetchVocabulary();
        } catch (e) {
            console.error("Error deleting word", e);
        }
    };

    const getDueWords = () => {
        return vocabList.filter(item => new Date(item.nextReview) <= new Date());
    };

    return (
        <VocabularyContext.Provider value={{
            vocabList,
            isLoading,
            addWord,
            reviewWord,
            deleteWord,
            getDueWords,
            refresh: fetchVocabulary
        }}>
            {children}
        </VocabularyContext.Provider>
    );
}

export function useVocabulary() {
    const context = useContext(VocabularyContext);
    if (context === undefined) {
        throw new Error("useVocabulary must be used within a VocabularyProvider");
    }
    return context;
}
