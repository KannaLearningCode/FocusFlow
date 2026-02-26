"use client";

import { useTTS } from "@/hooks/useTTS";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Check, Settings2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function VoiceSettings() {
    const { voices, speak, setVoice, preferredVoiceName } = useTTS();

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Cài đặt Giọng đọc (TTS)</h1>
                <p className="text-muted-foreground">
                    Chọn giọng đọc từ danh sách hỗ trợ bởi trình duyệt của bạn.
                </p>
            </header>

            <div className="grid gap-4">
                {voices.map((voice) => {
                    const isSelected = voice.name === preferredVoiceName;

                    return (
                        <Card
                            key={voice.name}
                            className={cn(
                                "transition-all hover:shadow-md border-2",
                                isSelected ? "border-primary bg-primary/5" : "border-transparent"
                            )}
                        >
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground">{voice.name}</span>
                                        {isSelected && (
                                            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                                                <Check className="w-2 h-2" /> Đang dùng
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {voice.lang}</span>
                                        <span>Local Service: {voice.localService ? "Yes" : "No"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => speak("Hello! This is a test of my voice. How do I sound?", { voiceName: voice.name, rate: 1.0 })}
                                        className="gap-2"
                                    >
                                        <Play className="w-4 h-4 fill-current" /> Nghe thử
                                    </Button>
                                    {!isSelected && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setVoice(voice.name)}
                                            className="gap-2"
                                        >
                                            <Settings2 className="w-4 h-4" /> Chọn giọng này
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {voices.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed rounded-3xl text-muted-foreground italic">
                        Không tìm thấy giọng đọc nào trong trình duyệt của bạn.
                    </div>
                )}
            </div>
        </div>
    );
}
