"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, Play, RefreshCw, Wand2, CheckCircle2, History, RotateCcw, AlertCircle, Loader2, Volume2, Turtle, Settings2, SkipForward, Repeat, Pause, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTTS } from "@/hooks/useTTS";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ShadowingScript {
    text: string;
    start: number;
    end: number;
}

interface ShadowingResult {
    id: string;
    user_transcription: string;
    accuracy_score: number;
    fluency_score: number;
    prosody_feedback: string;
    detected_mistakes: string[];
}

interface HistoryItem {
    _id: string;
    targetText: string;
    userTranscription: string;
    accuracyScore: number;
    fluencyScore?: number;
    prosodyFeedback: string;
    detectedMistakes?: string[];
    createdAt: string;
}

export function ShadowingStation() {
    const [targetText, setTargetText] = useState("");
    const [script, setScript] = useState<ShadowingScript[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [result, setResult] = useState<ShadowingResult | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Audio Controls
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);
    const [isLooping, setIsLooping] = useState(false);
    const [autoPause, setAutoPause] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [shadowingMode, setShadowingMode] = useState(true);

    // Dictionary State
    const [explainingWord, setExplainingWord] = useState<string | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);

    const { isRecording, startRecording, stopRecording, latestBlob, stream, resetRecorder } = useAudioRecorder();
    const { speak, cancel } = useTTS();

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (latestBlob && targetText) {
            evaluateShadowing(latestBlob);
        }
    }, [latestBlob, targetText]);

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
        setScript([]);
        setActiveSentenceIndex(-1);
        setIsPlaying(false);
        cancel();
        try {
            const res = await fetch("/api/shadowing/random");
            const data = await res.json();
            if (data.text) {
                setTargetText(data.text);
                setScript(data.script || []);
            }
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
            fetchHistory();
        } catch (e) {
            console.error(e);
            alert("Failed to analyze your voice.");
        } finally {
            setIsEvaluating(false);
            resetRecorder();
        }
    };

    const handlePlay = useCallback((index: number = 0) => {
        if (!script.length && !targetText) return;

        setIsPlaying(true);

        if (!script.length) {
            setActiveSentenceIndex(0);
            speak(targetText, {
                rate: playbackRate,
                onEnd: () => {
                    setIsPlaying(false);
                    setActiveSentenceIndex(-1);
                    if (isRecording && shadowingMode) stopRecording();
                }
            });
            return;
        }

        const playSentence = (idx: number) => {
            if (idx >= script.length) {
                setIsPlaying(false);
                setActiveSentenceIndex(-1);
                if (isRecording && shadowingMode) stopRecording();
                return;
            }

            setActiveSentenceIndex(idx);
            speak(script[idx].text, {
                rate: playbackRate,
                onEnd: () => {
                    if (isLooping) {
                        setTimeout(() => playSentence(idx), 500);
                    } else if (autoPause) {
                        setIsPlaying(false);
                        if (isRecording && shadowingMode) stopRecording();
                    } else {
                        playSentence(idx + 1);
                    }
                }
            });
        };

        playSentence(index);
    }, [script, targetText, playbackRate, isLooping, autoPause, speak, isRecording, shadowingMode, stopRecording]);

    const handleTogglePlay = () => {
        if (isPlaying) {
            cancel();
            setIsPlaying(false);
        } else {
            handlePlay(activeSentenceIndex === -1 ? 0 : activeSentenceIndex);
        }
    };

    const handleToggleRecording = async () => {
        if (isRecording) {
            stopRecording();
            cancel();
            setIsPlaying(false);
        } else {
            await startRecording();
            if (shadowingMode) {
                handlePlay(0);
            }
        }
    };

    const handleWordClick = async (word: string) => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, "");
        if (!cleanWord) return;

        setExplainingWord(cleanWord);
        setExplanation(null);
        try {
            const res = await fetch("/api/dashboard/explain", {
                method: "POST",
                body: JSON.stringify({ query: `What does "${cleanWord}" mean in the context of: ${targetText}` })
            });
            const data = await res.json();
            setExplanation(data.explanation);
        } catch (e) {
            setExplanation("Failed to fetch explanation.");
        }
    };

    const renderTrainingLog = () => (
        <div className="flex flex-col h-full max-h-[70vh]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
                <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" /> Training History
                </h3>
                <Button variant="ghost" size="icon" onClick={fetchHistory} className="h-8 w-8 rounded-full">
                    <RefreshCw className="w-3 h-3" />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {history.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground/40 italic text-sm">No training records found.</div>
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
                                    fluency_score: item.fluencyScore || 0,
                                    prosody_feedback: item.prosodyFeedback,
                                    detected_mistakes: item.detectedMistakes || []
                                });
                                setShowHistory(false);
                            }}
                            className="w-full text-left p-4 rounded-2xl border border-border/50 bg-background/40 hover:bg-primary/5 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{new Date(item.createdAt).toLocaleDateString()}</span>
                                <span className={cn(
                                    "text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm",
                                    item.accuracyScore >= 80 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                )}>
                                    {item.accuracyScore}%
                                </span>
                            </div>
                            <p className="text-xs font-semibold line-clamp-2 text-foreground/80 leading-relaxed">{item.targetText}</p>
                        </button>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-120px)] w-full">
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Shadowing Station 2.0</h1>
                        <p className="text-muted-foreground">Master native pronunciation with brutally honest AI feedback.</p>
                    </div>

                    <Dialog open={showHistory} onOpenChange={setShowHistory}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="hidden lg:flex gap-2 rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10">
                                <History className="w-4 h-4" /> Training Log
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-border/50 shadow-2xl bg-card/95 backdrop-blur-xl">
                            {renderTrainingLog()}
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="border-2 border-primary/20 bg-primary/5 shadow-inner overflow-hidden flex flex-col transition-all">
                    <CardHeader className="pb-3 border-b border-primary/10 bg-background/40 backdrop-blur-sm shrink-0">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    className={cn(
                                        "h-12 w-12 rounded-full shadow-lg transition-all",
                                        isPlaying ? "bg-primary" : "bg-primary/80 hover:bg-primary"
                                    )}
                                    onClick={handleTogglePlay}
                                    disabled={!targetText || isRecording}
                                >
                                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handlePlay(activeSentenceIndex === -1 ? 0 : activeSentenceIndex)} disabled={!targetText || isRecording}>
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={isLooping ? "secondary" : "ghost"}
                                    size="icon"
                                    onClick={() => setIsLooping(!isLooping)}
                                    className={isLooping ? "bg-primary/20 text-primary" : ""}
                                    title="A/B Loop Current Sentence"
                                    disabled={isRecording}
                                >
                                    <Repeat className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="flex flex-col gap-1 min-w-[140px]">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground mb-1">
                                        <span>Playback Speed</span>
                                        <span className="text-primary font-mono">{playbackRate.toFixed(2)}x</span>
                                    </div>
                                    <Slider
                                        value={[playbackRate]}
                                        min={0.5}
                                        max={1.5}
                                        step={0.1}
                                        onValueChange={(v: number[]) => setPlaybackRate(v[0])}
                                        className="cursor-pointer"
                                        disabled={isRecording}
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
                                    <Switch checked={autoPause} onCheckedChange={setAutoPause} id="auto-pause" disabled={isRecording} />
                                    <Label htmlFor="auto-pause" className="text-[10px] font-bold uppercase cursor-pointer select-none">Auto-Pause</Label>
                                </div>
                            </div>

                            <Button variant="secondary" size="sm" onClick={generateRandomText} disabled={isGenerating || isRecording} className="shadow-sm">
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                New Material
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-10 pb-8 px-10 flex-1">
                        {targetText ? (
                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-x-2 gap-y-3 text-2xl font-medium leading-relaxed">
                                    {script.length > 0 ? script.map((s, i) => (
                                        <motion.span
                                            key={i}
                                            animate={{
                                                color: activeSentenceIndex === i ? "var(--primary)" : "var(--foreground)",
                                                opacity: activeSentenceIndex === i ? 1 : 0.4,
                                                scale: activeSentenceIndex === i ? 1.02 : 1
                                            }}
                                            className={cn(
                                                "cursor-pointer transition-all rounded-lg px-2 py-1",
                                                activeSentenceIndex === i && "bg-primary/10 shadow-sm ring-1 ring-primary/20"
                                            )}
                                            onClick={() => !isRecording && handlePlay(i)}
                                        >
                                            {s.text.split(" ").map((word, wi) => (
                                                <span
                                                    key={wi}
                                                    className="hover:text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all inline-block mr-1.5"
                                                    onClick={(e) => { e.stopPropagation(); handleWordClick(word); }}
                                                >
                                                    {word}
                                                </span>
                                            ))}
                                        </motion.span>
                                    )) : (
                                        <p className="text-primary/80">{targetText}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="py-16 text-center text-muted-foreground italic flex flex-col items-center gap-4">
                                <Wand2 className="w-12 h-12 opacity-20" />
                                <p>Click "New Material" to start your shadowing session.</p>
                            </div>
                        )}
                    </CardContent>

                    <AnimatePresence>
                        {targetText && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border-t border-primary/10 bg-primary/5 p-4"
                            >
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="flex items-center gap-4 bg-background/40 backdrop-blur-md p-2 pl-4 rounded-full border border-border/50 shadow-lg shrink-0">
                                        <div className="flex items-center gap-2 mr-4 border-r pr-4 border-border/50">
                                            <Switch checked={shadowingMode} onCheckedChange={setShadowingMode} id="shadowing-mode" />
                                            <Label htmlFor="shadowing-mode" className="text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-amber-500" /> Shadowing
                                            </Label>
                                        </div>

                                        <Button
                                            size="icon"
                                            className={cn(
                                                "h-14 w-14 rounded-full shadow-2xl transition-all transform active:scale-95 shrink-0",
                                                isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/20" : "bg-primary"
                                            )}
                                            onClick={handleToggleRecording}
                                            disabled={isEvaluating}
                                        >
                                            {isEvaluating ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />
                                            )}
                                        </Button>
                                    </div>

                                    <div className="flex-1 w-full flex flex-col gap-2">
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                            <span>Voice Activity</span>
                                            {shadowingMode && (
                                                <span className="text-amber-600 flex items-center gap-1 animate-pulse">
                                                    <Volume2 className="w-3 h-3" /> Headphones Recommended
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-background/40 rounded-xl p-2 border border-border/50 h-16 relative group overflow-hidden">
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                                                <WaveformVisualizer stream={stream} isRecording={isRecording} color={isRecording ? "#ef4444" : "#6366f1"} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>

                <AnimatePresence>
                    {result && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm h-full">
                                    <CardContent className="pt-6 grid grid-cols-2 gap-8 divide-x divide-emerald-500/10 h-full items-center">
                                        <div className="text-center px-4">
                                            <div className="text-5xl font-black text-emerald-600 mb-1">{result.accuracy_score}%</div>
                                            <p className="text-[10px] font-bold uppercase text-emerald-700/60 tracking-[0.2em]">Accuracy</p>
                                        </div>
                                        <div className="text-center px-4">
                                            <div className="text-5xl font-black text-indigo-600 mb-1">{result.fluency_score || 0}%</div>
                                            <p className="text-[10px] font-bold uppercase text-indigo-700/60 tracking-[0.2em]">Fluency</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <Card className="border-amber-500/30 bg-amber-500/5 shadow-md h-full">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-black uppercase text-amber-700 flex items-center gap-2 tracking-widest">
                                            <AlertCircle className="w-4 h-4" /> Performance Report
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-xs leading-relaxed text-amber-900/80 font-medium">{result.prosody_feedback}</p>
                                        {result.detected_mistakes?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {result.detected_mistakes.map((word, i) => (
                                                    <span key={i} className="px-3 py-1 bg-red-100/30 text-red-700 rounded-full text-[10px] font-bold border border-red-200">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <Dialog open={explainingWord !== null} onOpenChange={(open) => !open && setExplainingWord(null)}>
                <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-3xl p-8">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-black mb-4">
                        <div className="p-2 bg-primary/10 rounded-xl"><Search className="w-6 h-6 text-primary" /></div>
                        Definition: <span className="text-primary italic">{explainingWord}</span>
                    </DialogTitle>
                    <div className="space-y-6">
                        {explanation ? (
                            <div className="text-sm leading-relaxed text-foreground/80 bg-secondary/30 p-5 rounded-2xl border border-border/50 animate-in fade-in zoom-in-95 duration-300">
                                {explanation}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-[10px] font-bold uppercase text-muted-foreground animate-pulse">Querying AI Explainer...</p>
                            </div>
                        )}
                        <Button className="w-full rounded-xl h-12 text-sm font-bold shadow-lg" onClick={() => setExplainingWord(null)}>
                            Close Dictionary
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
