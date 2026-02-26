"use client";
import { useEffect } from "react";

import { useWordDiscovery } from "@/hooks/useWordDiscovery";
import { useVocabulary } from "@/context/VocabularyContext"; // Updated import
import { useTTS } from "@/hooks/useTTS";
import { useLevel } from "@/context/LevelContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Ensure we have this or use custom badge
import { Sparkles, Loader2, Volume2, Save, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function WordDiscoveryModal({ onClose }: { onClose?: () => void }) {
    const { level } = useLevel();
    const {
        discoveredWord,
        loading,
        error,
        discoverWord,
        resetDiscovery,
        categories
    } = useWordDiscovery();

    const { refresh } = useVocabulary(); // Use refresh instead of addWord
    const { speak } = useTTS();

    // Auto-refresh vocabulary list when a new word is discovered (since it's auto-saved)
    useEffect(() => {
        if (discoveredWord && !discoveredWord.isDuplicate) {
            refresh();
        }
    }, [discoveredWord, refresh]);

    const handleClose = () => {
        if (onClose) onClose();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-6 min-h-[400px]">
                <div className="relative">
                    <div className="h-16 w-16 bg-primary/20 rounded-full animate-ping absolute inset-0" />
                    <div className="h-16 w-16 bg-primary/20 rounded-full animate-pulse flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-primary animate-spin-slow" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold animate-pulse">Consulting the Archives...</h3>
                    <p className="text-muted-foreground text-sm">Searching for the perfect C1 word for you.</p>
                </div>
            </div>
        );
    }

    if (discoveredWord) {
        return (
            <div className="flex flex-col h-full space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={resetDiscovery} className="-ml-2 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Categories
                    </Button>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Discovery</span>
                </div>

                <div className="flex-1 flex flex-col items-center text-center space-y-6 py-4">
                    <div className="space-y-4 w-full">
                        <div className="space-y-2">
                            <h2 className="text-5xl font-bold text-primary tracking-tight">{discoveredWord.word}</h2>
                            <div className="flex items-center justify-center gap-3">
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm font-bold font-mono">
                                    {discoveredWord.wordClass}
                                </span>
                                <span className="text-xl text-muted-foreground font-mono text-amber-500/90 tracking-wide">
                                    {discoveredWord.ipa}
                                </span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                                    onClick={() => speak(discoveredWord.word)}
                                >
                                    <Volume2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-secondary/50 to-background border border-border/50 rounded-2xl p-6 shadow-sm">
                            <p className="text-xl font-medium leading-relaxed mb-4">{discoveredWord.definition}</p>
                            <p className="text-blue-200/90 font-medium mb-4 text-lg">{discoveredWord.meaningVN}</p>
                            <div className="relative">
                                <div className="absolute top-0 left-0 text-4xl text-primary/20 -translate-x-2 -translate-y-2">"</div>
                                <p className="text-muted-foreground italic relative z-10 px-4">
                                    {discoveredWord.example}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full text-xs text-left">
                        {discoveredWord.synonyms && discoveredWord.synonyms.length > 0 && (
                            <div className="bg-secondary/20 p-3 rounded-xl border border-border/30">
                                <span className="font-bold text-muted-foreground block mb-1">Synonyms</span>
                                <span className="text-foreground/80">{discoveredWord.synonyms.slice(0, 3).join(", ")}</span>
                            </div>
                        )}
                        {discoveredWord.collocations && discoveredWord.collocations.length > 0 && (
                            <div className="bg-secondary/20 p-3 rounded-xl border border-border/30">
                                <span className="font-bold text-muted-foreground block mb-1">Collocations</span>
                                <span className="text-foreground/80">{discoveredWord.collocations.slice(0, 2).join(", ")}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full">
                    {discoveredWord.isDuplicate ? (
                        <Button size="lg" variant="outline" className="w-full text-lg cursor-default border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-600">
                            <Sparkles className="mr-2 h-5 w-5" /> Already in Collection
                        </Button>
                    ) : (
                        <Button size="lg" variant="outline" className="w-full text-lg cursor-default border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-600">
                            <Save className="mr-2 h-5 w-5" /> Auto-Saved to Lab
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-bold">Discover New Words</h3>
                <p className="text-muted-foreground">Select a topic to generate a C1-level academic word.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => discoverWord(cat, undefined, level)}
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/30 hover:bg-primary/20 border border-border/50 hover:border-primary/50 transition-all duration-300 group text-center space-y-2"
                    >
                        <Sparkles className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-medium group-hover:text-primary transition-colors">{cat}</span>
                    </button>
                ))}
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 text-red-500 text-sm text-center">
                    {error}
                </div>
            )}
        </div>
    );
}
