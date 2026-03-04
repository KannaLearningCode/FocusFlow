"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square, Play, RotateCcw, Sparkles, MessageSquare, Turtle, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConversation } from "@/hooks/useConversation";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function ConversationSimulator() {
    const {
        messages,
        isThinking,
        sendMessage,
        sendVoiceMessage,
        resetConversation,
        replayLastAi,
        currentAiResponse,
        error: backendError,
        isIELTSMode,
        setIsIELTSMode,
        testResults,
        isTestCompleted
    } = useConversation();

    const { isRecording, startRecording, stopRecording, latestBlob, resetRecorder } = useAudioRecorder();
    const [isActive, setIsActive] = useState(false);
    const activeRef = useRef(false);
    const [manualInput, setManualInput] = useState("");

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isThinking]);

    // Handle recording completion
    useEffect(() => {
        if (!isActive && latestBlob) {
            console.log("Conversation: Sending voice message...", latestBlob.size);
            sendVoiceMessage(latestBlob);
            resetRecorder();
        }
    }, [latestBlob, isActive, sendVoiceMessage, resetRecorder]);

    const startIELTSTest = () => {
        resetConversation();
        setIsIELTSMode(true);
    };

    const handleToggleMic = async () => {
        if (activeRef.current) {
            console.log("Conversation: Stopping mic...");
            stopRecording();
            setIsActive(false);
            activeRef.current = false;
        } else {
            console.log("Conversation: Starting mic...");
            setIsActive(true);
            activeRef.current = true;
            try {
                await startRecording();
            } catch (err) {
                console.error("Mic access failed", err);
                setIsActive(false);
                activeRef.current = false;
                alert("Could not access microphone.");
            }
        }
    };

    const handleSend = async (text: string) => {
        if (!text.trim()) return;
        await sendMessage(text);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* CHAT AREA */}
            <div className="lg:col-span-2 flex flex-col h-full bg-secondary/10 rounded-2xl border border-border/50 overflow-hidden relative">
                <div className="p-4 border-b border-border/10 flex items-center justify-between bg-card/50 backdrop-blur">
                    <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg", isIELTSMode ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10")}>
                            <Sparkles className={cn("w-4 h-4", isIELTSMode ? "text-amber-600" : "text-primary")} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">{isIELTSMode ? "IELTS Examiner" : "Linguistic Partner"}</h3>
                            <p className="text-xs text-muted-foreground">{isIELTSMode ? "Formal Speaking Test" : ""}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isIELTSMode ? (
                            <Button variant="outline" size="sm" onClick={startIELTSTest} className="text-xs border-amber-500/50 text-amber-600 hover:bg-amber-50">
                                Start IELTS Test
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => setIsIELTSMode(false)} className="text-xs text-muted-foreground">
                                Exit Test
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={resetConversation} title="Reset Chat">
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground/40 mt-20">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>{isIELTSMode ? "Start speaking to begin the mock IELTS interview." : "Start speaking to begin the conversation."}</p>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex w-full mb-4",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-card border border-border/50 rounded-bl-none"
                                )}>
                                    {msg.text}
                                </div>
                            </motion.div>
                        ))}

                        {isThinking && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                                </div>
                            </motion.div>
                        )}
                        {/* Invisible element to scroll to */}
                        <div ref={scrollRef} />
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="p-4 bg-background border-t border-border/10 space-y-3">
                    {backendError && (
                        <div className="bg-destructive/10 text-destructive text-xs p-2 rounded flex items-center justify-between">
                            <span>Error: {backendError}</span>
                            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => window.location.reload()}>Retry</Button>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <input
                                className="w-full bg-secondary/30 rounded-full px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder={isActive ? "Recording voice..." : (isThinking ? "AI is processing..." : "Type a message or tap mic...")}
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isActive && !isThinking && manualInput.trim()) {
                                        handleSend(manualInput);
                                        setManualInput("");
                                    }
                                }}
                                disabled={isActive || isThinking || isTestCompleted}
                            />
                            {isActive && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Live</span>
                                </div>
                            )}
                        </div>

                        <Button
                            size="icon"
                            className={cn(
                                "h-12 w-12 rounded-full shadow-lg transition-all shrink-0",
                                isActive ? "bg-red-600 hover:bg-red-700 scale-105 shadow-red-500/20" :
                                    (isIELTSMode ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20" : "bg-primary")
                            )}
                            onClick={() => {
                                if (manualInput.trim() && !isActive) {
                                    handleSend(manualInput);
                                    setManualInput("");
                                } else {
                                    handleToggleMic();
                                }
                            }}
                            disabled={isThinking || isTestCompleted}
                        >
                            {isThinking ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                isActive ? <Square className="w-5 h-5 fill-current" /> : (manualInput.trim() ? <Sparkles className="w-5 h-5" /> : <Mic className="w-5 h-5" />)
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* SIDEBAR: IELTS RESULTS or AI Analysis */}
            <div className="space-y-6">
                <Card className={cn(
                    "h-full border-l-4 transition-colors",
                    isIELTSMode ? "border-l-amber-500 bg-gradient-to-br from-amber-500/5 to-transparent" : "border-l-primary bg-gradient-to-br from-primary/5 to-transparent"
                )}>
                    <CardContent className="p-6 space-y-6 overflow-y-auto max-h-[550px] scrollbar-thin">
                        {isTestCompleted && testResults ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h4 className="text-amber-600 font-bold uppercase text-xs tracking-widest">Test Completed</h4>
                                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-2 border-amber-500/20">
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold uppercase opacity-70">Band Score</p>
                                            <p className="text-4xl font-black">{testResults.bandScore || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-background/50 rounded-xl border border-border">
                                        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Overall Feedback</p>
                                        <p className="text-sm leading-relaxed italic">"{testResults.overallFeedback}"</p>
                                    </div>

                                    {testResults.criteria && (
                                        <div className="grid grid-cols-1 gap-3">
                                            {Object.entries(testResults.criteria).map(([key, val]) => (
                                                <div key={key} className="p-3 bg-secondary/20 rounded-lg border border-border/50">
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </p>
                                                    <p className="text-xs leading-tight opacity-90">{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={resetConversation}>
                                    Take New Test
                                </Button>
                            </motion.div>
                        ) : currentAiResponse ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider">
                                    <Volume2 className="w-4 h-4" /> Voice Analysis
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">AI Said:</p>
                                    <p className="text-lg font-medium leading-relaxed">"{currentAiResponse.text}"</p>
                                </div>

                                <div className="bg-background/50 p-4 rounded-xl border border-dashed border-primary/30">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">IPA Transcription:</p>
                                    <p className="font-mono text-amber-600 dark:text-amber-500 text-lg">{currentAiResponse.ipa}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="w-full h-10" onClick={() => replayLastAi(false)}>
                                        <Play className="w-4 h-4 mr-2" /> Normal
                                    </Button>
                                    <Button variant="outline" className="w-full h-10" onClick={() => replayLastAi(true)}>
                                        <Turtle className="w-4 h-4 mr-2" /> Slow
                                    </Button>
                                </div>

                                {currentAiResponse.focusWords && currentAiResponse.focusWords.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase text-muted-foreground">Focus Words</p>
                                        <div className="flex flex-wrap gap-2">
                                            {currentAiResponse.focusWords.map((word, i) => (
                                                <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold border border-primary/20">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground/50 py-10 h-full flex flex-col justify-center">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                <p className="text-sm italic">
                                    {isIELTSMode ? "Examiner's assessment will be available at the end of the test." : "Conversation details and analysis will appear here."}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
