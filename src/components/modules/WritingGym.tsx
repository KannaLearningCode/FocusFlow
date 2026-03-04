"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    PenTool,
    TrendingUp,
    Timer,
    RotateCcw,
    Zap,
    Lightbulb,
    ChevronRight,
    MessageSquare,
    Save,
    X,
    History,
    Trash2,
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useLevel } from "@/context/LevelContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type WorkoutMode = "sentence" | "paragraph" | "ielts";

interface GradingResult {
    band_score: number;
    breakdown: {
        TR: number;
        CC: number;
        LR: number;
        GRA: number;
    };
    examiner_comment: string;
    key_improvements: string[];
    detailed_corrections: {
        original_text: string;
        correction: string;
        type: string;
        explanation: string;
    }[];
}

interface SentenceChallenge {
    target_word: string;
    target_word_vn?: string;
    grammar_structure: string;
    instruction: string;
}

interface ParagraphChallenge {
    topic_sentence: string;
    keywords: string[];
    instruction: string;
}

interface Upgrade {
    level: string;
    text: string;
    explanation: string;
}

interface WritingSession {
    _id: string;
    mode: WorkoutMode;
    topic: string;
    input: string;
    level: string;
    result: GradingResult;
    createdAt: string;
}

export function WritingGym() {
    const { level } = useLevel();
    const { toast } = useToast();
    const [mode, setMode] = useState<WorkoutMode>("sentence");
    const [topic, setTopic] = useState("");
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isPromptLoading, setIsPromptLoading] = useState(false);
    const [challenge, setChallenge] = useState<SentenceChallenge | ParagraphChallenge | null>(null);
    const [result, setResult] = useState<GradingResult | null>(null);
    const [timeLeft, setTimeLeft] = useState(2400); // 40 mins for Task 2
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Feedback states
    const [selectedSentence, setSelectedSentence] = useState("");
    const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);

    // History states
    const [history, setHistory] = useState<WritingSession[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const editorRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning, timeLeft]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const res = await fetch("/api/writing/sessions");
            const data = await res.json();
            if (Array.isArray(data)) setHistory(data);
        } catch (e) {
            console.error("Failed to fetch history");
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleGeneratePrompt = async (selectedMode?: WorkoutMode) => {
        const activeMode = selectedMode || mode;
        setIsPromptLoading(true);
        setResult(null);
        setChallenge(null);
        setInput("");
        setUpgrades([]);

        if (activeMode === "ielts") {
            try {
                const res = await fetch("/api/writing/topic");
                const data = await res.json();
                if (data.topic) {
                    setTopic(data.topic);
                    setTimeLeft(2400);
                    setIsTimerRunning(true);
                }
            } catch (e) {
                toast({ title: "Error", description: "Failed to generate topic", variant: "destructive" });
            } finally {
                setIsPromptLoading(false);
            }
            return;
        }

        try {
            const res = await fetch("/api/writing/generate-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: activeMode, level })
            });
            const data = await res.json();
            setChallenge(data);
            setTopic(activeMode === "sentence" ? data.instruction : data.topic_sentence);
            setIsTimerRunning(false);
        } catch (e) {
            toast({ title: "Error", description: "Failed to generate prompt", variant: "destructive" });
        } finally {
            setIsPromptLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setResult(null);
        setUpgrades([]);

        try {
            const res = await fetch("/api/writing/grade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    essay: input
                })
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                toast({ title: "Analysis Failed", description: data.error || "Failed to parse grading result.", variant: "destructive" });
                return;
            }

            setResult(data);
            setIsTimerRunning(false);

            // Save session
            await fetch("/api/writing/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    topic,
                    input,
                    level,
                    result: data
                })
            });
            fetchHistory();
        } catch (e) {
            toast({ title: "Error", description: "Analysis failed", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSession = async (id: string) => {
        try {
            await fetch(`/api/writing/sessions?id=${id}`, { method: "DELETE" });
            setHistory((prev) => prev.filter((s) => s._id !== id));
            toast({ title: "Deleted" });
        } catch (e) {
            toast({ title: "Delete failed", variant: "destructive" });
        }
    };

    const restoreSession = (session: WritingSession) => {
        setMode(session.mode);
        setTopic(session.topic);
        setInput(session.input);
        setResult(session.result);
        setIsHistoryOpen(false);
    };

    // Text Selection Logic
    useEffect(() => {
        const handleSelection = () => {
            const sel = window.getSelection();
            if (sel && sel.toString().trim().length > 5 && editorRef.current?.contains(document.activeElement)) {
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                setSelection({
                    text: sel.toString().trim(),
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                });
            } else {
                setSelection(null);
            }
        };
        document.addEventListener("selectionchange", handleSelection);
        return () => document.removeEventListener("selectionchange", handleSelection);
    }, []);

    const handleUpgradeSentence = async (text: string) => {
        const target = text || selection?.text;
        if (!target) return;

        setSelectedSentence(target);
        setIsUpgrading(true);
        setUpgrades([]);
        setSelection(null);

        try {
            const res = await fetch("/api/writing/upgrade-sentence", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sentence: target, context: input })
            });
            const data = await res.json();
            setUpgrades(data.upgrades);
        } catch (e) {
            toast({ title: "Expansion failed", variant: "destructive" });
        } finally {
            setIsUpgrading(false);
        }
    };

    const switchMode = (newMode: WorkoutMode) => {
        setMode(newMode);
        handleGeneratePrompt(newMode);
    };

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)] w-full max-w-7xl mx-auto px-4 overflow-hidden relative">
            {/* Minimalist Top Nav */}
            <div className="flex items-center justify-between shrink-0 py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-600/10 rounded-lg">
                        <PenTool className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <span className="font-bold text-lg tracking-tight">Writing Gym</span>
                        <div className="flex gap-4 mt-1">
                            {(["sentence", "paragraph", "ielts"] as WorkoutMode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest transition-all pb-1 border-b-2",
                                        mode === m
                                            ? "text-orange-600 border-orange-600"
                                            : "text-muted-foreground border-transparent hover:text-foreground"
                                    )}
                                >
                                    {m === "sentence"
                                        ? "Sentence Builder"
                                        : m === "paragraph"
                                            ? "Paragraph Focus"
                                            : "IELTS Simulation"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {mode === "ielts" && isTimerRunning && (
                        <div
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-sm",
                                timeLeft < 300 ? "bg-red-500/10 text-red-600 animate-pulse" : "bg-secondary text-foreground"
                            )}
                        >
                            <Timer className="w-4 h-4" />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsHistoryOpen(true)}
                        className="rounded-full gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <History className="w-4 h-4" />
                        History
                    </Button>
                    <Button
                        onClick={() => handleGeneratePrompt()}
                        variant="outline"
                        size="sm"
                        disabled={isPromptLoading}
                        className="rounded-full gap-2 border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                        {isPromptLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        New Challenge
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-0 py-4">
                {/* Editor Area */}
                <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden min-h-0">
                    <Card className="flex-1 flex flex-col border-none shadow-none bg-secondary/10 rounded-3xl overflow-hidden ring-1 ring-border/50">
                        <CardHeader className="bg-background/40 backdrop-blur-sm border-b border-border/30 p-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Input Terminal
                                </CardTitle>
                                <div className="text-[10px] font-bold text-muted-foreground">
                                    Words: {input.trim().split(/\s+/).filter(Boolean).length}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                            <div className="p-6 bg-orange-600/5 border-b border-orange-600/10">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h3 className="text-xs font-black uppercase text-orange-600 mt-1">Current Goal</h3>
                                    {mode === "sentence" && challenge && 'target_word_vn' in challenge && challenge.target_word_vn && (
                                        <div className="bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-orange-700 border border-orange-600/20 shadow-sm flex items-center gap-2">
                                            <Lightbulb className="w-3 h-3" />
                                            <span>{challenge.target_word}: <span className="font-medium text-orange-600/80">{challenge.target_word_vn}</span></span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm font-medium leading-relaxed">
                                    {isPromptLoading ? "Generating..." : topic}
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-0 relative">
                                <Textarea
                                    ref={editorRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Write your response here..."
                                    className="w-full h-full min-h-[400px] p-8 bg-transparent border-none resize-none font-serif text-xl leading-[1.8] focus-visible:ring-0 placeholder:opacity-20 scrollbar-thin"
                                />

                                <AnimatePresence>
                                    {selection && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="fixed z-50 bg-background border border-border shadow-2xl rounded-xl p-1 flex gap-1"
                                            style={{ left: selection.x - 70, top: selection.y - 40 }}
                                        >
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 text-[10px] font-black uppercase text-orange-600 hover:bg-orange-50"
                                                onClick={() => handleUpgradeSentence("")}
                                            >
                                                <Zap className="w-3 h-3 mr-1.5" /> Upgrade
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3 shrink-0">
                        <Button
                            onClick={handleAnalyze}
                            disabled={isLoading || !input}
                            className="flex-1 rounded-2xl h-14 font-bold shadow-lg shadow-orange-600/20 bg-orange-600 hover:bg-orange-700 text-white gap-2 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                            Analyze & Grade Now
                        </Button>
                    </div>
                </div>

                {/* Feedback Area */}
                <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden min-h-0">
                    <Card className="flex-1 border-none shadow-none bg-background rounded-3xl overflow-hidden ring-1 ring-border/50 flex flex-col">
                        <CardHeader className="bg-secondary/5 border-b border-border/30 p-4 shrink-0">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Lab Results & Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 scrollbar-thin overflow-x-hidden">
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div
                                        key="grading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center p-10 text-center"
                                    >
                                        <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
                                        <h4 className="font-bold text-lg">IELTS Examiner is assessing...</h4>
                                        <p className="text-sm text-muted-foreground">Analyzing CR, CC, LR, and GRA parameters.</p>
                                    </motion.div>
                                ) : result ? (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6 pb-6"
                                    >
                                        <div className="flex items-end justify-between bg-orange-600/5 p-6 rounded-2xl border border-orange-600/10">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase text-orange-600 tracking-widest mb-1">
                                                    Estimated Band
                                                </h4>
                                                <div className="text-6xl font-black text-orange-600 tabular-nums">
                                                    {result.band_score}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 text-[10px] font-bold">
                                                <div className="px-2 py-1 bg-background rounded-md border text-center">
                                                    TR: {result.breakdown?.TR ?? "N/A"}
                                                </div>
                                                <div className="px-2 py-1 bg-background rounded-md border text-center">
                                                    CC: {result.breakdown?.CC ?? "N/A"}
                                                </div>
                                                <div className="px-2 py-1 bg-background rounded-md border text-center">
                                                    LR: {result.breakdown?.LR ?? "N/A"}
                                                </div>
                                                <div className="px-2 py-1 bg-background rounded-md border text-center">
                                                    GRA: {result.breakdown?.GRA ?? "N/A"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-secondary/20 rounded-xl text-sm italic border-l-4 border-orange-500 text-muted-foreground leading-relaxed">
                                            {result.examiner_comment}
                                        </div>

                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                                Targeted Corrections
                                            </h5>
                                            <div className="space-y-3">
                                                {result.detailed_corrections.map((c, i) => (
                                                    <div key={i} className="p-4 bg-secondary/10 rounded-2xl border border-border/50 text-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-black text-red-500 uppercase px-2 py-0.5 rounded-full bg-red-500/10">
                                                                {c.type}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-[10px] font-black uppercase hover:bg-orange-600 hover:text-white"
                                                                onClick={() => handleUpgradeSentence(c.original_text)}
                                                            >
                                                                Upgrade <ChevronRight className="w-3 h-3 ml-1" />
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-red-500/60 line-through text-xs font-serif italic">
                                                                {c.original_text}
                                                            </p>
                                                            <p className="text-green-600 font-bold font-serif">{c.correction}</p>
                                                        </div>
                                                        <p className="mt-2 text-[11px] text-muted-foreground border-l-2 border-border/50 pl-3">
                                                            {c.explanation}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : isUpgrading || upgrades.length > 0 ? (
                                    <motion.div
                                        key="upgrade"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                                Sentence Expander
                                            </h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setUpgrades([])}
                                                className="h-6 w-6 rounded-full p-0"
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        {isUpgrading ? (
                                            <div className="flex flex-col items-center justify-center p-20 py-40">
                                                <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                                    Optimizing Syntax...
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {upgrades.map((u, i) => (
                                                    <div
                                                        key={i}
                                                        className="p-5 bg-background border border-border rounded-3xl space-y-3 shadow-sm hover:border-orange-200 transition-colors group"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span
                                                                className={cn(
                                                                    "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                                                                    u.level.includes("B2")
                                                                        ? "bg-green-500/10 text-green-600"
                                                                        : u.level.includes("C1")
                                                                            ? "bg-orange-500/10 text-orange-600"
                                                                            : "bg-purple-500/10 text-purple-600"
                                                                )}
                                                            >
                                                                {u.level}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-serif font-bold leading-relaxed">{u.text}</p>
                                                        <p className="text-[11px] text-muted-foreground border-l-2 border-border/50 pl-3">
                                                            {u.explanation}
                                                        </p>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full h-8 text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                setInput(input.replace(selectedSentence, u.text));
                                                                setUpgrades([]);
                                                                toast({ title: "Sentence Updated!" });
                                                            }}
                                                        >
                                                            Apply Replacement <Save className="w-3 h-3 ml-2" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
                                        <div className="p-10 bg-orange-600/5 rounded-full">
                                            <TrendingUp className="w-12 h-12 text-orange-600 opacity-20" />
                                        </div>
                                        <h4 className="font-bold uppercase tracking-widest text-xs opacity-50">Analysis Ready</h4>
                                        <p className="text-sm max-w-xs opacity-40">
                                            Start writing to see your band score and detailed feedback here.
                                        </p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* History Sidebar/Drawer */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsHistoryOpen(false)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            className="fixed right-0 top-0 h-full w-full max-w-sm bg-background border-l border-border z-[60] shadow-2xl flex flex-col pt-[72px]"
                        >
                            <div className="p-6 border-b border-border/50 flex items-center justify-between">
                                <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                    <History className="w-4 h-4" /> Writing History
                                </h3>
                                <Button variant="ghost" size="sm" onClick={() => setIsHistoryOpen(false)} className="rounded-full h-8 w-8 p-0">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {isHistoryLoading ? (
                                    <div className="flex flex-col items-center justify-center h-40 opacity-20">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-20 opacity-20">
                                        <History className="w-10 h-10 mx-auto mb-2" />
                                        <p className="text-xs font-bold uppercase">No history found</p>
                                    </div>
                                ) : (
                                    history.map((s) => (
                                        <div
                                            key={s._id}
                                            className="group p-4 bg-secondary/10 rounded-2xl border border-border/50 hover:border-orange-500/30 transition-all cursor-pointer relative"
                                            onClick={() => restoreSession(s)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-600/10 px-2 py-0.5 rounded">
                                                    {s.mode}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(s.createdAt), "MMM d, HH:mm")}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold line-clamp-2 mb-3 leading-relaxed opacity-80">{s.topic}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="text-lg font-black text-orange-600">{s.result?.band_score}</div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteSession(s._id);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
