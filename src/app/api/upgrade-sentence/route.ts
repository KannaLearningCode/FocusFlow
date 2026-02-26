import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { sentence, style = "Academic", level = "C1" } = await req.json();

        if (!sentence) {
            return NextResponse.json(
                { error: "Sentence is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `
      Act as a Linguistic Expert. Convert the input sentence to a ${style} tone at ${level} level.
      
      Input: "${sentence}"
      
      Requirements:
      1. Tone: ${style} (Academic = formal/scholarly, Casual = natural/idiomatic, Business = professional/concise).
      2. Level: ${level}.
      3. Focus: Use advanced vocabulary, diverse sentence structures, and precise grammar.
      
      Return a JSON object:
      {
        "upgraded_sentence": "The transformed sentence",
        "vietnamese_translation": "Full Vietnamese translation of the upgraded sentence",
        "syntax_analysis": "Detailed analysis of syntax changes (Vietnamese)",
        "grammar_note": "Key grammatical structures used in the upgraded sentence (Vietnamese)",
        "vocabulary_suggestions": [
           { 
             "word": "word", 
             "definition": "English definition", 
             "wordClass": "noun/verb/adj", 
             "ipa": "/ipa/" 
           }
        ],
        "highlighted_segments": ["Segment 1", "Segment 2"], 
        "explanation": "Brief summary of improvements (Vietnamese)"
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Safety check if JSON parsing fails, though responseMimeType usually guarantees it
        try {
            const jsonResponse = JSON.parse(text);
            return NextResponse.json(jsonResponse);
        } catch (e) {
            console.error("Failed to parse JSON:", text);
            return NextResponse.json(
                { error: "Failed to parse AI response" },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
