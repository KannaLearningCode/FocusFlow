"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TrendingUp, Brain, Sparkles, History } from "lucide-react";
import { useLevel } from "@/context/LevelContext";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SentenceUpgrader } from "@/components/upgrader/SentenceUpgrader";

interface HistoryItem {
    _id: string;
    query: string;
    answer: string;
    createdAt: string;
}

export function DashboardOverview() {
    const { level, setLevel } = useLevel();
    const [query, setQuery] = useState("");
    const [answer, setAnswer] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        setIsMounted(true);
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/dashboard/explain");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setHistory(data);
                } else {
                    setHistory([]);
                }
            }
        } catch (e) {
            console.error("Failed to load history", e);
            setHistory([]);
        }
    };

    const handleExplain = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setAnswer("");
        try {
            const res = await fetch("/api/dashboard/explain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: query, level })
            });
            const data = await res.json();
            if (data.answer) {
                setAnswer(data.answer);
                fetchHistory(); // Refresh history
            }
        } catch (e) {
            console.error(e);
            setAnswer("Sorry, I couldn't process your request.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="space-y-6">
            {/* Header with Level Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Global AI Level:</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-[80px]">
                                {level}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                                <DropdownMenuItem key={l} onClick={() => setLevel(l as "A1" | "A2" | "B1" | "B2" | "C1" | "C2")}>
                                    {l}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Tabs defaultValue="insights" className="space-y-6">
                <TabsList className="bg-secondary/30 border border-border/50">
                    <TabsTrigger value="insights" className="data-[state=active]:bg-background data-[state=active]:text-indigo-500 font-bold px-6">
                        <Brain className="w-4 h-4 mr-2" /> AI Insights
                    </TabsTrigger>
                    <TabsTrigger value="upgrader" className="data-[state=active]:bg-background data-[state=active]:text-orange-500 font-bold px-6">
                        <Sparkles className="w-4 h-4 mr-2" /> Sentence Upgrader
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-6 mt-0">

                    {/* Top Section: Q&A - Fixed Height */}
                    <div className="grid gap-6 md:grid-cols-2 h-[500px]">
                        {/* Input Box */}
                        <Card className="flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-indigo-500" />
                                    Ask Gemini
                                </CardTitle>
                                <CardDescription>
                                    Enter any topic, question, or text you want to understand.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
                                <textarea
                                    className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-medium leading-relaxed"
                                    placeholder="e.g., Explain the difference between 'make' and 'do'..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <Button onClick={handleExplain} disabled={isLoading || !query.trim()} className="w-full">
                                    {isLoading ? <TrendingUp className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                    {isLoading ? "Thinking..." : "Explain"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Response Box */}
                        <Card className="flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    Explanation
                                </CardTitle>
                                
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0">
                                <div className="h-full bg-secondary/10 rounded-lg p-4 border border-border overflow-y-auto custom-scrollbar">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                            <TrendingUp className="w-8 h-8 animate-spin text-indigo-500" />
                                            <p>Analyzing your query...</p>
                                        </div>
                                    ) : answer ? (
                                        <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap leading-relaxed">
                                            {answer}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 text-center">
                                            <Brain className="w-12 h-12 mb-3 opacity-20" />
                                            <p>Your answer will appear here.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bottom Section: History */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="w-4 h-4 text-muted-foreground" />
                                History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {history.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground py-4">No history yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {history.map((item) => (
                                        <button
                                            key={item._id}
                                            onClick={() => {
                                                setQuery(item.query);
                                                setAnswer(item.answer);
                                                // Optional: Scroll to top
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className={cn(
                                                "text-left p-3 rounded-lg text-sm transition-colors border h-24 flex flex-col justify-between group",
                                                query === item.query
                                                    ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20"
                                                    : "bg-card hover:bg-secondary/50 border-input hover:border-primary/20"
                                            )}
                                        >
                                            <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors">{item.query}</p>
                                            <span className="text-[10px] text-muted-foreground opacity-70">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="upgrader" className="mt-0">
                    <SentenceUpgrader />
                </TabsContent>
            </Tabs>
        </div >
    );
}
