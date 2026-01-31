import mammoth from "mammoth";

export interface Question {
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export const parseExamWord = async (file: File): Promise<Question[]> => {
    const arrayBuffer = await file.arrayBuffer();
    // Mammoth allows custom style mapping to capture underlines (<u>)
    const result = await mammoth.convertToHtml({ arrayBuffer }, {
        styleMap: ["u => u"]
    });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.value;
    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));

    const questions: Question[] = [];
    let currentQ: any = null;

    paragraphs.forEach(p => {
        const text = p.textContent?.trim() || "";
        const html = p.innerHTML;

        // Detect Question: "Câu 1." or "Câu 1:"
        if (text.match(/^Câu\s\d+[:.]/i)) {
            if (currentQ) questions.push(currentQ);
            currentQ = { text, options: [], correctAnswer: -1, explanation: "" };
        }
        // Detect Options: A. B. C. D.
        else if (text.match(/^[A-D]\./i) && currentQ) {
            currentQ.options.push(text);
            // Check if the HTML contains <u> for the correct answer
            if (html.includes('<u>')) {
                currentQ.correctAnswer = currentQ.options.length - 1;
            }
        }
        // Detect Explanation/Solution
        else if ((text.toLowerCase().includes('lời giải') || text.toLowerCase().includes('hướng dẫn')) && currentQ) {
            currentQ.explanation = text;
        }
    });

    if (currentQ) questions.push(currentQ);
    return questions;
};
