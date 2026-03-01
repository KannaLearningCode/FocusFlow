import { useState, useEffect, useCallback } from "react";

export function useTTS() {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [supported, setSupported] = useState(false);
    const [preferredVoiceName, setPreferredVoiceName] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            setSupported(true);

            const loadVoices = () => {
                const available = window.speechSynthesis.getVoices();
                // Keep only English (US) voices that sound natural or standard
                const usVoices = available.filter(v =>
                    v.lang.includes("en-US") ||
                    v.name.includes("United States") ||
                    v.name.includes("US")
                );

                // Sort to put Michelle first if she exists
                usVoices.sort((a, b) => {
                    if (a.name.includes("Michelle")) return -1;
                    if (b.name.includes("Michelle")) return 1;
                    return 0;
                });

                setVoices(usVoices.length > 0 ? usVoices : available);
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;

            // Load preferred voice from local storage
            const saved = localStorage.getItem("preferredVoice");
            if (saved) setPreferredVoiceName(saved);
        }
    }, []);

    const setVoice = useCallback((name: string) => {
        setPreferredVoiceName(name);
        localStorage.setItem("preferredVoice", name);
    }, []);

    const speak = useCallback((text: string, options?: {
        lang?: "GB" | "US";
        rate?: number;
        voiceName?: string;
        onBoundary?: (charIndex: number, word: string) => void;
        onEnd?: () => void;
    }) => {
        if (!supported) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const lang = options?.lang || "GB";

        let selectedVoice = options?.voiceName
            ? voices.find(v => v.name === options.voiceName)
            : voices.find(v => v.name === preferredVoiceName);

        if (!selectedVoice) {
            selectedVoice = voices.find(v => {
                if (lang === "GB") {
                    return (v.name.includes("Great Britain") || v.name.includes("UK"));
                } else {
                    return (v.name.includes("United States") || v.name.includes("US"));
                }
            });
        }

        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = options?.rate || 0.9;
        utterance.pitch = 1.0;

        if (options?.onBoundary) {
            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    const word = text.slice(event.charIndex).split(/\s+/)[0];
                    options.onBoundary!(event.charIndex, word);
                }
            };
        }

        if (options?.onEnd) {
            utterance.onend = options.onEnd;
        }

        window.speechSynthesis.speak(utterance);
    }, [voices, supported, preferredVoiceName]);

    const cancel = useCallback(() => {
        if (supported) window.speechSynthesis.cancel();
    }, [supported]);

    const pause = useCallback(() => {
        if (supported) window.speechSynthesis.pause();
    }, [supported]);

    const resume = useCallback(() => {
        if (supported) window.speechSynthesis.resume();
    }, [supported]);

    return { speak, cancel, pause, resume, supported, voices, setVoice, preferredVoiceName };
}
