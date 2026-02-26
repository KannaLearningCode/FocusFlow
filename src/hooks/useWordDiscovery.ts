import { useState } from "react";

export interface DiscoveredWord {
    word: string;
    wordClass: string;
    definition: string;
    ipa: string;
    example: string;
    meaningVN: string;
    collocations: string[];
    verbCollocations?: string[];
    synonyms?: string[];
    antonyms?: string[];
    isDuplicate?: boolean;
    _id?: string;
}

export function useWordDiscovery() {
    const [discoveredWord, setDiscoveredWord] = useState<DiscoveredWord | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const categories = ["Technology", "Business", "Environment", "Science", "Psychology", "Arts"];

    // Make text optional to support "Generate Random Word" mode
    const discoverWord = async (category: string, text?: string, level?: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/discover-word", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category, text, level }),
            });

            if (!res.ok) {
                // Try to parse error message if possible
                let errMsg = "Failed to fetch";
                try {
                    const errData = await res.json();
                    errMsg = errData.error || errMsg;
                } catch {
                    errMsg = `HTTP Error ${res.status}`;
                }
                throw new Error(errMsg);
            }

            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setDiscoveredWord(data);
        } catch (e: any) {
            console.error("Word Discovery Error:", e);
            setError(e.message || "Failed to define word");
        } finally {
            setLoading(false);
        }
    };

    const resetDiscovery = () => {
        setDiscoveredWord(null);
        setError(null);
    };

    return { discoverWord, discoveredWord, loading, error, resetDiscovery, categories };
}
