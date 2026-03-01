"use client";

import { Wand2 } from "lucide-react";
import { ConversationSimulator } from "./ConversationSimulator";

export function PhoneticStudio() {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-20">
            <header>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium uppercase tracking-wider border border-purple-500/20 mb-4">
                    <Wand2 className="w-3 h-3" />
                    AI Phonetics Coach
                </div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Phonetic Studio</h2>
                <p className="text-muted-foreground">Master your pronunciation with real-time feedback and dialogue.</p>
            </header>

            <div className="mt-8">
                <ConversationSimulator />
            </div>
        </div>
    );
}
