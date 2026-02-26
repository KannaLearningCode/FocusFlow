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
                setVoices(available);
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

    const speak = useCallback((text: string, options?: { lang?: "GB" | "US"; rate?: number; voiceName?: string }) => {
        if (!supported) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const lang = options?.lang || "GB";

        // 1. Try specified voice if provided (for previews)
        // 2. Try preferred voice from settings
        // 3. Fallback to default logic
        let selectedVoice = options?.voiceName
            ? voices.find(v => v.name === options.voiceName)
            : voices.find(v => v.name === preferredVoiceName);

        if (!selectedVoice) {
            selectedVoice = voices.find(v => {
                if (lang === "GB") {
                    return (v.name.includes("Great Britain") || v.name.includes("UK") || v.name.includes("Google UK English Female"));
                } else {
                    return (v.name.includes("United States") || v.name.includes("US") || v.name.includes("Google US English"));
                }
            });
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = options?.rate || 0.9;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    }, [voices, supported, preferredVoiceName]);

    const cancel = useCallback(() => {
        if (supported) {
            window.speechSynthesis.cancel();
        }
    }, [supported]);

    return { speak, cancel, supported, voices, setVoice, preferredVoiceName };
}
