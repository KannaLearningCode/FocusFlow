
export const CEFR_DESCRIPTORS = {
    "A1": "CEFR A1 (Beginner). Very basic vocabulary, simple short sentences, focus on concrete familiar topics.",
    "A2": "CEFR A2 (Elementary). Basic vocabulary, simple sentences, focus on routine and direct information.",
    "B1": "CEFR B1 (Intermediate). Simple vocabulary, short sentences, focus on daily topics.",
    "B2": "CEFR B2 (Upper Intermediate). Varied vocabulary, complex sentences, ability to discuss abstract topics.",
    "C1": "CEFR C1 (Advanced). Advanced vocabulary, complex syntax, academic and professional tone.",
    "C2": "CEFR C2 (Proficiency). Sophisticated vocabulary, nuanced expression, native-level complexity."
};

export type CEFRLevel = keyof typeof CEFR_DESCRIPTORS;

export function getCEFRPrompt(level: string): string {
    const key = (level || "C1") as CEFRLevel;
    return CEFR_DESCRIPTORS[key] || CEFR_DESCRIPTORS["C1"];
}
