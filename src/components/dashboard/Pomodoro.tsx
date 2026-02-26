"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PomodoroTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"focus" | "break">("focus");

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Switch mode automatically? Or wait.
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
    };

    const switchMode = () => {
        const newMode = mode === "focus" ? "break" : "focus";
        setMode(newMode);
        setTimeLeft(newMode === "focus" ? 25 * 60 : 5 * 60);
        setIsActive(false);
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <Card className="bg-card/50 border-none shadow-none">
            <CardContent className="p-4 flex flex-col items-center space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm font-medium uppercase tracking-widest">{mode} Mode</span>
                </div>
                <div className="text-5xl font-bold font-mono tracking-tighter tabular-nums">
                    {formatTime(timeLeft)}
                </div>
                <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={toggleTimer}>
                        {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={resetTimer}>
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
                <Button variant="link" size="sm" onClick={switchMode} className="text-xs text-muted-foreground">
                    Switch to {mode === "focus" ? "Break" : "Focus"}
                </Button>
            </CardContent>
        </Card>
    );
}
