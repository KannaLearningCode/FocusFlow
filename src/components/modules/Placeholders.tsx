"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface PlaceholderProps {
    title: string;
    description: string;
    Icon: LucideIcon;
}

export function Placeholder({ title, description, Icon }: PlaceholderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-[60vh] text-center p-8"
        >
            <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-border shadow-lg">
                <Icon className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">{title}</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-lg leading-relaxed">
                {description}
            </p>
            <div className="mt-8 px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
                Coming Soon
            </div>
        </motion.div>
    );
}
