"use client";

import { useState, useRef } from "react";

export function useAudioRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [latestBlob, setLatestBlob] = useState<Blob | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            setStream(s);
            mediaRecorderRef.current = new MediaRecorder(s);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setLatestBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));

                // Stop all tracks to release microphone
                s.getTracks().forEach(track => track.stop());
                setStream(null);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setAudioUrl(null);
            setLatestBlob(null);
        } catch (err) {
            console.error("Failed to start recording:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const resetRecorder = () => {
        setLatestBlob(null);
        setAudioUrl(null);
        setStream(null);
    };

    return {
        isRecording,
        audioUrl,
        latestBlob,
        stream,
        startRecording,
        stopRecording,
        resetRecorder
    };
}
