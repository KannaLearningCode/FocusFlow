import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash";

export async function POST(req: Request) {
    try {
        const { mode, level } = await req.json();

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        let prompt = "";
        if (mode === "sentence") {
            prompt = `
            Act as an IELTS Writing Coach. Generate a "Sentence Builder" challenge for a student at ${level} level.
            Provide:
            1. A target vocabulary word (C1/C2 level) and its Vietnamese meaning.
            2. A grammar structure to use (e.g., "Inverted sentences", "Conditional Type 3", etc.).
            3. A brief instruction in Vietnamese.

            Return JSON only:
            {
              "target_word": "...",
              "target_word_vn": "...",
              "grammar_structure": "...",
              "instruction": "..."
            }
            `;
        } else if (mode === "paragraph") {
            prompt = `
            Act as an IELTS Writing Coach. Generate a "Paragraph Focus" challenge for a student at ${level} level.
            Provide:
            1. A topic sentence (IELTS Task 2 style).
            2. 3-4 keywords that MUST be included in the explanation.
            3. A brief instruction in Vietnamese telling the user to write a 50-100 word supporting paragraph.

            Return JSON only:
            {
              "topic_sentence": "...",
              "keywords": ["...", "...", "..."],
              "instruction": "..."
            }
            `;
        } else {
            return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/{[\s\S]*}/);
        const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json|```/g, "").trim() : text;
        const data = JSON.parse(jsonStr);

        return NextResponse.json(data);
    } catch (e: any) {
        console.error("Prompt Generation Error:", e);
        return NextResponse.json({ error: "Failed to generate prompt" }, { status: 500 });
    }
}
