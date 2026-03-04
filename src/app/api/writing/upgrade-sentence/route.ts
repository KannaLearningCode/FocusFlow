import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash";

export async function POST(req: Request) {
    try {
        const { sentence, context } = await req.json();

        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `
        Act as an IELTS Writing Expert. I will provide a sentence written by a student and its context. 
        Your task is to provide 3 upgraded versions of this sentence that display higher Lexical Resource and Grammatical Range & Accuracy.

        Sentence: "${sentence}"
        Context: "${context}"

        Provide 3 versions:
        1. "B2 Standard": Natural, clear, for a Band 6.5-7.0.
        2. "C1 Advanced": Sophisticated, using academic collocations, for a Band 7.5-8.0.
        3. "C2 Master": Near-native, idiomatic yet academic, for a Band 8.5-9.0.

        Explain briefly what changed in Vietnamese for each version.

        Return JSON only:
        {
          "upgrades": [
            { "level": "B2 Standard", "text": "...", "explanation": "..." },
            { "level": "C1 Advanced", "text": "...", "explanation": "..." },
            { "level": "C2 Master", "text": "...", "explanation": "..." }
          ]
        }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/{[\s\S]*}/);
        const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json|```/g, "").trim() : text;
        const data = JSON.parse(jsonStr);

        return NextResponse.json(data);
    } catch (e: any) {
        console.error("Upgrade Error:", e);
        return NextResponse.json({ error: "Failed to upgrade sentence" }, { status: 500 });
    }
}
