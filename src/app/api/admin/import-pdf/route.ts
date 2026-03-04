import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { GoogleGenerativeAI } from "@google/generative-ai";
import PDFParser from "pdf2json";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract Text using pdf2json
        const rawText = await new Promise<string>((resolve, reject) => {
            const pdfParser = new (PDFParser as any)(null, 1); // 1 = text content only

            pdfParser.on("pdfParser_dataError", (errData: any) => {
                reject(new Error(errData.parserError));
            });

            pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                const text = pdfParser.getRawTextContent();
                resolve(text);
            });

            pdfParser.parseBuffer(buffer);
        });

        if (!rawText || rawText.length < 50) {
            return NextResponse.json({ error: "Could not extract sufficient text from PDF" }, { status: 400 });
        }

        // Gemini Processing
        const prompt = `
        You are an IELTS Data Cleaning Engine. 
        I will provide raw text extracted from an IELTS Reading PDF.
        Your task is to:
        1. Analyize the text.
        2. Extract the main Article/Passage Title.
        3. Clean and format the main Article Content into standard Markdown. Remove artifacts like page numbers, headers, or "Test 1" labels. Preserve paragraph breaks.
        4. Extract the Questions.
        5. Extract the Answer Key if present (usually at the end or recognized by "Answer Key"). If no answer key is found, leave the "answers" object empty.
        6. Determine the CEFR Level (usually B2, C1, or C2 for IELTS).

        Raw Text:
        """
        ${rawText.substring(0, 30000)} 
        """

        Return strictly a JSON object with this structure:
        {
            "title": "String",
            "content": "Markdown String",
            "level": "String (e.g., C1)",
            "questions": [
                {
                    "id": "String (e.g. '1', '2', 'Q1')",
                    "type": "String (MPQ, TrueFalse, FillBlank, Matching)",
                    "questionText": "String",
                    "options": ["Array of strings if MCQ"],
                    "correctAnswer": "String (if found in text, else empty)",
                    "explanation": "String (Optional explanation if you can infer it)"
                }
            ],
            "answers": {
                "1": "Answer",
                "2": "Answer"
            }
        }
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        // Save to MongoDB
        await connectDB();

        // Sanitize Questions
        const questions = (data.questions || []).map((q: any) => ({
            id: String(q.id),
            questionType: q.type || q.questionType || "Unknown",
            questionText: q.questionText || "",
            options: Array.isArray(q.options) ? q.options.map(String) : [],
            correctAnswer: q.correctAnswer || "",
            explanation: q.explanation || ""
        }));

        const newArticle = new Article({
            title: data.title || file.name.replace(".pdf", ""),
            content: data.content || "<i>No content extracted</i>",
            readingTime: Math.ceil((data.content?.split(" ").length || 0) / 200) + " min",
            difficulty_level: data.level || "C1",
            topic: "IELTS Practice",
            originalPdfName: file.name,
            questions: questions,
            answers: data.answers || {}
        });

        await newArticle.save();

        return NextResponse.json({
            message: "Import successful",
            articleId: newArticle._id,
            articleTitle: newArticle.title
        });

    } catch (e: any) {
        console.error("Import Error:", e);
        return NextResponse.json({ error: e.message || "Failed to import" }, { status: 500 });
    }
}
