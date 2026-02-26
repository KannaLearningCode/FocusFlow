"use client";

import { useEffect } from "react";
import { useRandomWord } from "@/hooks/useRandomWord";
import { useVocabulary } from "@/hooks/useVocabulary";
import { Button } from "@/components/ui/button";
import { Plus, RotateCw, Volume2 } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";

export function RandomWordCard({ onClose }: { onClose?: () => void }) {
    const { word, loading, fetchWord } = useRandomWord();
    const { addWord } = useVocabulary();
    const { speak } = useTTS();

    useEffect(() => {
        fetchWord();
    }, []);

    if (loading || !word) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[300px]">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                <p className="text-muted-foreground animate-pulse">Consulting the dictionary...</p>
            </div>
        );
    }

    const handleSave = () => {
        addWord(
            word.word,
            undefined, // wordClass
            word.definition,
            word.example,
            word.ipa,
            {
                meaningVN: word.meaningVN,
                collocations: word.collocations,
                verbCollocations: word.verbCollocations,
                synonyms: word.synonyms,
                antonyms: word.antonyms
            }
        );
        if (onClose) onClose();
    };

    return (
        <div className="flex flex-col items-center text-center p-2 space-y-6">
            <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Word of the Moment</span>
                <h2 className="text-4xl font-bold text-primary">{word.word}</h2>
                <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground font-mono">
                    <span className="text-amber-500/80">{word.ipa}</span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 hover:text-primary transition-colors"
                        onClick={() => speak(word.word)}
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="bg-secondary/30 p-4 rounded-xl border border-border/50 w-full">
                <p className="text-lg font-medium leading-relaxed mb-4">{word.definition}</p>
                <p className="text-sm italic text-muted-foreground">"{word.example}"</p>
            </div>

            <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={fetchWord}>
                    <RotateCw className="mr-2 h-4 w-4" /> Next Word
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                    <Plus className="mr-2 h-4 w-4" /> Save to Lab
                </Button>
            </div>
        </div>
    );
}
