"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    title: string;
    description?: string;
    type?: ToastType;
}

interface ToastContextType {
    toast: (props: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback(({ title, description, type = "info" }: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, description, type }]);
        setTimeout(() => removeToast(id), 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-background border border-border/50 shadow-lg rounded-lg p-4 w-80 pointer-events-auto flex gap-3 items-start"
                        >
                            <div className={`w-1 h-full rounded bg-${t.type === "success" ? "green" : t.type === "error" ? "red" : "blue"}-500 absolute left-0 top-0 bottom-0`} />
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm">{t.title}</h4>
                                {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                            </div>
                            <button onClick={() => removeToast(t.id)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
