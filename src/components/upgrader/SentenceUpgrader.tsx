"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowRight, BookOpen, CheckCircle2, Mic, Square, Loader2, Save, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useLevel } from "@/context/LevelContext";

export function SentenceUpgrader() {
    const { level } = useLevel();
    const [style, setStyle] = useState<"Academic" | "Casual" | "Business">("Academic");

    const [inputSentence, setInputSentence] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const { startRecording, stopRecording, latestBlob, resetRecorder } = useAudioRecorder();
    const [isActive, setIsActive] = useState(false);
    const activeRef = useRef(false);

    const [result, setResult] = useState<{
        upgraded_sentence: string;
        vietnamese_translation: string;
        grammar_note: string;
        explanation: string;
        syntax_analysis: string;
        vocabulary_suggestions: { word: string; definition: string; wordClass?: string; ipa?: string }[];
        highlighted_segments: string[];
    } | null>(null);

    const [error, setError] = useState<string | null>(null);
    const { addWord } = useVocabulary();
    const [isSaved, setIsSaved] = useState(false);

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (showHistory) fetchHistory();
    }, [showHistory]);

    // Handle transcription when recording stops
    useEffect(() => {
        const handleTranscription = async () => {
            if (!isActive && latestBlob && latestBlob.size > 0) {
                console.log("Upgrader: Transcribing audio blob...", latestBlob.size);
                setIsTranscribing(true);
                const currentBlob = latestBlob;
                resetRecorder();
                try {
                    const formData = new FormData();
                    formData.append("audio", currentBlob);

                    const res = await fetch("/api/transcribe-audio", {
                        method: "POST",
                        body: formData
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.error || `Server Error: ${res.status}`);
                    }

                    const contentType = res.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                        throw new Error("Server returned non-JSON response");
                    }

                    const data = await res.json();
                    if (data.text) {
                        setInputSentence(data.text);
                    } else if (data.error) {
                        console.error("Transcription error:", data.error);
                        setError("Could not transcribe audio.");
                    }
                } catch (e) {
                    console.error("Transcription failed:", e);
                    setError("Network error during transcription.");
                } finally {
                    setIsTranscribing(false);
                }
            }
        };

        handleTranscription();
    }, [latestBlob, isActive, resetRecorder]);

    const handleToggleMic = async () => {
        if (activeRef.current) {
            console.log("Upgrader: Stopping recording...");
            stopRecording();
            setIsActive(false);
            activeRef.current = false;
        } else {
            console.log("Upgrader: Starting recording...");
            setIsActive(true);
            activeRef.current = true;
            setError(null);
            try {
                await startRecording();
            } catch (err) {
                console.error("Mic access failed", err);
                setIsActive(false);
                activeRef.current = false;
                setError("Microphone access denied.");
            }
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/upgraded-sentences");
            const data = await res.json();
            setHistory(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAnalyze = async () => {
        if (!inputSentence.trim()) return;

        setIsAnalyzing(true);
        setError(null);
        setIsSaved(false);

        try {
            const response = await fetch("/api/upgrade-sentence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sentence: inputSentence, style, level: "C1" }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to upgrade sentence");
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Something went wrong. Please check your API key.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveWord = (word: string, def: string, wordClass?: string, ipa?: string) => {
        addWord(word, wordClass, def, result?.upgraded_sentence || "", ipa);
    };

    const handleSaveSentenceToLab = async () => {
        if (!result) return;
        const wordCount = result.upgraded_sentence.trim().split(/\s+/).length;
        const isSentence = wordCount > 10 || /[.!?]$/.test(result.upgraded_sentence.trim());
        const finalType = wordCount > 3 ? (isSentence ? 'sentence' : 'phrase') : 'word';

        const success = await addWord(
            result.upgraded_sentence,
            finalType === 'word' ? 'unknown' : (finalType === 'phrase' ? 'Academic Phrase' : 'Sentence Structure'),
            result.vietnamese_translation || result.explanation,
            inputSentence,
            undefined,
            {
                type: finalType,
                grammarNote: result.grammar_note || result.syntax_analysis,
                meaningVN: result.vietnamese_translation || result.explanation,
                translation: result.vietnamese_translation
            }
        );
        if (success) alert(`Saved as ${finalType} to Vocabulary Lab!`);
    };

    const handleExtractKeywords = async () => {
        if (!result?.vocabulary_suggestions) return;
        let count = 0;
        for (const vocab of result.vocabulary_suggestions) {
            await addWord(vocab.word, vocab.wordClass, vocab.definition, result.upgraded_sentence, vocab.ipa);
            count++;
        }
        alert(`Saved ${count} keywords to Lab.`);
    };

    const handleSaveSentence = async () => {
        if (!result) return;
        try {
            const res = await fetch("/api/upgraded-sentences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    originalSentence: inputSentence,
                    upgradedSentence: result.upgraded_sentence,
                    style,
                    level: "C1",
                    explanation: result.explanation
                })
            });

            if (res.ok) {
                fetchHistory();
                alert("Sentence saved to History!");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to save");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this sentence?")) return;
        try {
            await fetch(`/api/upgraded-sentences?id=${id}`, { method: "DELETE" });
            fetchHistory();
        } catch (err) {
            console.error(err);
        }
    };

    const styles = ["Academic", "Business", "Casual"];

    const renderHighlightedSentence = () => {
        if (!result) return null;
        return result.upgraded_sentence.split(" ").map((word, i) => {
            const cleanWord = word.replace(/[.,!?;]/g, "");
            const isSuggested = result.vocabulary_suggestions.some(s => s.word.toLowerCase().includes(cleanWord.toLowerCase()));

            return (
                <span key={i} className={isSuggested ? "text-indigo-600 font-bold" : ""}>
                    {word}{" "}
                </span>
            );
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 relative">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium uppercase tracking-wider border border-blue-500/20 mb-4">
                        <Sparkles className="w-3 h-3" />
                        AI Powered • {level} Target
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight mb-3">Sentence Upgrader</h2>
                    <p className="text-lg text-muted-foreground">
                        Refine your tone and syntax instantly using Cloud STT.
                    </p>
                </div>
                <Button variant="outline" onClick={() => setShowHistory(true)}>
                    <BookOpen className="w-4 h-4 mr-2" /> History
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Column */}
                <div className="space-y-6">
                    <Card className="border-2 border-border/50 h-full flex flex-col shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className=" text-lg">Input</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <div className="flex gap-2 p-1 bg-secondary rounded-lg">
                                {styles.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStyle(s as any)}
                                        className={cn(
                                            "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                            style === s
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground/80"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <div className="relative flex-1">
                                <Textarea
                                    placeholder={isTranscribing ? "Gemini is transcribing..." : "e.g., I want to say that..."}
                                    value={isTranscribing ? "Transcribing voice..." : inputSentence}
                                    onChange={(e) => setInputSentence(e.target.value)}
                                    className="w-full h-full min-h-[200px] resize-none text-lg p-4 bg-background/50 focus:bg-background border-dashed"
                                    disabled={isAnalyzing || isTranscribing}
                                />

                                <div className="absolute bottom-4 right-4 flex gap-2">
                                    <Button
                                        size="icon"
                                        variant={isActive ? "destructive" : "secondary"}
                                        className={cn("rounded-full h-12 w-12 shadow-lg", isActive && "animate-pulse scale-110", isTranscribing && "opacity-50")}
                                        onClick={handleToggleMic}
                                        disabled={isAnalyzing || isTranscribing}
                                    >
                                        {isTranscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : (isActive ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />)}
                                    </Button>
                                </div>
                            </div>

                            {error && <p className="text-xs text-red-500 font-medium px-2">{error}</p>}

                            <Button
                                className="w-full h-12 text-md font-semibold gap-2"
                                onClick={handleAnalyze}
                                disabled={!inputSentence || isAnalyzing || isTranscribing}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" /> Upgrade
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Output Column */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <Card className="border-2 border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
                                    <CardHeader className="bg-indigo-500/10 border-b border-indigo-500/10 py-3">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold bg-indigo-500 text-white px-2 py-0.5 rounded">
                                                        {style.toUpperCase()}
                                                    </span>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-6 text-xs text-indigo-300 hover:bg-indigo-500/20" onClick={handleSaveSentence}>
                                                    <Save className="w-3 h-3 mr-1" /> Save to History
                                                </Button>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <Button size="sm" variant="secondary" className="text-xs h-7" onClick={handleSaveSentenceToLab}>
                                                    <BookOpen className="w-3 h-3 mr-1" /> Save Sentence
                                                </Button>
                                                <Button size="sm" variant="secondary" className="text-xs h-7" onClick={handleExtractKeywords}>
                                                    <Sparkles className="w-3 h-3 mr-1" /> Extract Keywords
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="text-xl md:text-2xl font-serif text-foreground leading-relaxed">
                                            {renderHighlightedSentence()}
                                        </div>
                                    </CardContent>
                                    <div className="px-6 py-3 bg-indigo-500/10 border-t border-indigo-500/10 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                                        {result.vocabulary_suggestions.map((vocab, i) => (
                                            <Button
                                                key={i}
                                                size="sm"
                                                variant="outline"
                                                className="bg-background/50 border-indigo-200 hover:border-indigo-500 text-xs whitespace-nowrap"
                                                onClick={() => handleSaveWord(vocab.word, vocab.definition, vocab.wordClass, vocab.ipa)}
                                            >
                                                <BookOpen className="w-3 h-3 mr-1" />
                                                {vocab.word}
                                            </Button>
                                        ))}
                                    </div>
                                </Card>

                                <Card>
                                    <CardContent className="p-6 space-y-4">
                                        <div>
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4" /> Syntax Analysis
                                            </h4>
                                            <p className="text-sm leading-relaxed">{result.syntax_analysis}</p>
                                        </div>
                                        <div className="pt-4 border-t border-border/50">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                                Translation & Context
                                            </h4>
                                            <p className="text-sm text-muted-foreground">{result.explanation}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {!result && !isAnalyzing && (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 p-12 border-2 border-dashed border-border rounded-xl">
                                <ArrowRight className="w-12 h-12 mb-4" />
                                <p>Output will appear here</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* History Drawer/Dialog */}
            {showHistory && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        className="w-full max-w-md bg-background border-l shadow-2xl h-full p-6 overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">History</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {history.length === 0 ? <p className="text-muted-foreground">No saved sentences yet.</p> : history.map((item) => (
                                <Card key={item._id} className="relative group hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="text-xs font-mono bg-secondary px-2 py-1 rounded text-muted-foreground">{item.style}</div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleDelete(item._id, e)}
                                            >
                                                <span className="sr-only">Delete</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2 w-3 h-3"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <p className="text-sm text-muted-foreground line-through opacity-70">{item.originalSentence}</p>
                                        <p className="text-sm font-medium text-primary">{item.upgradedSentence}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
