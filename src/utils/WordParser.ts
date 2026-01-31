import mammoth from "mammoth";

export interface Question {
    text: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    type?: 'MCQ' | 'TF' | 'SHORT'; // Added type property
}

export const parseExamWord = async (file: File): Promise<Question[]> => {
    const arrayBuffer = await file.arrayBuffer();
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

        // Nhận diện Câu hỏi: Câu 1. / Câu 1: / Câu 1
        if (text.match(/^Câu\s\d+[:.]?/i)) {
            if (currentQ) questions.push(currentQ);
            currentQ = { text, options: [], correctAnswer: -1, explanation: "", type: 'MCQ' };
        }
        // Nhận diện đáp án Trắc nghiệm (A. B. C. D.)
        else if (text.match(/^[A-D]\./i) && currentQ) {
            currentQ.options.push(text);
            if (html.includes('<u>')) {
                currentQ.correctAnswer = currentQ.options.length - 1;
            }
        }
        // Nhận diện Đúng/Sai (a) b) c) d))
        else if (text.match(/^[a-d]\)/i) && currentQ) {
            currentQ.type = 'TF';
            currentQ.options.push(text);
            // Lưu lại nếu ý này đúng (Underline)
            if (html.includes('<u>')) {
                // Với Đúng/Sai ta có thể xử lý phức tạp hơn, nhưng tạm thời lưu index cuối có gạch chân
                currentQ.correctAnswer = currentQ.options.length - 1;
            }
        }
        // Nhận diện Điền khuyết / Trả lời ngắn
        else if ((text.toLowerCase().startsWith('đáp án:') || text.toLowerCase().startsWith('kq:')) && currentQ) {
            currentQ.type = 'SHORT';
            if (html.includes('<u>')) {
                currentQ.correctAnswer = 999; // Mã đánh dấu câu điền khuyết
                currentQ.explanation = text.split(':')[1]?.trim() || "";
            }
        }
        else if (text.toLowerCase().includes('lời giải') && currentQ) {
            currentQ.explanation = text;
        }
    });

    if (currentQ) questions.push(currentQ);
    return questions;
};
