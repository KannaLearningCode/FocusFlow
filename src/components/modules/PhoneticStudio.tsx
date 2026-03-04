"use client";

import { Wand2 } from "lucide-react";
import { ConversationSimulator } from "./ConversationSimulator";

export function PhoneticStudio() {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-20">
            <header>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Phonetic Studio</h2>
            </header>

            <div className="mt-8">
                <ConversationSimulator />
            </div>
        </div>
    );
}
