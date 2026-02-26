"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/import-pdf", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Upload failed");
            }

            setResult(data);
            toast({
                title: "Import Successful",
                description: `Created article: ${data.articleTitle}`,
            });
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Import Failed",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto p-10 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">IELTS Content Import</h1>
                <p className="text-muted-foreground">Upload raw PDF reading passages to generate structured practice content.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload PDF</CardTitle>
                    <CardDescription>Select a PDF file containing an IELTS reading passage, questions, and answers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:bg-secondary/20 transition-colors relative">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-lg">
                                    {file ? file.name : "Click or drag to upload"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {file ? `${(file.size / 1024).toFixed(2)} KB` : "PDF files only"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full h-12 text-lg"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing with Gemini...
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2 h-5 w-5" />
                                Start Import
                            </>
                        )}
                    </Button>

                    {result && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-4">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-green-700 dark:text-green-300">Success!</h4>
                                <p className="text-sm text-muted-foreground">
                                    Article <strong>"{result.articleTitle}"</strong> has been created.
                                    <br />
                                    ID: {result.articleId}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
