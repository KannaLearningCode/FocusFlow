import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { text, topic } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Article text is required" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        Based on the provided text, generate 10 questions to test reading comprehension (C1/C2 Level).
        
        Text Topic: ${topic || "General"}
        Text Content:
        "${text.substring(0, 3000)}..." 

        Requirements:
        1. **Total 10 Questions**:
           - Questions 1-5: Multiple Choice Questions (MCQ) with 4 options (A, B, C, D).
           - Questions 6-10: True/False/Not Given questions. Options must be ["True", "False", "Not Given"].
        2. **Language**: 
           - Questions and Options in **English**.
           - **Explanation** MUST be in **Vietnamese**.
        3. **Content**: Focus on main ideas, inference, and specific details.
        
        Return strictly JSON:
        { 
            "questions": [ 
                { 
                    "question": "Question text...", 
                    "options": ["Option A", "Option B", "Option C", "Option D"], // Or ["True", "False", "Not Given"]
                    "answer": 0, // Index of correct option
                    "explanation": "Giải thích chi tiết tại sao đáp án này đúng bằng tiếng Việt..." 
                } 
            ] 
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text();

        let data;
        try {
            data = JSON.parse(jsonText);
        } catch (e) {
            const match = jsonText.match(/\{[\s\S]*\}/);
            if (match) data = JSON.parse(match[0]);
            else throw new Error("Failed to parse quiz JSON");
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Generate Quiz Error:", error);
        return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 });
    }
}
