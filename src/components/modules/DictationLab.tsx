"use client";

import { useState, useEffect } from "react";
import { Headphones, Play, RefreshCw, CheckCircle2, Volume2, Turtle, Loader2, XCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTTS } from "@/hooks/useTTS";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DictationError {
    word: string;
    type: "spelling" | "missing" | "misheard";
    correction: string;
}

interface EvaluationResult {
    score: number;
    feedback: string;
    errors: DictationError[];
    isMatch: boolean;
}

interface HistoryItem {
    _id: string;
    targetText: string;
    userTranscription: string;
    accuracyScore: number;
    feedback: string;
    errors: DictationError[];
    createdAt: string;
}

export function DictationLab() {
    const [targetText, setTargetText] = useState("");
    const [userInputs, setUserInputs] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [result, setResult] = useState<EvaluationResult | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const { speak } = useTTS();

    // Fetch history on mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/dictation/history");
            const data = await res.json();
            if (data.history) setHistory(data.history);
        } catch (e) {
            console.error("Failed to fetch history", e);
        }
    };

    const generateNewDictation = async () => {
        setIsGenerating(true);
        setResult(null);
        setUserInputs("");
        try {
            const res = await fetch("/api/dictation/generate");
            const data = await res.json();
            if (data.text) {
                setTargetText(data.text);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const evaluateTranscription = async () => {
        if (!userInputs.trim()) return;
        setIsEvaluating(true);
        try {
            const res = await fetch("/api/dictation/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userTranscription: userInputs,
                    targetText
                })
            });
            const data = await res.json();
            setResult(data);
            fetchHistory(); // Refresh history
        } catch (e) {
            console.error(e);
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] lg:h-[calc(100vh-100px)] pb-10">
            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                <header className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dictation Lab</h1>
                        <p className="text-muted-foreground">Lắng nghe cẩn thận và chép lại nội dung bạn nghe được.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className="lg:hidden">
                            <History className="w-4 h-4 mr-2" /> Lịch sử
                        </Button>
                        <Button onClick={generateNewDictation} disabled={isGenerating} className="gap-2">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Tạo đoạn văn mới
                        </Button>
                    </div>
                </header>

                {!targetText && !isGenerating && (
                    <Card className="border-dashed border-2 py-20 text-center bg-card/50">
                        <CardContent className="flex flex-col items-center gap-4">
                            <Headphones className="w-12 h-12 text-muted-foreground/50" />
                            <p className="text-muted-foreground">Nhấn nút phía trên để bắt đầu bài luyện tập mới.</p>
                        </CardContent>
                    </Card>
                )}

                {targetText && (
                    <div className="grid gap-6">
                        {/* Audio Controls */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                    <Volume2 className="w-4 h-4" /> Nghe Audio
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center gap-4">
                                <Button size="lg" onClick={() => speak(targetText)} className="gap-2 h-14 px-8">
                                    <Play className="w-5 h-5 fill-current" /> Tốc độ bình thường
                                </Button>
                                <Button variant="outline" size="lg" onClick={() => speak(targetText, { rate: 0.65 })} className="gap-2 h-14 px-8 border-primary/30 text-primary">
                                    <Turtle className="w-5 h-5" /> Tốc độ chậm
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Input Area */}
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg">Bài chép của bạn</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    placeholder="Gõ những gì bạn nghe được..."
                                    className="min-h-[120px] text-lg leading-relaxed focus:ring-primary/20"
                                    value={userInputs}
                                    onChange={(e) => setUserInputs(e.target.value)}
                                    disabled={isEvaluating}
                                />
                                <div className="flex justify-end pt-2">
                                    <Button size="lg" onClick={evaluateTranscription} disabled={!userInputs || isEvaluating} className="gap-2 shadow-md">
                                        {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Kiểm tra kết quả
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Results / Feedback */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card className={cn(
                                            "md:col-span-1 border-2",
                                            result.score >= 90 ? "border-emerald-500 bg-emerald-50" :
                                                result.score >= 70 ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"
                                        )}>
                                            <CardContent className="pt-6 text-center">
                                                <div className={cn(
                                                    "text-4xl font-black mb-1",
                                                    result.score >= 90 ? "text-emerald-600" :
                                                        result.score >= 70 ? "text-amber-600" : "text-red-600"
                                                )}>{result.score}%</div>
                                                <p className="text-xs font-bold uppercase opacity-70">Độ chính xác</p>
                                            </CardContent>
                                        </Card>

                                        <Card className="md:col-span-3">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-blue-600">Nhận xét từ AI</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm italic leading-relaxed text-foreground/80">{result.feedback}</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {result.errors.length > 0 && (
                                        <Card className="border-red-200">
                                            <CardHeader className="bg-red-50/50 pb-2 border-b border-red-100">
                                                <CardTitle className="text-sm font-bold text-red-600 uppercase flex items-center gap-2">
                                                    <XCircle className="w-4 h-4" /> Chi tiết lỗi phát hiện
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-4 overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="text-muted-foreground border-b uppercase text-[10px] font-bold">
                                                        <tr>
                                                            <th className="text-left py-2 px-1">Từ bạn viết</th>
                                                            <th className="text-left py-2 px-1">Gợi ý sửa</th>
                                                            <th className="text-left py-2 px-1">Loại lỗi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-red-100">
                                                        {result.errors.map((err, i) => (
                                                            <tr key={i}>
                                                                <td className="py-2 px-1 font-medium text-red-700">{err.word || "(Thiếu)"}</td>
                                                                <td className="py-2 px-1 font-bold text-blue-700">{err.correction}</td>
                                                                <td className="py-2 px-1">
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 uppercase font-bold">
                                                                        {err.type === "spelling" ? "Chính tả" : err.type === "missing" ? "Thiếu từ" : "Nghe sai"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Card className="border-blue-200 bg-blue-50/20 shadow-inner">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-bold text-blue-600 uppercase">Văn bản gốc</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-lg font-serif italic text-blue-900 leading-relaxed font-semibold">"{targetText}"</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* HISTORY SIDEBAR */}
            <div className={cn(
                "w-full lg:w-80 border border-border bg-card/30 backdrop-blur rounded-2xl overflow-hidden flex flex-col transition-all shadow-sm",
                !showHistory && "hidden lg:flex"
            )}>
                <div className="p-4 border-b border-border bg-card flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" /> Lịch sử luyện tập
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => fetchHistory()} className="h-8 w-8">
                        <RefreshCw className="w-3 h-3" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground/50 italic text-sm">
                            Chưa có dữ liệu bài làm.
                        </div>
                    ) : (
                        history.map((item) => (
                            <button
                                key={item._id}
                                onClick={() => {
                                    setTargetText(item.targetText);
                                    setUserInputs(item.userTranscription);
                                    setResult({
                                        score: item.accuracyScore,
                                        feedback: item.feedback,
                                        errors: item.errors,
                                        isMatch: item.accuracyScore === 100
                                    });
                                }}
                                className="w-full text-left p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-primary/5 hover:border-primary/20 transition-all group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-black px-1.5 py-0.5 rounded",
                                        item.accuracyScore >= 90 ? "bg-emerald-100 text-emerald-700" :
                                            item.accuracyScore >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                    )}>
                                        {item.accuracyScore}%
                                    </span>
                                </div>
                                <p className="text-xs font-medium line-clamp-2 text-foreground/80 group-hover:text-foreground relative z-10">
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
