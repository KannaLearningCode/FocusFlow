"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, Play, RefreshCw, Wand2, Volume2, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioRecorder } from "@/hooks/useAudioRecorder"; // Basic recorder for playback
import { cn } from "@/lib/utils";
import { ConversationSimulator } from "./ConversationSimulator";
import { WordAlignment } from "./WordAlignment";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap, Info } from "lucide-react";

interface AnalysisResult {
    original_transcription: string;
    upgraded_text: string;
    grammar_corrections: string;
    pronunciation_tips: string;
    score: number;
}

export function PhoneticStudio() {
    const { isRecording, startRecording, stopRecording, latestBlob, resetRecorder } = useAudioRecorder();

    // Combined state for recording/listening
    const [isActive, setIsActive] = useState(false);
    const activeRef = useRef(false);
    const [finalTranscript, setFinalTranscript] = useState("");
    const [referenceText, setReferenceText] = useState("");
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Effect to handle Cloud STT when recording stops and we have a blob
    useEffect(() => {
        console.log("Phonetics Studio: latestBlob effect triggered", { isActive, hasBlob: !!latestBlob });
        if (!isActive && latestBlob) {
            handleCloudTranscription(latestBlob);
            resetRecorder();
        }
    }, [latestBlob, isActive, resetRecorder]);

    const handleCloudTranscription = useCallback(async (blob: Blob) => {
        console.log("Phonetics Studio: Starting cloud transcription...", {
            size: blob.size,
            type: blob.type
        });
        setIsAnalyzing(true);
        setFinalTranscript("");
        setAnalysis(null);

        try {
            const formData = new FormData();
            formData.append("audio", blob);

            console.log("Phonetics Studio: Sending request to /api/transcribe-audio...");
            const res = await fetch("/api/transcribe-audio", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Phonetics Studio: Cloud STT API returned error:", res.status, errorData);
                throw new Error(errorData.error || "Cloud STT failed");
            }

            const data = await res.json();
            console.log("Phonetics Studio: Cloud STT successful:", data);
            setFinalTranscript(data.original_transcription);
            setAnalysis(data);
        } catch (e: any) {
            console.error("Phonetics Studio: Cloud Transcription Error:", e);
            alert(`Cloud Transcription failed: ${e.message || "Please try again."}`);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const toggleRecording = async () => {
        console.log("Phonetics Studio: toggleRecording clicked. current isActive:", isActive, "activeRef:", activeRef.current);

        if (activeRef.current) {
            console.log("Phonetics Studio: Stopping recording...");
            stopRecording();
            setIsActive(false);
            activeRef.current = false;
        } else {
            console.log("Phonetics Studio: Starting recording setup...");
            setFinalTranscript("");
            setAnalysis(null);
            setIsActive(true);
            activeRef.current = true;

            // Start Audio Recorder (Cloud STT doesn't contend with SpeechRecognition)
            try {
                console.log("Phonetics Studio: Requesting audio capture...");
                await startRecording();
            } catch (err: any) {
                console.warn("Phonetics Studio: Recorder error.", err);
                setIsActive(false);
                activeRef.current = false;
                alert("Could not access microphone.");
            }
        }
    };

    const handleAnalyze = async () => {
        if (!finalTranscript) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/analyze-speech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: finalTranscript })
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
            setAnalysis(data);
        } catch (e: any) {
            console.error(e);
            alert(`Analysis failed: ${e.message || "Please check your connection."}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const [activeTab, setActiveTab] = useState<"analysis" | "conversation">("analysis");


    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium uppercase tracking-wider border border-purple-500/20 mb-4">
                        <Wand2 className="w-3 h-3" />
                        AI Phonetics Coach
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Phonetic Studio</h2>
                    <p className="text-muted-foreground">Master your pronunciation with real-time feedback and dialogue.</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-secondary/50 rounded-lg border border-border/50">
                    <button
                        onClick={() => setActiveTab("analysis")}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            activeTab === "analysis" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Detailed Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab("conversation")}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            activeTab === "conversation" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Conversation Mode
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === "analysis" ? (
                    <motion.div
                        key="analysis"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid gap-8 md:grid-cols-2"
                    >
                        {/* LEFT COLUMN: SETUP & MIC */}
                        <div className="space-y-6">
                            {/* SHADOWING REFERENCE */}
                            <Card className="border border-purple-500/20 bg-purple-500/5 overflow-hidden">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-purple-600 font-bold uppercase text-[10px] tracking-wider">
                                            <Wand2 className="w-3 h-3" /> Shadowing Goal
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Textarea
                                            placeholder="Enter a sentence to shadow (e.g., 'The quick brown fox jumps over the lazy dog')"
                                            value={referenceText}
                                            onChange={(e) => setReferenceText(e.target.value)}
                                            className="min-h-[60px] bg-background/50 border-purple-500/10 focus:border-purple-500/30 resize-none text-sm placeholder:text-muted-foreground/40"
                                        />
                                        {referenceText && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute bottom-2 right-2 h-6 w-6 opacity-40 hover:opacity-100"
                                                onClick={() => setReferenceText("")}
                                            >
                                                <RefreshCw className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1.5 pt-2">
                                        <div className="flex items-center gap-1.5 text-[10px] text-purple-600 bg-purple-500/10 p-2 rounded border border-purple-500/20">
                                            <Sparkles className="w-3 h-3 shrink-0" />
                                            Gemini Cloud STT Enabled: High reliability, no network errors.
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
                                <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center space-y-8">

                                    {/* Visualizer / Status / Feedback */}
                                    <div className="w-full flex flex-col items-center gap-6">
                                        {referenceText && !isActive && finalTranscript && !isAnalyzing && (
                                            <div className="w-full p-4 bg-background/80 rounded-2xl border border-dashed border-purple-500/20 mb-2">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Alignment Score</p>
                                                <WordAlignment reference={referenceText} userInput={finalTranscript} />
                                            </div>
                                        )}

                                        <div className="relative">
                                            {isActive && (
                                                <div className="absolute inset-0 rounded-full animate-ping bg-purple-500/20" />
                                            )}
                                            <Button
                                                size="icon"
                                                className={cn(
                                                    "h-24 w-24 rounded-full transition-all duration-300 shadow-2xl",
                                                    isActive
                                                        ? "bg-purple-600 hover:bg-purple-700 scale-110"
                                                        : "bg-primary hover:bg-primary/90"
                                                )}
                                                onClick={toggleRecording}
                                                disabled={isAnalyzing}
                                            >
                                                {isActive
                                                    ? <Square className="h-8 w-8 fill-current" />
                                                    : (isAnalyzing ? <Loader2 className="h-10 w-10 animate-spin" /> : <Mic className="h-10 w-10" />)}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold">
                                            {isAnalyzing ? "AI is listening to you..." : (isActive ? "Recording..." : (referenceText ? "Challenge: Read Out Loud" : "Tap to Speak"))}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">
                                            {isAnalyzing ? "Gemini is processing your voice..." : (isActive ? "Say the sentence clearly" : "Speak anything to explore sounds")}
                                        </p>
                                    </div>

                                    {audioUrl && !isActive && !isAnalyzing && (
                                        <div className="flex gap-2">
                                            <audio src={audioUrl} controls className="hidden" id="audio-playback" />
                                            <Button variant="outline" size="sm" onClick={() => (document.getElementById('audio-playback') as HTMLAudioElement)?.play()}>
                                                <Play className="w-4 h-4 mr-2" /> Replay My Voice
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => { setFinalTranscript(""); setAnalysis(null); }}>
                                                <RefreshCw className="w-4 h-4 mr-2" /> Reset
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* TRANSCRIPT AREA */}
                            <div className="bg-secondary/20 rounded-xl p-4 border border-border/50 min-h-[100px]">
                                <span className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Transcription</span>

                                {isActive ? (
                                    <p className="text-lg font-medium leading-relaxed animate-pulse">
                                        <span className="text-muted-foreground/30 italic">Listening...</span>
                                    </p>
                                ) : (
                                    <Textarea
                                        value={finalTranscript}
                                        onChange={(e) => setFinalTranscript(e.target.value)}
                                        placeholder="Your speech will appear here. Edit manually if needed..."
                                        className="text-lg font-medium bg-transparent border-0 p-0 focus-visible:ring-0 resize-none min-h-[80px] placeholder:text-muted-foreground/30"
                                    />
                                )}
                            </div>

                            {!isActive && finalTranscript && !analysis && (
                                <Button className="w-full h-12 text-lg" onClick={handleAnalyze} disabled={isAnalyzing}>
                                    {isAnalyzing ? "Analyzing..." : "Analyze Speech"}
                                    {!isAnalyzing && <ArrowRight className="ml-2 w-5 h-5" />}
                                </Button>
                            )}
                        </div>

                        {/* ANALYSIS RESULTS */}
                        <div className="space-y-6">
                            <AnimatePresence mode="wait">
                                {analysis ? (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-6"
                                    >
                                        {/* Score */}
                                        <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-xl border border-border/50">
                                            <span className="font-bold text-muted-foreground">Accuracy Score</span>
                                            <span className={cn("text-2xl font-bold font-mono", analysis.score > 7 ? "text-green-500" : "text-amber-500")}>
                                                {analysis.score}/10
                                            </span>
                                        </div>

                                        {/* Upgraded Version */}
                                        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground text-xs font-bold rounded-bl-lg">
                                                BETTER WAY TO SAY IT
                                            </div>
                                            <p className="text-xl font-medium text-primary mt-2">"{analysis.upgraded_text}"</p>
                                        </div>

                                        {/* Grammar */}
                                        <div className="bg-card border border-border/50 p-5 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold uppercase text-xs tracking-wider">
                                                <Wand2 className="w-4 h-4" /> Grammar Check
                                            </div>
                                            <p className="text-muted-foreground">{analysis.grammar_corrections}</p>
                                        </div>

                                        {/* Pronunciation */}
                                        <div className="bg-card border border-border/50 p-5 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-2 mb-3 text-pink-400 font-bold uppercase text-xs tracking-wider">
                                                <Volume2 className="w-4 h-4" /> Pronunciation Tips
                                            </div>
                                            <p className="text-muted-foreground">{analysis.pronunciation_tips}</p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/40 p-8 border-2 border-dashed border-border/30 rounded-xl">
                                        <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                                            <Wand2 className="w-8 h-8 opacity-50" />
                                        </div>
                                        <p>Record and analyze your speech to see AI feedback here.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="conversation"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <ConversationSimulator />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
