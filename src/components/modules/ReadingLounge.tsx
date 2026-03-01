"use client";

import { useState, useRef, useEffect } from "react";
import { BookOpen, Sparkles, Loader2, Save, X, Search, Volume2, Highlighter, Trash2, Library, History, RefreshCw, Wand2, Brain, ChevronDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWordDiscovery, DiscoveredWord } from "@/hooks/useWordDiscovery";
import { useVocabulary } from "@/context/VocabularyContext";
import { useTTS } from "@/hooks/useTTS";
import { useLevel } from "@/context/LevelContext";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const TOPICS = [
    { label: "Technology", emoji: "💻" },
    { label: "Literature", emoji: "📚" },
    { label: "World History", emoji: "🌍" },
    { label: "Psychology", emoji: "🧠" },
    { label: "Environment", emoji: "🌱" },
    { label: "Economics", emoji: "📈" },
];

interface ArticleHighlight {
    text: string;
    color: string;
    index: number;
    source: 'user' | 'AI';
    translation?: string;
}

interface Article {
    _id: string;
    title: string;
    content: string;
    readingTime: string;
    difficulty_level: string;
    topic: string;
    originalPdfName?: string;
    highlights?: ArticleHighlight[];
}

import { QuizComponent } from "./QuizComponent";
import { HighlightsModal } from "./HighlightsModal";

export function ReadingLounge() {
    const { level } = useLevel();
    const { toast } = useToast();
    const [article, setArticle] = useState<Article | null>(null);
    const [history, setHistory] = useState<Article[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [customTopic, setCustomTopic] = useState("");
    const [showQuiz, setShowQuiz] = useState(false);

    // Word Discovery States
    const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
    const { discoverWord, discoveredWord, loading: isDefining, error: defineError, resetDiscovery } = useWordDiscovery();
    const { refresh } = useVocabulary();
    const { speak } = useTTS();
    const [isSaved, setIsSaved] = useState(false);
    const [explanation, setExplanation] = useState<any | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [highlights, setHighlights] = useState<ArticleHighlight[]>([]);
    const [showHighlightsList, setShowHighlightsList] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const quizRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Initial Fetch
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch("/api/articles", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch history");
            const data = await res.json();
            if (Array.isArray(data)) {
                const normalized = data.map((d: any) => ({ ...d, readingTime: d.readingTime || d.reading_time }));
                setHistory(normalized);
                if (!article && normalized.length > 0) {
                    selectArticle(normalized[0]);
                }
            }
        } catch (e) {
            console.error("Failed to load history", e);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const selectArticle = async (preview: Article) => {
        setArticle(preview);
        setHighlights(preview.highlights || []);
        setShowLibrary(false);
        setShowQuiz(false); // Reset quiz view on article change

        if (!preview.content) {
            try {
                const res = await fetch(`/api/articles/${preview._id}`);
                if (!res.ok) throw new Error("Failed to load article content");
                const fullArticle = await res.json();
                setArticle(fullArticle);
                setHighlights(fullArticle.highlights || []);
            } catch (e) {
                console.error(e);
                toast({ title: "Error", description: "Could not load article content", variant: "destructive" });
            }
        }
    };

    const deleteArticle = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this article?")) return;

        try {
            const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Article deleted" });
                const newHistory = history.filter(h => h._id !== id);
                setHistory(newHistory);
                if (article?._id === id) {
                    setArticle(newHistory.length > 0 ? newHistory[0] : null);
                }
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not delete article" });
        }
    };

    const handleGenerate = async (topic: string) => {
        setIsModalOpen(false);
        setIsGenerating(true);
        setArticle(null);
        setSelection(null);
        resetDiscovery();
        setHighlights([]);
        setShowQuiz(false);

        try {
            const res = await fetch("/api/generate-article", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, level }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setArticle(data);
            setHighlights([]);
            fetchHistory();
        } catch (error) {
            console.error(error);
            alert("Failed to generate article.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Text Selection & Help Logic
    useEffect(() => {
        const handleSelection = () => {
            const sel = window.getSelection();
            if (sel && sel.toString().trim().length > 0 && contentRef.current?.contains(sel.anchorNode)) {
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                if (sel.toString().length < 50) {
                    setSelection({
                        text: sel.toString().trim(),
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                    });
                    if (discoveredWord?.word !== sel.toString().trim()) {
                        resetDiscovery();
                        setIsSaved(false);
                    }
                } else {
                    setSelection(null);
                }
            }
        };
        document.addEventListener("selectionchange", handleSelection);
        return () => document.removeEventListener("selectionchange", handleSelection);
    }, [discoveredWord]);

    const handleDefine = async () => {
        if (!selection) return;
        await discoverWord("General", selection.text, level);
    };

    const handleExplain = async () => {
        if (!selection) return;
        setIsExplaining(true);
        try {
            const res = await fetch("/api/explain-context", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: selection.text, context: article?.content || "", level })
            });
            const data = await res.json();
            setExplanation(data);
            setShowExplanation(true);
            setSelection(null);
        } catch (e) {
            toast({ title: "Explanation failed", variant: "destructive" });
        } finally {
            setIsExplaining(false);
        }
    };

    const saveExplanation = async () => {
        if (!explanation) return;
        try {
            await discoverWord("General", explanation.text, level);
            setShowExplanation(false);
            toast({ title: "Saved to Vocabulary Lab" });
        } catch (e) {
            console.error(e);
        }
    };

    const addHighlight = async (text: string, source: 'user' | 'AI', color: string = 'yellow', translation?: string) => {
        if (!article?._id) return;
        try {
            const res = await fetch(`/api/articles/${article._id}/highlights`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: 'add', text, source, color, translation })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.highlights) setHighlights(data.highlights);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const removeHighlight = async (text: string) => {
        if (!article?._id) return;
        try {
            setHighlights(prev => prev.filter(h => h.text !== text));
            const res = await fetch(`/api/articles/${article._id}/highlights`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: 'delete', text })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.highlights) setHighlights(data.highlights);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (discoveredWord && selection) {
            const exists = highlights.some(h => h.text.toLowerCase() === discoveredWord.word.toLowerCase());
            if (!exists) addHighlight(discoveredWord.word, 'user', 'yellow', discoveredWord.meaningVN);
            if (discoveredWord.isDuplicate) setIsSaved(true);
            else if (!isSaved) {
                refresh();
                setIsSaved(true);
                toast({ title: "Word Discovered!", description: `"${discoveredWord.word}" added to Lab.` });
            }
        }
    }, [discoveredWord]);

    const renderHighlightedText = (text: string) => {
        if (!highlights.length) return text;
        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
        const pattern = new RegExp(`\\b(${sortedHighlights.map(h => escapeRegExp(h.text)).join("|")})\\b`, "gi");
        const parts = text.split(pattern);

        return parts.map((part, i) => {
            const match = highlights.find(h => h.text.toLowerCase() === part.toLowerCase());
            if (match) {
                const isAI = match.source === 'AI';
                return (
                    <mark key={i} className={cn(
                        "rounded px-0.5 font-medium cursor-help transition-colors",
                        isAI ? "bg-purple-200/50 dark:bg-purple-500/20 text-indigo-700 dark:text-indigo-300" : "bg-yellow-200/50 dark:bg-yellow-500/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                    )} title={match.translation ? `🇻🇳 ${match.translation}` : (isAI ? "AI Suggested" : "User Defined")} onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setSelection({ text: match.text, x: rect.left + rect.width / 2, y: rect.top - 10 });
                    }}>
                        {part}
                    </mark>
                );
            }
            return part;
        });
    };

    const renderLibrary = () => (
        <div className="flex flex-col h-full max-h-[70vh]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/10">
                <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" /> Article Library
                </h3>
                <Button variant="ghost" size="icon" onClick={fetchHistory} className="h-8 w-8 rounded-full">
                    <RefreshCw className="w-3 h-3" />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {isLoadingHistory ? (
                    Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-secondary/20 rounded-xl animate-pulse" />)
                ) : history.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground/40 italic text-sm">No articles found.</div>
                ) : (
                    history.map((h, i) => (
                        <div key={i} className="relative group">
                            <button
                                onClick={() => selectArticle(h)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl border border-border bg-background hover:bg-secondary/20 transition-all",
                                    article?._id === h._id && "border-indigo-500 bg-indigo-50/10"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-sm line-clamp-2 pr-6">{h.title}</h4>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase">{h.difficulty_level}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground/60">
                                    <Volume2 className="w-3 h-3" /> {h.readingTime}
                                </div>
                            </button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-4 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={(e) => deleteArticle(e, h._id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const handleStartQuiz = () => {
        setShowQuiz(true);
        setTimeout(() => {
            quizRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-80px)] w-full px-1 overflow-y-auto scrollbar-thin pb-20">
            {/* Header Area - Minimalist */}
            <div className="flex items-center justify-between shrink-0 py-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600/10 rounded-lg">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Reading Lounge</span>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowHighlightsList(true)} variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground hover:text-foreground">
                        <Highlighter className="w-4 h-4 text-yellow-500" />
                        Highlights {highlights.length > 0 && `(${highlights.length})`}
                    </Button>

                    <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground hover:text-foreground">
                                <Library className="w-4 h-4" /> Library
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border-border bg-card">
                            {renderLibrary()}
                        </DialogContent>
                    </Dialog>

                    <Button onClick={() => setIsModalOpen(true)} size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-4">
                        <Wand2 className="w-4 h-4 mr-2" /> New
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isGenerating ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center py-20">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <h3 className="text-xl font-bold">Creating academic material...</h3>
                        <p className="text-muted-foreground text-sm mt-2">Generating C1/C2 context and assessment nodes.</p>
                    </motion.div>
                ) : article ? (
                    <div className="flex flex-col gap-10">
                        {/* Article View - Minimal & Vertical */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
                            <div className="py-8 border-b border-border/30">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                                    <span className="flex items-center gap-1"><History className="w-3 h-3" /> {article.readingTime}</span>
                                    <span>•</span>
                                    <span className="text-indigo-600/80">{article.difficulty_level}</span>
                                </div>
                                <h1 className="text-4xl font-serif font-bold leading-tight mb-2">{article.title}</h1>
                                <p className="text-muted-foreground text-sm italic">Topic: {article.topic}</p>
                            </div>

                            <div className="py-10 prose prose-lg prose-indigo dark:prose-invert max-w-none font-serif leading-[1.8] text-foreground/80 selection:bg-indigo-500/20" ref={contentRef}>
                                {article.content ? article.content.split("\n\n").map((para, i) => (
                                    <p key={i} className="mb-8">{renderHighlightedText(para)}</p>
                                )) : <div className="space-y-6 animate-pulse">{Array(6).fill(0).map((_, i) => <div key={i} className="h-4 bg-secondary/30 rounded w-full" />)}</div>}
                            </div>

                            {!showQuiz && (
                                <div className="flex justify-center py-10 border-t border-border/30">
                                    <Button onClick={handleStartQuiz} size="lg" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold px-8 animate-bounce">
                                        <CheckCircle2 className="mr-2 h-5 w-5" /> Start Comprehension Check
                                    </Button>
                                </div>
                            )}
                        </motion.div>

                        {/* Quiz View - Below Article */}
                        {showQuiz && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} ref={quizRef} className="pb-20">
                                <Card className="border border-border bg-secondary/5 shadow-none rounded-2xl overflow-hidden">
                                    <CardHeader className="bg-secondary/10 border-b border-border p-6">
                                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
                                            <Brain className="w-4 h-4 text-indigo-600" /> Assessment: {article.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <QuizComponent
                                            articleText={article.content}
                                            articleTitle={article.title}
                                            onClose={() => setShowQuiz(false)}
                                        />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center py-40 bg-secondary/5 rounded-3xl border-2 border-dashed border-border/30">
                        <BookOpen className="w-16 h-16 text-muted-foreground/10 mb-6" />
                        <h3 className="text-lg font-bold text-muted-foreground/30 text-center uppercase tracking-tighter">Ready for Academic Immersion?<br />Click "New" to Begin.</h3>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals & Popovers - Kept for functionality */}
            <HighlightsModal isOpen={showHighlightsList} onClose={setShowHighlightsList} highlights={highlights} onDelete={removeHighlight} />

            <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
                <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl">
                    {explanation && (
                        <div className="flex flex-col">
                            <div className="p-6 bg-indigo-600/5 border-b border-border/50">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-indigo-600 tracking-widest mb-1"><Sparkles className="w-3 h-3" /> Context Analysis</div>
                                <h3 className="text-2xl font-bold text-foreground capitalize">{explanation.text}</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <p className="text-lg font-medium text-indigo-600 mb-2">{explanation.meaning}</p>
                                    <div className="p-4 bg-secondary/30 rounded-xl text-sm leading-relaxed">{explanation.grammar}</div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Nuance</h4>
                                    <p className="text-sm bg-indigo-50/10 p-4 rounded-xl ring-1 ring-indigo-500/10">{explanation.nuance}</p>
                                </div>
                                <Button onClick={saveExplanation} className="w-full h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700">Save to Vocabulary Lab</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AnimatePresence>
                {selection && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} ref={popupRef} className="fixed z-50 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-2xl w-72 overflow-hidden" style={{ left: Math.min(Math.max(20, selection.x - 144), typeof window !== 'undefined' ? window.innerWidth - 300 : 0), top: selection.y + 30 }}>
                        {!discoveredWord && !isDefining && !isExplaining && (
                            <div className="p-2 flex flex-col gap-1">
                                <Button size="sm" onClick={handleDefine} variant="ghost" className="h-10 justify-start rounded-lg gap-2 w-full text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors"><Search className="w-3.5 h-3.5" /> Define Word</Button>
                                <Button size="sm" onClick={handleExplain} variant="ghost" className="h-10 justify-start rounded-lg gap-2 w-full text-xs font-bold hover:bg-indigo-500/10 hover:text-indigo-600"><Sparkles className="w-3.5 h-3.5" /> Deep Context</Button>
                            </div>
                        )}
                        {(isDefining || isExplaining) && <div className="p-6 flex flex-col items-center justify-center gap-2"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /><span className="text-[10px] font-bold uppercase text-muted-foreground">Analyzing...</span></div>}
                        {discoveredWord && (
                            <div className="flex flex-col">
                                <div className="p-4 bg-secondary/10 border-b border-border flex justify-between items-start">
                                    <div>
                                        <div className="flex items-baseline gap-1.5"><h3 className="font-bold text-base capitalize">{discoveredWord.word}</h3><span className="text-[9px] text-muted-foreground font-bold uppercase">{discoveredWord.wordClass}</span></div>
                                        <div className="flex items-center gap-2 mt-0.5"><span className="text-indigo-600 font-mono text-xs">{discoveredWord.ipa}</span><button onClick={() => speak(discoveredWord.word)} className="text-muted-foreground hover:text-indigo-600"><Volume2 className="w-3.5 h-3.5" /></button></div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelection(null); resetDiscovery(); }}><X className="w-3.5 h-3.5" /></Button>
                                </div>
                                <div className="p-4 space-y-4">
                                    <p className="text-xs font-medium leading-relaxed">{discoveredWord.definition}</p>
                                    <div className="bg-muted p-3 rounded-lg text-xs italic text-muted-foreground border-l-2 border-indigo-500">"{discoveredWord.example}"</div>
                                    {discoveredWord.meaningVN && <p className="text-[10px] font-bold text-indigo-600 bg-indigo-600/10 p-1.5 rounded text-center">🇻🇳 {discoveredWord.meaningVN}</p>}
                                </div>
                                <div className="p-2 border-t border-border flex justify-end"><Button size="sm" variant={isSaved ? "ghost" : "default"} className={cn("h-8 rounded-lg text-[10px] font-bold", isSaved && "text-green-600")} onClick={() => { if (!isSaved) { refresh(); setIsSaved(true); } }} disabled={isSaved}>{isSaved ? "Saved" : "Add to Lab"}</Button></div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl">
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-3xl font-bold tracking-tight">Select Topic</DialogTitle>
                            <p className="text-muted-foreground text-sm">Targeting {level} academic complexity.</p>
                        </DialogHeader>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                            {TOPICS.map((t) => (
                                <Button key={t.label} variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 rounded-xl border border-border hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold text-xs uppercase tracking-widest group" onClick={() => handleGenerate(t.label)}>
                                    <span className="text-3xl group-hover:scale-110 transition-transform">{t.emoji}</span>
                                    {t.label}
                                </Button>
                            ))}
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]"><div className="h-px flex-1 bg-border" /> Custom <div className="h-px flex-1 bg-border" /></div>
                            <div className="flex gap-2">
                                <Input placeholder="E.g. Philosophy, Genomics..." value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} className="h-12 rounded-xl bg-secondary/20 border-border font-bold shadow-none" />
                                <Button disabled={!customTopic} onClick={() => handleGenerate(customTopic)} className="h-12 w-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"><RefreshCw className="w-5 h-5 text-white" /></Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
