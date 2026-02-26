"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DictationLab } from "@/components/modules/DictationLab";
import { VoiceSettings } from "@/components/modules/VoiceSettings";
import { ShadowingStation } from "@/components/modules/ShadowingStation";
import { SentenceUpgrader } from "@/components/upgrader/SentenceUpgrader";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { Placeholder } from "@/components/modules/Placeholders";
import { Sidebar, View } from "@/components/layout/Sidebar";
import { VocabularyLab } from "@/components/modules/VocabularyLab";
import { PhoneticStudio } from "@/components/modules/PhoneticStudio";
import { ReadingLounge } from "@/components/modules/ReadingLounge";
import { WritingGym } from "@/components/modules/WritingGym";
import { cn } from "@/lib/utils";

export default function Home() {
    const [activeView, setActiveView] = useState<View>("dashboard");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Optional: Persist sidebar state
    useEffect(() => {
        const saved = localStorage.getItem("sidebarCollapsed");
        if (saved) setIsSidebarCollapsed(saved === "true");
    }, []);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem("sidebarCollapsed", String(newState));
            return newState;
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={toggleSidebar}
            />

            <main className={cn(
                "p-4 md:p-8 min-h-screen transition-all duration-300",
                isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
            )}>
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

                    {activeView === "upgrader" && (
                        <motion.div
                            key="upgrader"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-4xl mx-auto"
                        >
                            <SentenceUpgrader />
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
