import { NextResponse } from "next/server";

const FACTS = [
    { fact: "The word 'set' has the highest number of definitions in the English language.", category: "Lexicography" },
    { fact: "A 'pangram' is a sentence that uses every letter of the alphabet.", category: "Terminology" },
    { fact: "The dot over the letter 'i' and 'j' is called a tittle.", category: "Typography" },
    { fact: "English is the language of the air; all pilots must speak it regardless of origin.", category: "General Info" },
    { fact: "The oldest word in the English language is 'town'.", category: "Etymology" },
    { fact: "Buffalo buffalo Buffalo buffalo buffalo buffalo Buffalo buffalo is a grammatically correct sentence.", category: "Syntax" }
];

export async function GET() {
    // Return a random fact
    const random = FACTS[Math.floor(Math.random() * FACTS.length)];
    return NextResponse.json(random);
}
