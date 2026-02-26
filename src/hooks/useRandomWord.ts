import { useState } from "react";

const ACADEMIC_WORDS = [
    {
        word: "ubiquitous",
        ipa: "/juːˈbɪkwɪtəs/",
        definition: "Present, appearing, or found everywhere.",
        example: "Smartphones have become ubiquitous in modern society.",
        meaningVN: "Phổ biến, ở đâu cũng có",
        collocations: ["ubiquitous presence", "ubiquitous computing"],
        verbCollocations: ["become", "remain"],
        synonyms: ["omnipresent", "pervasive", "universal"],
        antonyms: ["rare", "scarce"]
    },
    {
        word: "ephemeral",
        ipa: "/ɪˈfɛm(ə)r(ə)l/",
        definition: "Lasting for a very short time.",
        example: "Fashions are ephemeral, changing with every season.",
        meaningVN: "Phù du, chóng tàn, ngắn ngủi",
        collocations: ["ephemeral nature", "ephemeral beauty"],
        verbCollocations: ["seem", "remain"],
        synonyms: ["transient", "fleeting", "short-lived"],
        antonyms: ["permanent", "enduring"]
    },
    {
        word: "paradigm",
        ipa: "/ˈparədʌɪm/",
        definition: "A typical example or pattern of something; a model.",
        example: "The discovery introduced a new paradigm in physics.",
        meaningVN: "Mô hình, kiểu mẫu",
        collocations: ["paradigm shift", "dominant paradigm"],
        verbCollocations: ["shift", "challenge", "establish"],
        synonyms: ["model", "pattern", "prototype"],
        antonyms: ["anomaly"]
    },
    {
        word: "cacophony",
        ipa: "/kəˈkɒf(ə)ni/",
        definition: "A harsh discordant mixture of sounds.",
        example: "A cacophony of deafening alarm bells.",
        meaningVN: "Tạp âm, âm thanh hỗn loạn",
        collocations: ["cacophony of sounds", "deafening cacophony"],
        verbCollocations: ["create", "hear"],
        synonyms: ["din", "racket", "discord"],
        antonyms: ["harmony", "silence"]
    },
    {
        word: "enigma",
        ipa: "/ɪˈnɪɡmə/",
        definition: "A person or thing that is mysterious or difficult to understand.",
        example: "The disappearance of the plane remains an enigma.",
        meaningVN: "Điều bí ẩn, người khó hiểu",
        collocations: ["remain an enigma", "complete enigma"],
        verbCollocations: ["remain", "solve"],
        synonyms: ["mystery", "puzzle", "riddle"],
        antonyms: ["open book"]
    },
    // Adding minimal details for others to avoid massive file bloat in this turn, but consistent structure
    {
        word: "pragmatic",
        ipa: "/praɡˈmatɪk/",
        definition: "Dealing with things sensibly and realistically.",
        example: "A pragmatic approach to politics.",
        meaningVN: "Thực tế, thực dụng",
        collocations: ["pragmatic approach", "pragmatic solution"],
        verbCollocations: ["adopt", "remain"],
        synonyms: ["practical", "realistic"],
        antonyms: ["idealistic"]
    },
    {
        word: "meticulous",
        ipa: "/mɪˈtɪkjʊləs/",
        definition: "Showing great attention to detail; very careful and precise.",
        example: "He had always been so meticulous about his appearance.",
        meaningVN: "Tỉ mỉ, kỹ càng",
        collocations: ["meticulous attention", "meticulous planning"],
        verbCollocations: ["be", "require"],
        synonyms: ["careful", "diligent", "scrupulous"],
        antonyms: ["careless"]
    },
    {
        word: "eloquent",
        ipa: "/ˈɛləkwənt/",
        definition: "Fluent or persuasive in speaking or writing.",
        example: "An eloquent speech.",
        meaningVN: "Hùng hồn, có sức thuyết phục",
        collocations: ["eloquent speaker", "eloquent speech"],
        verbCollocations: ["be", "sound"],
        synonyms: ["articulate", "expressive"],
        antonyms: ["inarticulate"]
    },
    {
        word: "resilient",
        ipa: "/rɪˈzɪlɪənt/",
        definition: "Able to withstand or recover quickly from difficult conditions.",
        example: "Babies are generally far more resilient than we realize.",
        meaningVN: "Kiên cường, mau phục hồi",
        collocations: ["resilient economy", "highly resilient"],
        verbCollocations: ["prove", "remain"],
        synonyms: ["strong", "tough", "hardy"],
        antonyms: ["vulnerable", "fragile"]
    },
    {
        word: "altruistic",
        ipa: "/ˌaltruːˈɪstɪk/",
        definition: "Showing a disinterested and selfless concern for the well-being of others.",
        example: "It was an entirely altruistic act.",
        meaningVN: "Vị tha, không ích kỷ",
        collocations: ["altruistic act", "altruistic motive"],
        verbCollocations: ["be", "seem"],
        synonyms: ["unselfish", "selfless"],
        antonyms: ["selfish"]
    }
];

export function useRandomWord() {
    const [word, setWord] = useState<typeof ACADEMIC_WORDS[0] | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchWord = () => {
        setLoading(true);
        // Simulate network request
        setTimeout(() => {
            const random = ACADEMIC_WORDS[Math.floor(Math.random() * ACADEMIC_WORDS.length)];
            setWord(random);
            setLoading(false);
        }, 600);
    };

    return { word, loading, fetchWord };
}
