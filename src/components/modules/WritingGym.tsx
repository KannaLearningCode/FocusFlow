"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PenTool, AlertCircle, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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

export function WritingGym() {
    const [topic, setTopic] = useState("");
    const [essay, setEssay] = useState("");
    const [result, setResult] = useState<GradingResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTopicLoading, setIsTopicLoading] = useState(false);

    const handleGetRandomTopic = async () => {
        setIsTopicLoading(true);
        try {
            const res = await fetch("/api/writing/topic");
            const data = await res.json();
            if (data.topic) {
                setTopic(data.topic);
            }
        } catch (error) {
            console.error("Failed to fetch topic:", error);
        } finally {
            setIsTopicLoading(false);
        }
    };

    const handleGrade = async () => {
        if (!topic.trim() || !essay.trim()) return;
        setIsLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/writing/grade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, essay })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResult(data);
        } catch (error) {
            console.error("Grading failed:", error);
            // In a real app, use toast here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                    <PenTool className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Writing Gym</h1>
                    <p className="text-muted-foreground">Master IELTS Task 2 with strict examiner feedback.</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Input Section */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle>Essay Topic</CardTitle>
                                <CardDescription>Paste or generate an IELTS Task 2 prompt.</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGetRandomTopic}
                                disabled={isTopicLoading}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                                {isTopicLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                                ) : (
                                    <Sparkles className="w-3 h-3 mr-1.5" />
                                )}
                                Random Topic
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="e.g., Some people believe that university education should be free for everyone..."
                                className="min-h-[100px] resize-none"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>Your Essay</CardTitle>
                            <CardDescription>Write your response (min. 250 words recommended).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Start writing your essay here..."
                                className="min-h-[400px] font-serif text-lg leading-relaxed p-6"
                                value={essay}
                                onChange={(e) => setEssay(e.target.value)}
                            />
                            <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                                <span>Word Count: {essay.trim().split(/\s+/).filter(Boolean).length}</span>
                                <Button
                                    onClick={handleGrade}
                                    disabled={isLoading || !topic || !essay}
                                    className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Grading...
                                        </>
                                    ) : (
                                        <>
                                            <PenTool className="mr-2 h-4 w-4" />
                                            Grade My Essay
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Result Section */}
                <div className="space-y-6">
                    {result ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Score Overview */}
                            <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-medium text-muted-foreground">Overall Band Score</h3>
                                            <div className="text-5xl font-bold text-orange-600 mt-2">{result.band_score}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex flex-col items-center p-2 bg-background rounded-lg border">
                                                <span className="font-bold text-lg">{result.breakdown.TR}</span>
                                                <span className="text-muted-foreground text-xs">TR</span>
                                            </div>
                                            <div className="flex flex-col items-center p-2 bg-background rounded-lg border">
                                                <span className="font-bold text-lg">{result.breakdown.CC}</span>
                                                <span className="text-muted-foreground text-xs">CC</span>
                                            </div>
                                            <div className="flex flex-col items-center p-2 bg-background rounded-lg border">
                                                <span className="font-bold text-lg">{result.breakdown.LR}</span>
                                                <span className="text-muted-foreground text-xs">LR</span>
                                            </div>
                                            <div className="flex flex-col items-center p-2 bg-background rounded-lg border">
                                                <span className="font-bold text-lg">{result.breakdown.GRA}</span>
                                                <span className="text-muted-foreground text-xs">GRA</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-background p-4 rounded-lg border-l-4 border-orange-500 italic text-muted-foreground">
                                        "{result.examiner_comment}"
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Key Improvements */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-500" />
                                        Key Improvements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {result.key_improvements.map((imp, i) => (
                                            <li key={i} className="flex gap-2 text-sm">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                <span>{imp}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Detailed Corrections */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        Corrections
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {result.detailed_corrections.map((correction, i) => (
                                        <div key={i} className="p-3 bg-secondary/30 rounded-lg text-sm space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-bold uppercase">
                                                    {correction.type}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                                                <span className="text-red-500 line-through opacity-70">{correction.original_text}</span>
                                                <span className="text-muted-foreground">→</span>
                                                <span className="text-green-600 font-medium">{correction.correction}</span>
                                            </div>
                                            <p className="text-muted-foreground text-xs italic border-l-2 border-primary/20 pl-2">
                                                {correction.explanation}
                                            </p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-50 border-2 border-dashed rounded-xl">
                            <PenTool className="w-16 h-16 text-muted-foreground" />
                            <h3 className="text-xl font-medium">Ready to Grade</h3>
                            <p className="max-w-xs mx-auto">Enter your topic and essay, then click Grade to get strict IELTS examiner feedback.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
