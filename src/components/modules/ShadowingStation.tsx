"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square, Play, RefreshCw, Wand2, CheckCircle2, History, RotateCcw, AlertCircle, Loader2, Volume2, Turtle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTTS } from "@/hooks/useTTS";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShadowingResult {
    id: string;
    user_transcription: string;
    accuracy_score: number;
    prosody_feedback: string;
    detected_mistakes: string[];
}

interface HistoryItem {
    _id: string;
    targetText: string;
    userTranscription: string;
    accuracyScore: number;
    prosodyFeedback: string;
    createdAt: string;
}

export function ShadowingStation() {
    const [targetText, setTargetText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [result, setResult] = useState<ShadowingResult | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const { isRecording, startRecording, stopRecording, latestBlob, resetRecorder } = useAudioRecorder();
    const { speak } = useTTS();

    // Fetch history on mount
    useEffect(() => {
        fetchHistory();
    }, []);

    // Handle evaluation when blob is ready
    useEffect(() => {
        if (latestBlob && targetText) {
            evaluateShadowing(latestBlob);
        }
    }, [latestBlob]);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/shadowing/history");
            const data = await res.json();
            if (data.history) setHistory(data.history);
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    };

    const generateRandomText = async () => {
        setIsGenerating(true);
        setResult(null);
        try {
            const res = await fetch("/api/shadowing/random");
            const data = await res.json();
            if (data.text) setTargetText(data.text);
        } catch (e) {
            console.error("Failed to generate text", e);
        } finally {
            setIsGenerating(false);
        }
    };

    const evaluateShadowing = async (blob: Blob) => {
        setIsEvaluating(true);
        try {
            const formData = new FormData();
            formData.append("audio", blob);
            formData.append("targetText", targetText);

            const res = await fetch("/api/shadowing/evaluate", {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Evaluation failed");

            const data = await res.json();
            setResult(data);
            fetchHistory(); // Refresh history after new entry
        } catch (e) {
            console.error(e);
            alert("Failed to analyze your voice. Please try again.");
        } finally {
            setIsEvaluating(false);
            resetRecorder();
        }
    };

    const handleToggleMic = async () => {
        if (isRecording) {
            stopRecording();
        } else {
            setResult(null);
            try {
                await startRecording();
            } catch (err) {
                alert("Microphone access denied.");
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Shadowing Station</h1>
                        <p className="text-muted-foreground">Master English prosody with AI-powered feedback.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="lg:hidden">
                        <History className="w-4 h-4 mr-2" /> History
                    </Button>
                </div>

                {/* TARGET TEXT CARD */}
                <Card className="border-2 border-primary/20 bg-primary/5 shadow-inner">
                    <CardHeader className="pb-3 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                <Wand2 className="w-4 h-4" /> Target Material
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => speak(targetText)} disabled={!targetText} title="Listen Normal">
                                    <Volume2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => speak(targetText, { rate: 0.7 })} disabled={!targetText} title="Listen Slow">
                                    <Turtle className="w-4 h-4" />
                                </Button>
                                <Button variant="secondary" size="sm" onClick={generateRandomText} disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    New Text
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {targetText ? (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-2xl font-medium leading-relaxed"
                            >
                                {targetText}
                            </motion.p>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground italic">
                                Click "New Text" to get a practice sentence.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* RECORDING & FEEDBACK AREA */}
                {targetText && (
                    <div className="space-y-6">
                        <div className="flex justify-center py-4">
                            <Button
                                size="lg"
                                className={cn(
                                    "h-20 w-20 rounded-full shadow-xl transition-all hover:scale-105",
                                    isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/20" : "bg-primary"
                                )}
                                onClick={handleToggleMic}
                                disabled={isEvaluating}
                            >
                                {isEvaluating ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />
                                )}
                            </Button>
                        </div>

                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="md:col-span-1 border-emerald-500/30 bg-emerald-500/5">
                                            <CardContent className="pt-6 text-center">
                                                <div className="text-4xl font-black text-emerald-600 mb-1">{result.accuracy_score}%</div>
                                                <p className="text-xs font-bold uppercase text-emerald-700/70">Accuracy Score</p>
                                            </CardContent>
                                        </Card>

                                        <Card className="md:col-span-2 border-primary/30 bg-primary/5">
                                            <CardContent className="pt-6">
                                                <p className="text-xs font-bold uppercase text-primary/70 mb-2">Transcription</p>
                                                <p className="text-sm leading-relaxed italic">"{result.user_transcription}"</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-sm font-bold uppercase text-amber-700 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" /> Prosody Feedback
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <p className="text-sm leading-relaxed text-amber-900/80">{result.prosody_feedback}</p>

                                                {result.detected_mistakes.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {result.detected_mistakes.map((word, i) => (
                                                            <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200">
                                                                {word}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-center pt-4">
                                        <Button variant="outline" onClick={() => generateRandomText()} className="gap-2">
                                            <RotateCcw className="w-4 h-4" /> Next Challenge
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* HISTORY SIDEBAR */}
            <div className={cn(
                "w-full lg:w-80 border-l border-border bg-card/50 backdrop-blur rounded-2xl overflow-hidden flex flex-col transition-all",
                !showHistory && "hidden lg:flex"
            )}>
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" /> Recent Sessions
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => fetchHistory()}>
                        <RefreshCw className="w-3 h-3" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                    {history.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground/50 italic text-sm">
                            No sessions yet.
                        </div>
                    ) : (
                        history.map((item) => (
                            <button
                                key={item._id}
                                onClick={() => {
                                    setTargetText(item.targetText);
                                    setResult({
                                        id: item._id,
                                        user_transcription: item.userTranscription,
                                        accuracy_score: item.accuracyScore,
                                        prosody_feedback: item.prosodyFeedback,
                                        detected_mistakes: []
                                    });
                                }}
                                className="w-full text-left p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-primary/5 hover:border-primary/20 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                        item.accuracyScore >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {item.accuracyScore}%
                                    </span>
                                </div>
                                <p className="text-xs font-medium line-clamp-2 text-foreground/80 group-hover:text-foreground">
                                    {item.targetText}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
