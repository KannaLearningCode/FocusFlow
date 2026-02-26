import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LevelProvider } from "@/context/LevelContext";
import { VocabularyProvider } from "@/context/VocabularyContext";
import { ToastProvider } from "@/components/ui/use-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
    title: "FocusFlow | ADHD-Friendly Language Learning",
    description: "Master English with hyper-focus tools.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}>
                <LevelProvider>
                    <VocabularyProvider>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </VocabularyProvider>
                </LevelProvider>
            </body>
        </html>
    );
}
