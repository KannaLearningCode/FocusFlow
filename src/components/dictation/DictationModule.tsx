"use client";

import { useState, useRef, useEffect } from "react";
import { Play, RotateCcw, Check, Youtube, Loader2, ArrowLeft, ArrowRight, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface DictationModuleProps {
    script: string;
    audioUrl?: string; // Optional for now
}

interface Segment {
    text: string;
    duration: number;
    offset: number;
}

export function DictationModule({ script: initialScript, audioUrl: initialAudio = "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav" }: DictationModuleProps) {
    const [audioUrl, setAudioUrl] = useState(initialAudio);
    const [userInput, setUserInput] = useState("");
    const [isChecked, setIsChecked] = useState(false);

    // YouTube Import State
    const [ytUrl, setYtUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [enrichedData, setEnrichedData] = useState<any>(null);

    // Segment Logic
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(-1); // -1 means full mode
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const activeScript = currentSegmentIndex >= 0 ? segments[currentSegmentIndex]?.text : (segments.length > 0 ? segments.map(s => s.text).join(" ") : initialScript);

    const handleCheck = () => {
        setIsChecked(true);
    };

    const handleReset = () => {
        setUserInput("");
        setIsChecked(false);
    };

    const handleImport = async () => {
        if (!ytUrl) return;
        setIsLoading(true);
        handleReset();
        setSegments([]);
        setCurrentSegmentIndex(-1);
        setIsPlaying(false);

        try {
            const res = await fetch("/api/youtube-dictation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: ytUrl })
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setScript(data.transcript);
            // Use our own proxy to stream the audio fresh
            setAudioUrl(`/api/stream-audio?videoId=${data.videoId}`);
            setEnrichedData(data.enrichedData);
            setSegments(data.segments || []);

            // Start with first segment if available
            if (data.segments && data.segments.length > 0) {
                setCurrentSegmentIndex(0);
            }

        } catch (e) {
            console.error(e);
            alert("Failed to import from YouTube. Please try another video.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to set script text when available (for initial prop)
    const setScript = (text: string) => {
        // We only use this for fallback if segments fail, logic handles activeScript separately
    };

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            // If in segment mode, ensure we start from the correct offset
            if (currentSegmentIndex >= 0 && segments[currentSegmentIndex]) {
                const seg = segments[currentSegmentIndex];
                // Only reset time if we are far off (allow pausing and resuming within segment)
                const currentTimeMs = audioRef.current.currentTime * 1000;
                if (currentTimeMs < seg.offset || currentTimeMs > (seg.offset + seg.duration)) {
                    audioRef.current.currentTime = seg.offset / 1000;
                }
            }
            audioRef.current.play().catch(e => {
                console.error("Play failed:", e);
                alert("Audio playback failed. Please check the console.");
            });
            setIsPlaying(true);
        }
    };

    // Auto-pause at end of segment
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const checkTime = () => {
            if (currentSegmentIndex >= 0 && segments[currentSegmentIndex] && isPlaying) {
                const seg = segments[currentSegmentIndex];
                const endTime = (seg.offset + seg.duration) / 1000;

                if (audio.currentTime >= endTime) {
                    audio.pause();
                    setIsPlaying(false);
                    // Reset to start of segment for easy replay
                    audio.currentTime = seg.offset / 1000;
                }
            }
        };

        audio.addEventListener("timeupdate", checkTime);
        return () => audio.removeEventListener("timeupdate", checkTime);
    }, [currentSegmentIndex, segments, isPlaying]);

    const changeSegment = (direction: "next" | "prev") => {
        if (currentSegmentIndex === -1) return;
        const newIndex = direction === "next" ? currentSegmentIndex + 1 : currentSegmentIndex - 1;

        if (newIndex >= 0 && newIndex < segments.length) {
            setCurrentSegmentIndex(newIndex);
            handleReset();
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = segments[newIndex].offset / 1000;
            }
        }
    };

    // Simple word-by-word comparison
    const renderFeedback = () => {
        const targetWords = activeScript ? activeScript.split(/\s+/) : [];
        const userWords = userInput.split(/\s+/);

        return (
            <div className="text-xl leading-relaxed tracking-wide font-medium font-mono">
                {userWords.map((word, index) => {
                    const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:"']/g, "");
                    const targetWord = targetWords[index];
                    const isCorrect = targetWord && normalize(word) === normalize(targetWord);

                    return (
                        <motion.span
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={index}
                            className={`mr-2 inline-block ${isCorrect ? "text-green-400" : "text-red-400 decoration-wavy underline decoration-red-400/50"}`}
                        >
                            {word}
                        </motion.span>
                    );
                })}
                {userWords.length < targetWords.length && (
                    <span className="text-muted-foreground opacity-50 text-base ml-2">...</span>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            {/* HIDDEN AUDIO ELEMENT - Important for logic */}
            <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onError={(e) => console.error("Audio Error Event:", e)}
            />

            {/* YOUTUBE IMPORT */}
            <Card className="w-full max-w-3xl mx-auto border border-red-500/20 bg-red-500/5">
                <CardContent className="p-4 flex gap-4 items-center">
                    <div className="bg-red-500/10 p-2 rounded-lg text-red-600">
                        <Youtube className="w-6 h-6" />
                    </div>
                    <Input
                        placeholder="Paste YouTube Link here..."
                        value={ytUrl}
                        onChange={(e) => setYtUrl(e.target.value)}
                        className="bg-background"
                    />
                    <Button onClick={handleImport} disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                    </Button>
                </CardContent>
            </Card>

            <Card className="w-full max-w-3xl mx-auto shadow-2xl border-2 border-border/50">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span>Dictation</span>
                            {currentSegmentIndex >= 0 && (
                                <span className="text-sm font-light bg-secondary px-3 py-1 rounded-full text-muted-foreground">
                                    Segment {currentSegmentIndex + 1} / {segments.length}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {currentSegmentIndex >= 0 && (
                                <>
                                    <Button variant="outline" size="icon" onClick={() => changeSegment("prev")} disabled={currentSegmentIndex === 0}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => changeSegment("next")} disabled={currentSegmentIndex === segments.length - 1}>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            <Button variant="ghost" size="icon" onClick={handleReset} title="Reset">
                                <RotateCcw className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Controls */}
                    <div className="bg-secondary/50 p-6 rounded-xl flex items-center gap-6 border border-border/50 justify-center">
                        <Button
                            size="icon"
                            className="h-20 w-20 rounded-full shadow-lg hover:scale-105 transition-transform text-primary-foreground"
                            onClick={togglePlay}
                        >
                            {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
                        </Button>
                        <div className="text-center space-y-1">
                            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                {isPlaying ? "Playing Segment..." : "Click to Listen"}
                            </div>
                            {currentSegmentIndex >= 0 && <div className="text-xs text-muted-foreground opacity-50">Auto-pauses at end</div>}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="relative min-h-[200px]">
                        <AnimatePresence mode="wait">
                            {isChecked ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-6 bg-secondary/30 border border-border rounded-xl min-h-[200px]"
                                >
                                    {renderFeedback()}
                                    <div className="mt-8 pt-6 border-t border-border text-muted-foreground text-lg">
                                        <span className="text-sm uppercase tracking-wider font-bold block mb-2 text-primary/70">Correct Script</span>
                                        {activeScript}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Textarea
                                        placeholder="Listen and type what you hear..."
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        className="min-h-[200px] text-xl p-6 resize-none bg-background/50 focus:bg-background transition-colors border-2 focus:ring-0 focus:border-primary"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
                <CardFooter className="pb-8 px-8">
                    <Button
                        className="w-full text-lg h-14 font-semibold shadow-lg hover:shadow-primary/20 transition-all"
                        onClick={isChecked ? () => setIsChecked(false) : handleCheck}
                        disabled={!activeScript || isLoading}
                    >
                        {isChecked ? "Try Again" : "Check Answer"}
                        {!isChecked && <Check className="ml-2 h-6 w-6" />}
                    </Button>
                </CardFooter>
            </Card>

            {/* Highlights Section */}
            {enrichedData && (
                <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-amber-500/5 border-amber-500/20">
                        <CardHeader><CardTitle className="text-lg text-amber-600">Vocabulary Highlights</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {enrichedData.vocabulary_highlights?.map((item: any, i: number) => (
                                    <li key={i} className="text-sm">
                                        <span className="font-bold">{item.word}</span>: {item.definition}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-500/5 border-blue-500/20">
                        <CardHeader><CardTitle className="text-lg text-blue-600">Phonetic Focus</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {enrichedData.phonetic_highlights?.map((item: any, i: number) => (
                                    <li key={i} className="text-sm">
                                        <span className="font-bold">"{item.phrase}"</span> - {item.feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
