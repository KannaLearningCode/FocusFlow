"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WordAlignmentProps {
    reference: string;
    userInput: string;
}

export function WordAlignment({ reference, userInput }: WordAlignmentProps) {
    const normalize = (s: string) => s.toLowerCase().replace(/[.,!?;:"']/g, "").trim();

    const targetWords = reference.split(/\s+/).filter(Boolean);
    const userWords = userInput.split(/\s+/).filter(Boolean);

    // Simple greedy alignment
    let userIdx = 0;

    return (
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xl leading-relaxed">
            {targetWords.map((targetWord, i) => {
                const normTarget = normalize(targetWord);
                let foundMatch = false;

                // Look ahead in user input to find a match (window of 3)
                const lookahead = 3;
                for (let j = userIdx; j < Math.min(userIdx + lookahead, userWords.length); j++) {
                    if (normalize(userWords[j]) === normTarget) {
                        foundMatch = true;
                        userIdx = j + 1;
                        break;
                    }
                }

                return (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                            "px-1 rounded transition-colors duration-500",
                            foundMatch
                                ? "text-green-500 font-medium"
                                : "text-red-400 decoration-wavy underline decoration-red-400/50"
                        )}
                    >
                        {targetWord}
                    </motion.span>
                );
            })}
        </div>
    );
}
