
"use client";

import { useTTS } from "@/hooks/useTTS";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Volume2, Sparkles, Highlighter, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Highlight {
    text: string;
    source: 'user' | 'AI';
    translation?: string;
    color: string;
}

interface HighlightsModalProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    highlights: Highlight[];
    onDelete: (text: string) => void;
}

export function HighlightsModal({ isOpen, onClose, highlights, onDelete }: HighlightsModalProps) {
    const { speak } = useTTS();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-border/50">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Highlighter className="w-6 h-6 text-yellow-500" />
                        Vocabulary Review ({highlights.length})
                    </DialogTitle>
                    <DialogDescription>
                        Words and phrases you've collected from this article.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    {highlights.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-secondary/5">
                            <Highlighter className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No highlights yet</p>
                            <p className="text-sm opacity-75">Select text to define or use AI Highlights.</p>
                        </div>
                    ) : (
                        highlights.map((h, i) => (
                            <div
                                key={i}
                                className="group relative overflow-hidden p-5 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all hover:shadow-lg"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1 w-full">
                                        {/* Main Translation */}
                                        <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {h.translation || (
                                                <span className="flex items-center gap-2 text-muted-foreground text-base font-normal italic">
                                                    <span className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                                                    Translating...
                                                </span>
                                            )}
                                        </h3>

                                        {/* Sub Text: English Word */}
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "text-lg font-medium",
                                                h.source === 'AI' ? "text-purple-600/80" : "text-foreground/80"
                                            )}>
                                                {h.text}
                                            </span>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-full hover:bg-indigo-100 hover:text-indigo-600"
                                                    onClick={(e) => { e.stopPropagation(); speak(h.text); }}
                                                    title="Listen"
                                                >
                                                    <Volume2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600 text-muted-foreground/50"
                                                    onClick={(e) => { e.stopPropagation(); onDelete(h.text); }}
                                                    title="Remove Highlight"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metadata Badge (Bottom Right) */}
                                    <div className={cn(
                                        "absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity",
                                        h.source === 'AI'
                                            ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                            : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                                    )}>
                                        {h.source === 'AI' ? <Sparkles className="w-3 h-3" /> : <Highlighter className="w-3 h-3" />}
                                        {h.source}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
