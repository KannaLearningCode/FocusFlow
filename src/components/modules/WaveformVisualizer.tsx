"use client";

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
    stream: MediaStream | null;
    isRecording: boolean;
    color?: string;
}

export function WaveformVisualizer({ stream, isRecording, color = "#6366f1" }: WaveformVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!isRecording || !stream) {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const audioContext = new AudioContextClass();
        const analyzer = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        source.connect(analyzer);
        analyzer.fftSize = 256;

        analyzerRef.current = analyzer;
        audioContextRef.current = audioContext;

        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const draw = () => {
            if (!analyzer) return;
            animationRef.current = requestAnimationFrame(draw);
            analyzer.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;

                ctx.fillStyle = color;
                // Rounded bars
                ctx.beginPath();
                ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 4);
                ctx.fill();

                x += barWidth;
            }
        };

        draw();

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContext.state !== "closed") audioContext.close();
        };
    }, [isRecording, stream, color]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={60}
            className="w-full h-16 opacity-80"
        />
    );
}
