"use client";

import { useState } from "react";
import { useVocabulary, VocabularyItem } from "@/hooks/useVocabulary";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, RotateCw, Layers, Sparkles, Search, Volume2, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTTS } from "@/hooks/useTTS";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WordDiscoveryModal } from "@/components/modules/WordDiscoveryModal";

export function VocabularyLab() {
    const { vocabList, reviewWord, deleteWord, getDueWords } = useVocabulary();
    const dueWords = getDueWords();
    const { speak } = useTTS();
    const [reviewMode, setReviewMode] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const filteredList = vocabList.filter(item =>
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Review session state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [streak, setStreak] = useState(0);

    const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

    const currentCard = dueWords[currentIndex];

    // Stats
    const masteredCount = vocabList.filter(w => w.box === 4).length;
    const learningCount = vocabList.length - masteredCount;

    const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);

    const handleFlip = () => setIsFlipped(!isFlipped);

    const handleResult = (success: boolean) => {
        if (!currentCard) return;

        reviewWord(currentCard.id, success);

        if (success) {
            setStreak(s => s + 1);
        } else {
            setStreak(0);
        }

        setIsFlipped(false);

        if (currentIndex < dueWords.length - 1) {
            setTimeout(() => setCurrentIndex(i => i + 1), 200);
        } else {
            // End of review
            setTimeout(() => setReviewMode(false), 500);
        }
    };

    const startReview = () => {
        if (dueWords.length > 0) {
            setCurrentIndex(0);
            setReviewMode(true);
            setStreak(0);
        }
    };

    const playAudio = (e: React.MouseEvent, word: string) => {
        e.stopPropagation();
        speak(word);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this word?")) {
            deleteWord(id);
            if (selectedWord?.id === id) setSelectedWord(null);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Vocabulary Lab</h2>
                    <p className="text-muted-foreground">Master academic lexicon with Spaced Repetition.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Dialog open={isDiscoveryOpen} onOpenChange={setIsDiscoveryOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-primary/25 border-0">
                                <Sparkles className="h-4 w-4" />
                                Discover Word
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-card border-border/50 p-6">
                            <WordDiscoveryModal onClose={() => setIsDiscoveryOpen(false)} />
                        </DialogContent>
                    </Dialog>

                    <div className="flex gap-4 text-sm font-medium hidden md:flex">
                        <div className="px-4 py-2 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20">
                            {masteredCount} Mastered
                        </div>
                        <div className="px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-lg border border-yellow-500/20">
                            {learningCount} Learning
                        </div>
                    </div>
                </div>
            </header>

            {/* Word Detail Modal (existing) */}
            <Dialog open={!!selectedWord} onOpenChange={(open) => !open && setSelectedWord(null)}>
                <DialogContent className="max-w-2xl bg-card border-border/50">
                    <DialogTitle className="sr-only">Word Details</DialogTitle>
                    {selectedWord && (
                        <div className="space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-4xl font-bold text-primary flex items-center gap-3">
                                        {selectedWord.word}
                                        {selectedWord.wordClass && (
                                            <span className="text-lg font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded align-middle">
                                                {selectedWord.wordClass}
                                            </span>
                                        )}
                                        <Button size="icon" variant="ghost" className="rounded-full" onClick={() => speak(selectedWord.word)}>
                                            <Volume2 className="h-6 w-6" />
                                        </Button>
                                    </h2>
                                    {selectedWord.ipa && <div className="text-lg font-mono text-amber-500 mt-1">{selectedWord.ipa}</div>}
                                </div>
                                <div className="flex gap-2">
                                    <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase",
                                        selectedWord.box === 4 ? "bg-green-500/20 text-green-500" : "bg-primary/20 text-primary")}>
                                        {selectedWord.box === 4 ? "Mastered" : `Box ${selectedWord.box}`}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                                        <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Definition</div>
                                        <p className="font-medium text-lg">{selectedWord.definition}</p>
                                    </div>

                                    {selectedWord.meaningVN && (
                                        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                                            <div className="text-xs font-bold text-blue-400 uppercase mb-1">Vietnamese Meaning</div>
                                            <p className="font-medium text-lg text-blue-100">{selectedWord.meaningVN}</p>
                                        </div>
                                    )}

                                    <div className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                                        <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Example</div>
                                        <p className="italic text-muted-foreground">"{selectedWord.example}"</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm">
                                    {selectedWord.collocations && selectedWord.collocations.length > 0 && (
                                        <div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Collocations</div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedWord.collocations.map((c, i) => (
                                                    <span key={i} className="px-2 py-1 bg-secondary rounded-md border border-border/50">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedWord.verbCollocations && selectedWord.verbCollocations.length > 0 && (
                                        <div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Verb Collocations</div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedWord.verbCollocations.map((c, i) => (
                                                    <span key={i} className="px-2 py-1 bg-secondary rounded-md border border-border/50">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(selectedWord.synonyms?.length || 0) > 0 && (
                                        <div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Synonyms</div>
                                            <div className="flex flex-wrap gap-2 text-muted-foreground">
                                                {selectedWord.synonyms?.join(", ")}
                                            </div>
                                        </div>
                                    )}

                                    {(selectedWord.antonyms?.length || 0) > 0 && (
                                        <div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Antonyms</div>
                                            <div className="flex flex-wrap gap-2 text-muted-foreground">
                                                {selectedWord.antonyms?.join(", ")}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                    }
                </DialogContent >
            </Dialog >

            <AnimatePresence mode="wait">
                {!reviewMode ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid gap-6"
                    >
                        {/* Review Call to Action */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 text-center space-y-6">
                            <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold">
                                    {dueWords.length > 0 ? "Time to Review!" : "All Caught Up"}
                                </h3>
                                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                    {dueWords.length > 0
                                        ? `You have ${dueWords.length} words needing attention today. Keep your streak alive!`
                                        : "Great job! You've reviewed all your daily words. Come back tomorrow."}
                                </p>

                                {dueWords.length > 0 && (
                                    <Button onClick={startReview} size="lg" className="mt-6 text-lg px-8 shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                                        <Layers className="mr-2 h-5 w-5" />
                                        Start Session ({dueWords.length})
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Search and List */}
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search your vocabulary..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-secondary/20 border-border/50"
                                />
                            </div>

                            <div className="border border-border/50 rounded-xl overflow-hidden bg-card/30">
                                <div className="px-6 py-4 border-b border-border/50 bg-secondary/30 font-medium text-sm text-muted-foreground flex justify-between">
                                    <span>Added Words</span>
                                    <span>Actions</span>
                                </div>
                                <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
                                    {filteredList.map((item) => (
                                        <div
                                            key={item.id}
                                            className="px-6 py-4 flex items-center justify-between hover:bg-secondary/40 transition-colors group cursor-pointer"
                                            onClick={() => setSelectedWord(item)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => playAudio(e, item.word)}
                                                >
                                                    <Volume2 className="h-4 w-4" />
                                                </Button>
                                                <div>
                                                    <div className="font-bold flex items-baseline gap-2">
                                                        {item.word}
                                                        {item.type === 'sentence' || item.type === 'phrase' ? (
                                                            <span className={cn(
                                                                "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border",
                                                                item.type === 'sentence'
                                                                    ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                                                                    : "text-pink-400 bg-pink-500/10 border-pink-500/20"
                                                            )}>
                                                                {item.type === 'sentence' ? "Sentence Logic" : "Phrase"}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
                                                                {item.wordClass && item.wordClass !== 'unknown' ? item.wordClass : "Word"}
                                                            </span>
                                                        )}
                                                        {item.type === 'word' && item.ipa && <span className="text-xs font-mono text-amber-500/80">{item.ipa}</span>}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-md">{item.meaningVN || item.definition}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-1 mr-2">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className={cn("h-1.5 w-1.5 rounded-full", i <= item.box ? "bg-primary" : "bg-primary/20")} />
                                                    ))}
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleDelete(e, item.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredList.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground italic">
                                            {searchQuery ? "No matching words found." : "No words added yet. Start using the Sentence Upgrader!"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="flashcard"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center min-h-[500px]"
                    >
                        {/* Progress Bar */}
                        <div className="w-full max-w-md h-2 bg-secondary rounded-full mb-8 overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentIndex + 1) / dueWords.length) * 100}%` }}
                            />
                        </div>

                        {/* FLIP CARD */}
                        <div
                            className="perspective-1000 w-full max-w-md h-[400px] cursor-pointer group"
                            onClick={handleFlip}
                        >
                            <motion.div
                                className="relative w-full h-full text-center transition-all duration-500 transform-style-3d"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                {/* FRONT */}
                                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 rounded-2xl p-10 flex flex-col items-center justify-center shadow-2xl group-hover:border-primary/40 transition-colors">
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
                                        {currentCard.type === 'word' ? "Word" : (currentCard.type === 'phrase' ? "Phrase" : "Sentence Structure")}
                                    </span>
                                    <h2 className={cn("font-bold mb-2", currentCard.type !== 'word' ? "text-2xl leading-relaxed" : "text-5xl")}>
                                        {currentCard.word}
                                    </h2>

                                    <div className="flex items-center gap-3 mt-2">
                                        {currentCard.type === 'word' && currentCard.ipa && (
                                            <span className="text-xl font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                                                {currentCard.ipa}
                                            </span>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="h-10 w-10 rounded-full"
                                            onClick={(e) => playAudio(e, currentCard.word)}
                                        >
                                            <Volume2 className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className="absolute bottom-6 text-xs text-muted-foreground flex items-center gap-2">
                                        <RotateCw className="w-3 h-3" /> Click to flip
                                    </div>
                                </div>

                                {/* BACK */}
                                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-secondary to-background border-2 border-secondary rounded-2xl p-10 flex flex-col items-center justify-center shadow-2xl rotate-y-180">
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
                                        {currentCard.type !== 'word' ? "Translation" : "Definition"}
                                    </span>
                                    <p className="text-xl font-medium mb-6 leading-relaxed">
                                        {currentCard.meaningVN || currentCard.definition}
                                    </p>

                                    {currentCard.type !== 'word' && currentCard.grammarNote && (
                                        <div className="w-full text-left bg-indigo-500/10 p-4 rounded-lg border border-indigo-500/20 mb-4">
                                            <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Grammar Note</div>
                                            <p className="text-sm text-indigo-300">{currentCard.grammarNote}</p>
                                        </div>
                                    )}

                                    <div className="text-sm italic text-muted-foreground bg-background/50 p-4 rounded-lg border border-border/50 w-full">
                                        "{currentCard.example}"
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* CONTROLS */}
                        <AnimatePresence>
                            {isFlipped && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-4 mt-8"
                                >
                                    <Button
                                        variant="outline"
                                        className="h-14 px-8 border-red-500/50 hover:bg-red-500/10 hover:text-red-500 text-lg gap-2"
                                        onClick={(e) => { e.stopPropagation(); handleResult(false); }}
                                    >
                                        <X className="w-5 h-5" /> Forgot
                                    </Button>
                                    <Button
                                        className="h-14 px-8 bg-green-600 hover:bg-green-500 text-lg gap-2 shadow-lg shadow-green-500/20"
                                        onClick={(e) => { e.stopPropagation(); handleResult(true); }}
                                    >
                                        <Check className="w-5 h-5" /> Got it
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
