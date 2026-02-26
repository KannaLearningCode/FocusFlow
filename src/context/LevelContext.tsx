"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AILevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

interface LevelContextType {
    level: AILevel;
    setLevel: (level: AILevel) => void;
}

const LevelContext = createContext<LevelContextType | undefined>(undefined);

export function LevelProvider({ children }: { children: ReactNode }) {
    const [level, setLevelState] = useState<AILevel>("B2");
    const [isLoaded, setIsLoaded] = useState(false);

    // Fetch initial level
    useEffect(() => {
        fetch("/api/user-settings")
            .then(res => res.json())
            .then(data => {
                if (data.aiLevel) setLevelState(data.aiLevel as AILevel);
            })
            .catch(err => console.error("Failed to load level settings", err))
            .finally(() => setIsLoaded(true));

        // Heartbeat for Time Tracking
        const interval = setInterval(() => {
            fetch("/api/user-progress/heartbeat", { method: "POST" })
                .catch(err => console.error("Heartbeat failed", err));
        }, 60000); // Every 1 minute

        // Initial ping
        fetch("/api/user-progress/heartbeat", { method: "POST" });

        return () => clearInterval(interval);
    }, []);

    const setLevel = (newLevel: AILevel) => {
        setLevelState(newLevel);
        // Persist
        fetch("/api/user-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aiLevel: newLevel })
        }).catch(err => console.error("Failed to save level", err));
    };

    return (
        <LevelContext.Provider value={{ level, setLevel }}>
            {children}
        </LevelContext.Provider>
    );
}

export function useLevel() {
    const context = useContext(LevelContext);
    if (context === undefined) {
        throw new Error("useLevel must be used within a LevelProvider");
    }
    return context;
}
