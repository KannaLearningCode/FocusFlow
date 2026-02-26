"use client";

import { useState, useRef, useEffect } from "react";
import { BookOpen, Sparkles, Loader2, Save, X, Search, Volume2, Highlighter, Trash2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWordDiscovery, DiscoveredWord } from "@/hooks/useWordDiscovery";
import { useVocabulary } from "@/context/VocabularyContext";
import { useTTS } from "@/hooks/useTTS";
import { useLevel } from "@/context/LevelContext";
import { useToast } from "@/components/ui/use-toast";

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

// Extended Article interface
interface Article {
    _id: string; // Needed for patch
    title: string;
    content: string;
    readingTime: string; // Match API
    difficulty_level: string;
    topic: string; // Added topic
    originalPdfName?: string; // Added for IELTS detection
    highlights?: ArticleHighlight[];
}

import { QuizComponent } from "./QuizComponent";
import { HighlightsModal } from "./HighlightsModal";
import { Brain } from "lucide-react";

// ... existing imports ...

export function ReadingLounge() {
    const { level } = useLevel();
    const [article, setArticle] = useState<Article | null>(null);
    const [history, setHistory] = useState<Article[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [customTopic, setCustomTopic] = useState("");

    // Load history on mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch("/api/articles", { cache: "no-store" });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to fetch history: ${res.status} ${text}`);
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                // Normalize data structure if needed
                const normalized = data.map((d: any) => ({ ...d, readingTime: d.readingTime || d.reading_time }));
                setHistory(normalized);
                if (!article && normalized.length > 0) {
                    selectArticle(normalized[0]);
                }
            }
        } catch (e) {
            console.error("Failed to load history", e);
            toast({
                title: "Error loading library",
                description: "Please inspect console for details.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const selectArticle = async (preview: Article) => {
        // Set preview first (might have empty content)
        setArticle(preview);
        setHighlights(preview.highlights || []);

        // If content is missing, fetch full article
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
            const res = await fetch(`/api/articles/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast({ title: "Article deleted" });
                const newHistory = history.filter(h => h._id !== id);
                setHistory(newHistory);
                if (article?._id === id) {
                    setArticle(newHistory.length > 0 ? newHistory[0] : null);
                }
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            toast({ title: "Error", description: "Could not delete article" });
        }
    };

    // Selection & Definition State
    const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
    const { discoverWord, discoveredWord, loading: isDefining, error: defineError, resetDiscovery } = useWordDiscovery();
    const { refresh } = useVocabulary();
    const { speak } = useTTS();
    const [isSaved, setIsSaved] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);

    // Handle Text Selection (unchanged logic mostly)
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


    const handleGenerate = async (topic: string) => {
        setIsModalOpen(false);
        setIsGenerating(true);
        setArticle(null);
        setSelection(null);
        resetDiscovery();
        setHighlights([]);

        try {
            const res = await fetch("/api/generate-article", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, level }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setArticle(data);
            setHighlights([]); // New article, no highlights yet
            fetchHistory();
        } catch (error) {
            console.error(error);
            alert("Failed to generate article. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDefine = async () => {
        if (!selection) return;
        await discoverWord("General", selection.text, level);
    };

    // Deep Explain State
    interface Explanation {
        text: string;
        meaning: string;
        grammar: string;
        nuance: string;
        synonyms: string[];
    }
    const [explanation, setExplanation] = useState<Explanation | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    const handleExplain = async () => {
        if (!selection) return;
        setIsExplaining(true);
        try {
            const res = await fetch("/api/explain-context", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: selection.text,
                    context: article?.content || "",
                    level
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setExplanation(data);
            setShowExplanation(true);
            setSelection(null);
        } catch (e) {
            console.error(e);
            toast({ title: "Explanation failed", description: "Could not generate context.", variant: "destructive" });
        } finally {
            setIsExplaining(false);
        }
    };

    const saveExplanation = async () => {
        if (!explanation) return;
        // Reuse discoverWord to save it to the vocab lab
        try {
            await discoverWord("General", explanation.text, level);
            setShowExplanation(false);
            toast({ title: "Saved to Vocabulary Lab" });
        } catch (e) {
            console.error("Failed to save", e);
        }
    };

    const { toast } = useToast();

    // Change highlights state to use ArticleHighlight
    const [highlights, setHighlights] = useState<ArticleHighlight[]>([]);
    const [showHighlightsList, setShowHighlightsList] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // Action: Add Highlight
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
                if (data.highlights) {
                    setHighlights(data.highlights);
                }
            }
        } catch (e) {
            console.error("Failed to add highlight", e);
        }
    };

    // Action: Remove Highlight
    const removeHighlight = async (text: string) => {
        if (!article?._id) return;
        try {
            // Optimistic update for delete is safer
            setHighlights(prev => prev.filter(h => h.text !== text));

            const res = await fetch(`/api/articles/${article._id}/highlights`, {
                method: "POST", // Using POST for action: 'delete'
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: 'delete', text })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.highlights) {
                    setHighlights(data.highlights); // Sync back to be sure
                }
            }
        } catch (e) {
            console.error("Failed to delete highlight", e);
        }
    };

    // Auto-save highlight when a word is discovered
    useEffect(() => {
        if (discoveredWord && selection) {
            // Check if already highlighted in local state to avoid redundant calls
            // (Though backend handles it, frontend check saves network)
            const exists = highlights.some(h => h.text.toLowerCase() === discoveredWord.word.toLowerCase());
            if (!exists) {
                addHighlight(discoveredWord.word, 'user', 'yellow', discoveredWord.meaningVN);
            }

            if (discoveredWord.isDuplicate) {
                setIsSaved(true);
            } else if (!isSaved) {
                refresh();
                setIsSaved(true);
                toast({
                    title: "Word Discovered!",
                    description: `"${discoveredWord.word}" has been added to your Vocabulary Lab.`,
                });
            }
        }
    }, [discoveredWord]);

    const handleSave = () => {
        if (!isSaved) {
            refresh();
            setIsSaved(true);
        }
    };



    // Update highlights when article changes (from history click)
    useEffect(() => {
        if (article) {
            setHighlights(article.highlights || []);
        }
    }, [article]);


    // Close Popup on Click Outside (unchanged)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node) && selection) {
                setSelection(null);
                resetDiscovery();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selection]);

    const renderHighlightedText = (text: string) => {
        if (!highlights.length) return text;

        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Sort by length desc to match longest phrases first
        const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
        const pattern = new RegExp(`\\b(${sortedHighlights.map(h => escapeRegExp(h.text)).join("|")})\\b`, "gi");

        const parts = text.split(pattern);

        return parts.map((part, i) => {
            const match = highlights.find(h => h.text.toLowerCase() === part.toLowerCase());
            if (match) {
                const isAI = match.source === 'AI';
                return (
                    <mark
                        key={i}
                        className={isAI
                            ? "bg-purple-200/50 dark:bg-purple-500/20 text-indigo-700 dark:text-indigo-300 font-medium px-0.5 rounded cursor-help"
                            : "bg-yellow-200/50 dark:bg-yellow-500/20 text-indigo-600 dark:text-indigo-400 font-semibold px-0.5 rounded cursor-help"
                        }
                        title={match.translation ? `🇻🇳 ${match.translation}` : (isAI ? "AI Suggested" : "User Defined")}
                        onClick={(e) => {
                            e.stopPropagation();
                            // If it's an AI highlight, maybe allow quick save or define?
                            // For now, let's trigger define to allow saving
                            const rect = e.currentTarget.getBoundingClientRect();
                            setSelection({
                                text: match.text,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 10
                            });
                            // If it's AI, we haven't 'discovered' (fetched definition) it yet officially in context
                            // So just setting selection allows standard 'Define' flow
                        }}
                    >
                        {part}
                    </mark>
                );
            }
            return part;
        });
    };

    return (
        <div className="flex gap-6 max-w-6xl mx-auto pb-20 relative">
            {/* History Sidebar */}
            <motion.div
                initial={{ width: 256, opacity: 1 }}
                animate={{ width: isSidebarOpen ? 256 : 0, opacity: isSidebarOpen ? 1 : 0 }}
                className="hidden lg:block shrink-0 overflow-hidden relative"
            >
                <div className="w-64 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Library
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-8 w-8">
                            <PanelLeftClose className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                        {isLoadingHistory ? (
                            // Loading Skeletons
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
                            ))
                        ) : (
                            history.map((h, i) => (
                                <div key={i} className="relative group">
                                    <Card
                                        className={`cursor-pointer hover:bg-secondary/50 transition-colors ${article?._id === h._id ? "border-primary" : ""}`}
                                        onClick={() => selectArticle(h)}
                                    >
                                        <CardContent className="p-3 pr-8">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-medium text-sm line-clamp-2 leading-snug">{h.title}</h4>
                                            </div>

                                            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mt-2 items-center">
                                                <span className="bg-secondary px-1.5 py-0.5 rounded">{h.readingTime}</span>
                                                <span className="border border-border px-1.5 py-0.5 rounded">{h.difficulty_level}</span>
                                                {(h.originalPdfName || h.topic === 'IELTS Practice') && (
                                                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-bold">IELTS</span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                        onClick={(e) => deleteArticle(e, h._id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>

            <div className="flex-1 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {!isSidebarOpen && (
                            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                                <PanelLeftOpen className="w-5 h-5" />
                            </Button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Reading Lounge</h1>
                            <p className="text-muted-foreground">Immerse yourself in C1/C2 level academic content.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setShowHighlightsList(true)} variant="outline" className="gap-2 relative">
                            <Highlighter className="w-4 h-4 text-yellow-500" />
                            Highlights
                            {highlights.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                                    {highlights.length}
                                </span>
                            )}
                        </Button>
                        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <BookOpen className="w-4 h-4" />
                            New Article
                        </Button>
                    </div>
                </div>


                <AnimatePresence mode="wait">
                    {isGenerating ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-[50vh] text-center"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
                            </div>
                            <h3 className="mt-8 text-xl font-semibold text-indigo-400">Crafting your article...</h3>
                            <p className="text-muted-foreground mt-2">Consulting academic archives and polishing syntax.</p>
                        </motion.div>
                    ) : article ? (
                        <div className={isQuizOpen ? "grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]" : ""}>
                            {/* Article View */}
                            <motion.div
                                key="article"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                ref={contentRef}
                                className={`relative selection:bg-indigo-500/30 ${isQuizOpen ? "overflow-y-auto pr-4 h-full" : ""}`}
                            >
                                <Card className="border-2 border-indigo-500/10 shadow-xl bg-card/50 backdrop-blur-sm h-full">
                                    <CardContent className="p-8 md:p-12">
                                        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-4">
                                            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {article.readingTime} Read</span>
                                            <span>•</span>
                                            <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">{article.difficulty_level}</span>
                                        </div>
                                        <h2 className="text-3xl font-bold mb-6 text-foreground leading-tight font-serif">{article.title}</h2>
                                        <div className="prose prose-lg dark:prose-invert max-w-none font-serif leading-loose text-foreground/90">
                                            {article.content ? (
                                                article.content.split("\n\n").map((para, i) => (
                                                    <p key={i} className="mb-6">
                                                        {renderHighlightedText(para)}
                                                    </p>
                                                ))
                                            ) : (
                                                <div className="space-y-6 animate-pulse">
                                                    <div className="h-4 bg-secondary/30 rounded w-full" />
                                                    <div className="h-4 bg-secondary/30 rounded w-full" />
                                                    <div className="h-4 bg-secondary/30 rounded w-[90%]" />
                                                    <div className="h-4 bg-secondary/30 rounded w-[95%]" />
                                                    <div className="h-4 bg-secondary/30 rounded w-[80%]" />
                                                </div>
                                            )}
                                        </div>

                                        {!isQuizOpen && (
                                            <div className="border-t border-border pt-8 flex justify-center gap-4 mt-8">
                                                <Button
                                                    size="lg"
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                                                    onClick={() => setIsQuizOpen(true)}
                                                >
                                                    <Brain className="mr-2 h-5 w-5" /> Test My Understanding
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Quiz View (Split Screen) */}
                            {isQuizOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <QuizComponent
                                        articleText={article.content}
                                        articleTitle={article.title}
                                        onClose={() => setIsQuizOpen(false)}
                                    />
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-[40vh] border-2 border-dashed border-border rounded-xl bg-secondary/5"
                        >
                            <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-medium text-muted-foreground">No article selected</h3>
                            <p className="text-sm text-muted-foreground/70 mt-2">Click "New Article" to begin.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Removed floating Quiz Dialog */}

                {/* Explanation Dialog / Modal */}
                <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                Deep Explanation
                            </DialogTitle>
                        </DialogHeader>
                        {explanation && (
                            <div className="space-y-4">
                                <div className="border-b pb-4">
                                    <h3 className="text-2xl font-bold capitalize text-primary">{explanation.text}</h3>
                                    <p className="text-lg font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                                        {explanation.meaning}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Grammar Structure</h4>
                                        <p className="text-sm bg-secondary/30 p-2 rounded mt-1 border-l-2 border-indigo-500">
                                            {explanation.grammar}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Nuance & Tone</h4>
                                        <p className="text-sm bg-secondary/30 p-2 rounded mt-1 border-l-2 border-purple-500">
                                            {explanation.nuance}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Academic Synonyms</h4>
                                        <div className="flex gap-2 mt-1">
                                            {explanation.synonyms.map(syn => (
                                                <span key={syn} className="text-xs bg-muted px-2 py-1 rounded-full font-medium">
                                                    {syn}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button onClick={saveExplanation} className="gap-2">
                                        <Save className="w-4 h-4" /> Save to Vocab Lab
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>


                {/* Highlights List Modal */}
                <HighlightsModal
                    isOpen={showHighlightsList}
                    onClose={setShowHighlightsList}
                    highlights={highlights}
                    onDelete={removeHighlight}
                />

                {/* Selection Popover / Definition Card */}
                <AnimatePresence>
                    {selection && (
                        <motion.div
                            drag
                            dragMomentum={false}
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            ref={popupRef}
                            className="fixed z-50 bg-background border border-border shadow-2xl rounded-xl w-80 overflow-hidden cursor-move"
                            style={{
                                left: Math.min(Math.max(20, selection.x - 160), window.innerWidth - 340),
                                top: selection.y + 30
                            }}
                            onPointerDown={(e) => e.stopPropagation()} // Prevent selection clear when clicking popover
                        >
                            {!discoveredWord && !isDefining && !isExplaining && (
                                <div className="p-2 flex flex-col gap-2">
                                    <Button size="sm" onClick={handleDefine} className="gap-2 w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer" onPointerDown={(e) => e.stopPropagation()}>
                                        <Search className="w-3 h-3" /> Tra từ "{selection.text}"
                                    </Button>
                                    <Button size="sm" onClick={handleExplain} variant="secondary" className="gap-2 w-full cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-600" onPointerDown={(e) => e.stopPropagation()}>
                                        <Sparkles className="w-3 h-3 text-purple-500" /> Giải thích sâu
                                    </Button>
                                </div>
                            )}

                            {(isDefining || isExplaining) && (
                                <div className="p-6 flex flex-col items-center justify-center text-indigo-500">
                                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                    <span className="text-xs font-medium">{isDefining ? "Đang tra từ điển..." : "Đang phân tích ngữ cảnh..."}</span>
                                </div>
                            )}

                            {discoveredWord && (
                                <div className="flex flex-col cursor-auto" onPointerDown={(e) => e.stopPropagation()}>
                                    {/* Header - Draggable Area effectively via parent, but let's make it clear */}
                                    <div className="p-4 bg-secondary/30 border-b border-border flex justify-between items-start cursor-move" onPointerDown={(e) => { /* Allow drag from header */ }}>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <h3 className="font-bold text-lg capitalize">{discoveredWord.word}</h3>
                                                <span className="text-xs text-muted-foreground italic">{discoveredWord.wordClass}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-indigo-400 font-mono text-sm">{discoveredWord.ipa}</span>
                                                <button onClick={() => speak(discoveredWord.word)} className="text-muted-foreground hover:text-indigo-500 transition-colors cursor-pointer">
                                                    <Volume2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 cursor-pointer" onClick={() => { setSelection(null); resetDiscovery(); }}>
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <p className="text-sm">{discoveredWord.definition}</p>
                                        <div className="bg-muted/50 p-2 rounded text-xs italic text-muted-foreground border-l-2 border-indigo-500">
                                            "{discoveredWord.example}"
                                        </div>
                                        {discoveredWord.meaningVN && (
                                            <p className="text-xs text-muted-foreground">🇻🇳 {discoveredWord.meaningVN}</p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-secondary/20 border-t border-border flex justify-end">
                                        <Button
                                            size="sm"
                                            variant={isSaved ? "outline" : "default"}
                                            className={isSaved ? "text-green-500 border-green-500/20" : ""}
                                            onClick={handleSave}
                                            disabled={isSaved}
                                        >
                                            {isSaved ? (
                                                <>Đã lưu <span className="ml-1">✓</span></>
                                            ) : (
                                                <><Save className="w-3 h-3 mr-1" /> Lưu vào Lab</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {defineError && (
                                <div className="p-4 text-center">
                                    <p className="text-destructive text-sm mb-2">{defineError}</p>
                                    <Button size="sm" variant="ghost" onClick={() => setSelection(null)}>Đóng</Button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Topic Dialog (unchanged) */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Choose a Topic</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-3 py-4">
                            {TOPICS.map((t) => (
                                <Button
                                    key={t.label}
                                    variant="outline"
                                    className="h-20 flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all"
                                    onClick={() => handleGenerate(t.label)}
                                >
                                    <span className="text-2xl">{t.emoji}</span>
                                    <span className="font-medium">{t.label}</span>
                                </Button>
                            ))}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or type your own</span>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Input
                                placeholder="e.g., Quantum Physics, Victorian Era..."
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                            />
                            <Button disabled={!customTopic} onClick={() => handleGenerate(customTopic)}>
                                Go
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
