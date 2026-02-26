import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MODEL_NAME = "gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    const { topic, essay } = await req.json();

    if (!topic || !essay) {
      return NextResponse.json({ error: "Topic and Essay are required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
        You are a strict, certified IELTS Examiner with 15 years of experience. Your task is to grade the user's essay based on the official IELTS Writing Task 2 criteria.

        Input:
        Topic: ${topic}
        Essay: ${essay}

        Output format: JSON only.

        Grading Rubric:
        Task Response (TR): Did they address all parts of the prompt? Is the position clear?
        Coherence & Cohesion (CC): Logical flow, paragraphing, and linking words.
        Lexical Resource (LR): Vocabulary range, collocations, and spelling.
        Grammatical Range & Accuracy (GRA): Sentence structures and grammar errors.

        JSON Structure:
        {
          "band_score": 6.5,
          "breakdown": {
            "TR": 6.0,
            "CC": 7.0,
            "LR": 6.0,
            "GRA": 6.0
          },
          "examiner_comment": "A summary in VIETNAMESE (max 50 words).",
          "key_improvements": [
            "Improvement in VIETNAMESE",
            "Improvement in VIETNAMESE"
          ],
          "detailed_corrections": [
            {
              "original_text": "text with error",
              "correction": "corrected text",
              "type": "Grammar/Vocab/Spelling",
              "explanation": "Reason in VIETNAMESE."
            }
          ]
        }

        Constraints:
        Be strict but constructive.
        All qualitative feedback (comments, explanations, improvements) MUST BE IN VIETNAMESE.
        If the essay is off-topic, give a Band 0 for TR.
        Highlight at least 3 specific grammar/vocab errors in detailed_corrections.
        Return ONLY the JSON object.
        `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from markdown code block if present
    const jsonMatch = text.match(/```json\n([\s\S]*)\n```/) || text.match(/{[\s\S]*}/);
    const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json|```/g, "").trim() : text;

    try {
      const data = JSON.parse(jsonStr);
      return NextResponse.json(data);
    } catch (e) {
      console.error("Failed to parse JSON", e);
      console.log("Raw text:", text);
      return NextResponse.json({ error: "Failed to parse grading result" }, { status: 500 });
    }

  } catch (e: any) {
    console.error("Grading Error:", e);
    return NextResponse.json({ error: e.message || "Failed to grade essay" }, { status: 500 });
  }
}
