"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTTS } from "./useTTS";

export interface Message {
    role: "user" | "ai";
    text: string;
    ipa?: string;
    focusWords?: string[];
}

export interface IELTSResults {
    bandScore?: number;
    overallFeedback?: string;
    criteria?: {
        fluency: string;
        lexicalResource: string;
        grammar: string;
        pronunciation: string;
    };
}

export function useConversation() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [currentAiResponse, setCurrentAiResponse] = useState<Message | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isIELTSMode, setIsIELTSMode] = useState(false);
    const [testResults, setTestResults] = useState<IELTSResults | null>(null);
    const [isTestCompleted, setIsTestCompleted] = useState(false);

    const { speak, cancel, supported: ttsSupported } = useTTS();

    const messagesRef = useRef<Message[]>([]);

    // Update ref whenever messages changes
    useEffect(() => {
        messagesRef.current = messages;
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.role === "ai") {
            setCurrentAiResponse(lastMsg);
        }
    }, [messages]);

    const sendMessage = useCallback(async (text: string) => {
        if (isTestCompleted) return;

        // Add user message immediately
        const userMsg: Message = { role: "user", text };
        setMessages(prev => [...prev, userMsg]);
        setIsThinking(true);
        setError(null);

        try {
            // Call API
            const res = await fetch("/api/conversation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    history: messagesRef.current.slice(-5),
                    user_latest: text,
                    isIELTS: isIELTSMode
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Partner error: ${res.status}`);
            }

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server returned non-JSON response");
            }

            const data = await res.json();

            if (data.test_completed) {
                setIsTestCompleted(true);
                setTestResults({
                    bandScore: data.band_score,
                    overallFeedback: data.overall_feedback,
                    criteria: {
                        fluency: data.detailed_criteria?.fluency || "",
                        lexicalResource: data.detailed_criteria?.lexical_resource || "",
                        grammar: data.detailed_criteria?.grammar || "",
                        pronunciation: data.detailed_criteria?.pronunciation || ""
                    }
                });
            }

            const aiMsg: Message = {
                role: "ai",
                text: data.response_text,
                ipa: data.response_ipa,
                focusWords: data.pronunciation_focus_words
            };

            setMessages(prev => [...prev, aiMsg]);
            speak(aiMsg.text, { rate: 0.95 });
            return aiMsg;
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Failed to connect to linguistic partner");
        } finally {
            setIsThinking(false);
        }
    }, [speak, isIELTSMode, isTestCompleted]);

    const sendVoiceMessage = useCallback(async (blob: Blob) => {
        if (isTestCompleted) return;
        setIsThinking(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("audio", blob);
            formData.append("history", JSON.stringify(messagesRef.current.slice(-5)));
            formData.append("isIELTS", isIELTSMode.toString());

            const res = await fetch("/api/conversation", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Partner error: ${res.status}`);
            }

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server returned non-JSON response");
            }

            const data = await res.json();

            if (data.test_completed) {
                setIsTestCompleted(true);
                setTestResults({
                    bandScore: data.band_score,
                    overallFeedback: data.overall_feedback,
                    criteria: {
                        fluency: data.detailed_criteria?.fluency || "",
                        lexicalResource: data.detailed_criteria?.lexical_resource || "",
                        grammar: data.detailed_criteria?.grammar || "",
                        pronunciation: data.detailed_criteria?.pronunciation || ""
                    }
                });
            }

            // Add user message with transcription from Gemini
            const userMsg: Message = { role: "user", text: data.user_transcription || "(Audio message)" };

            const aiMsg: Message = {
                role: "ai",
                text: data.response_text,
                ipa: data.response_ipa,
                focusWords: data.pronunciation_focus_words
            };

            setMessages(prev => [...prev, userMsg, aiMsg]);
            speak(aiMsg.text, { rate: 0.95 });
            return aiMsg;
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Voice processing failed");
        } finally {
            setIsThinking(false);
        }
    }, [speak, isIELTSMode, isTestCompleted]);

    const resetConversation = () => {
        setMessages([]);
        setCurrentAiResponse(null);
        setIsTestCompleted(false);
        setTestResults(null);
        cancel();
    };

    const replayLastAi = (slow: boolean = false) => {
        if (currentAiResponse) {
            speak(currentAiResponse.text, { rate: slow ? 0.7 : 0.95 });
        }
    };

    return {
        messages,
        isThinking,
        sendMessage,
        sendVoiceMessage,
        resetConversation,
        replayLastAi,
        currentAiResponse,
        error: error,
        isIELTSMode,
        setIsIELTSMode,
        testResults,
        isTestCompleted
    };
}
