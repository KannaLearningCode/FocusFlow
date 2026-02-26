import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getCEFRPrompt } from "@/lib/cefr";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { text, targetLevel } = await req.json();

        if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const cefrDescriptor = getCEFRPrompt(targetLevel);

        const prompt = `
        Transform this sentence: "${text}"
        Target Proficiency: ${targetLevel || "B2"} (${cefrDescriptor}).
        
        Provide 3 versions in JSON format:
        {
            "casual": "Casual, conversational tone (approx ${targetLevel})",
            "academic": "Formal, structured tone (strict ${targetLevel}: ${cefrDescriptor})",
            "creative": "Expressive, literary tone (approx ${targetLevel})"
        }
        Do not explain. Just JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");

        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json(data);

    } catch (e) {
        console.error(e);
        return NextResponse.json({
            casual: "Error generating",
            academic: "Error generating",
            creative: "Error generating"
        });
    }
}
