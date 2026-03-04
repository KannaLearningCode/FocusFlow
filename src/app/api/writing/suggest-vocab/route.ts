import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash";

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `
        Act as an IELTS Writing Expert. I will provide a short text or sentence. 
        Your task is to identify 2-3 "simple" or "repetitive" words and suggest high-level, academic alternatives (IELTS Band 7.5+).

        Text: "${text}"

        For each word, provide:
        1. The original word.
        2. 2-3 advanced alternatives.
        3. A brief explanation in Vietnamese of why the alternative is better in an academic context.

        Return JSON only:
        {
          "suggestions": [
            { "original": "...", "alternatives": ["...", "..."], "explanation": "..." },
            ...
          ]
        }
        `;

        const result = await model.generateContent(prompt);
        const text_res = result.response.text();
        const jsonMatch = text_res.match(/```json\n([\s\S]*)\n```/) || text_res.match(/{[\s\S]*}/);
        const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json|```/g, "").trim() : text_res;
        const data = JSON.parse(jsonStr);

        return NextResponse.json(data);
    } catch (e: any) {
        console.error("Vocab Suggestion Error:", e);
        return NextResponse.json({ error: "Failed to suggest vocabulary" }, { status: 500 });
    }
}
