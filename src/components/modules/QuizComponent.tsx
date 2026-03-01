"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight, Award, RotateCw, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface Question {
    question: string;
    options: string[];
    answer: number; // Index
    explanation: string;
}

interface QuizProps {
    articleText: string;
    articleTitle: string;
    onClose: () => void;
}

export function QuizComponent({ articleText, articleTitle, onClose }: QuizProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [started, setStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const { toast } = useToast();

    // Generate quiz when component mounts or article changes
    useEffect(() => {
        if (articleText && articleTitle) {
            startQuiz();
        }
    }, [articleText, articleTitle]);

    // Generate Quiz
    const startQuiz = async () => {
        setLoading(true);
        setStarted(false);
        setShowResults(false);
        setCurrentIndex(0);
        setScore(0);
        setSelectedOption(null);
        setIsAnswered(false);

        try {
            const res = await fetch("/api/generate-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: articleText, topic: articleTitle }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setQuestions(data.questions);
            setStarted(true);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to generate quiz. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);

        const correct = index === questions[currentIndex].answer;
        if (correct) {
            setScore(prev => prev + 1);
            // Confetti effect could go here
        }
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setShowResults(true);
        // Save results
        try {
            await fetch("/api/user-progress/quiz-result", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    score: score + (selectedOption === questions[currentIndex].answer ? 1 : 0), // Add last point if correct
                    total: questions.length,
                    topic: articleTitle
                })
            });
        } catch (e) {
            console.error("Failed to save result", e);
        }
    };

    // Calculate final score purely for display (since setScore is async, relying on render state)
    // Actually `score` state assumes previous questions.
    // Let's refine `finishQuiz` logic slightly.
    // Better: update score immediately on click, display result view.

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Generating Questions...</p>
            </div>
        );
    }

    if (!started) {
        return null;
    }

    if (showResults) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 py-6"
            >
                <div className="text-center space-y-4">
                    <div className={cn("inline-flex p-4 rounded-full mb-2", percentage >= 80 ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500")}>
                        <Award className="w-16 h-16" />
                    </div>
                    <h2 className="text-3xl font-bold">{percentage}% Score</h2>
                    <p className="text-muted-foreground">You got {score} out of {questions.length} correct.</p>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">Review</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {questions.map((q, i) => (
                            <Card key={i} className="bg-secondary/20">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{i + 1}</span>
                                        <p className="font-medium text-sm">{q.question}</p>
                                    </div>
                                    <div className="ml-8 text-xs space-y-1">
                                        <p className="text-green-500 font-medium">Correct Answer: {q.options[q.answer]}</p>
                                        <p className="text-muted-foreground italic">{q.explanation}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center pt-4">
                    <Button onClick={onClose} className="w-full md:w-auto">Return to Article</Button>
                </div>
            </motion.div>
        );
    }

    const currentQ = questions[currentIndex];

    return (
        <div className="w-full space-y-8 py-4">
            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>Score: {score}</span>
            </div>

            <motion.div
                key={currentIndex}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="border-indigo-500/20 shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded">
                                {currentQ.options.length === 3 ? "True / False / Not Given" : "Multiple Choice"}
                            </span>
                        </div>
                        <CardTitle className="leading-relaxed text-lg">{currentQ.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {currentQ.options.map((option, idx) => {
                            let stateStyles = "hover:bg-secondary/80 border-border";
                            if (isAnswered) {
                                if (idx === currentQ.answer) stateStyles = "bg-green-500/20 border-green-500 text-green-700 dark:text-green-300";
                                else if (idx === selectedOption) stateStyles = "bg-red-500/20 border-red-500 text-red-700 dark:text-red-300";
                                else stateStyles = "opacity-50";
                            }

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleOptionSelect(idx)}
                                    className={cn(
                                        "p-4 border rounded-xl flex items-center justify-between transition-all cursor-pointer",
                                        stateStyles,
                                        isAnswered ? "cursor-default" : "cursor-pointer"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs border",
                                            isAnswered && idx === currentQ.answer ? "bg-green-500 text-white border-green-500" :
                                                isAnswered && idx === selectedOption ? "bg-red-500 text-white border-red-500" :
                                                    "bg-background text-muted-foreground"
                                        )}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="text-sm font-medium">{option}</span>
                                    </div>
                                    {isAnswered && idx === currentQ.answer && <Check className="w-5 h-5 text-green-500" />}
                                    {isAnswered && idx === selectedOption && idx !== currentQ.answer && <X className="w-5 h-5 text-red-500" />}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </motion.div>

            <AnimatePresence>
                {isAnswered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className={cn(
                            "p-4 rounded-lg text-sm flex gap-3",
                            selectedOption === currentQ.answer ? "bg-green-500/10 text-green-700 dark:text-green-300" : "bg-red-500/10 text-red-700 dark:text-red-300"
                        )}>
                            <div className="shrink-0 mt-0.5">
                                {selectedOption === currentQ.answer ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="font-bold mb-1">{selectedOption === currentQ.answer ? "Correct!" : "Incorrect"}</p>
                                <p>{currentQ.explanation}</p>
                            </div>
                        </div>
                        <Button onClick={nextQuestion} className="w-full gap-2" size="lg">
                            {currentIndex < questions.length - 1 ? "Next Question" : "See Results"} <ArrowRight className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
