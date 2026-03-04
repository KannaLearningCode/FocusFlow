"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DictationLab } from "@/components/modules/DictationLab";
import { VoiceSettings } from "@/components/modules/VoiceSettings";
import { ShadowingStation } from "@/components/modules/ShadowingStation";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { Topbar, View } from "@/components/layout/Topbar";
import { VocabularyLab } from "@/components/modules/VocabularyLab";
import { PhoneticStudio } from "@/components/modules/PhoneticStudio";
import { ReadingLounge } from "@/components/modules/ReadingLounge";
import { WritingGym } from "@/components/modules/WritingGym";

export default function Home() {
    const [activeView, setActiveView] = useState<View>("dashboard");

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
            <Topbar
                activeView={activeView}
                setActiveView={setActiveView}
            />

            <main className="p-4 md:p-8 pt-20 md:pt-24 min-h-screen transition-all duration-300">
                <AnimatePresence mode="wait">
                    {activeView === "dashboard" && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-7xl mx-auto"
                        >
                            <DashboardOverview />
                        </motion.div>
                    )}

                    {activeView === "reading" && (
                        <motion.div
                            key="reading"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-5xl mx-auto"
                        >
                            <ReadingLounge />
                        </motion.div>
                    )}

                    {activeView === "writing" && (
                        <motion.div
                            key="writing"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-5xl mx-auto"
                        >
                            <WritingGym />
                        </motion.div>
                    )}

                    {activeView === "shadowing" && (
                        <motion.div
                            key="shadowing"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-5xl mx-auto"
                        >
                            <ShadowingStation />
                        </motion.div>
                    )}

                    {activeView === "vocabulary" && (
                        <motion.div
                            key="vocabulary"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-6xl mx-auto"
                        >
                            <VocabularyLab />
                        </motion.div>
                    )}

                    {activeView === "phonetic" && (
                        <motion.div
                            key="phonetic"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-4xl mx-auto"
                        >
                            <PhoneticStudio />
                        </motion.div>
                    )}

                    {activeView === "dictation" && (
                        <motion.div
                            key="dictation"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-7xl mx-auto"
                        >
                            <DictationLab />
                        </motion.div>
                    )}

                    {activeView === "settings" && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            <VoiceSettings />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
