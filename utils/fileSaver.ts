
import type { AnalyzedData } from '../types';

declare const docx: any; // Using docx from CDN

export const saveAsDocx = (data: AnalyzedData) => {
    const { Packer, Document, Paragraph, TextRun, HeadingLevel } = docx;

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    text: data.title,
                    heading: HeadingLevel.TITLE,
                }),
                new Paragraph({ text: "" }), // spacing
                new Paragraph({
                    text: "Summary",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    children: [new TextRun(data.summary)],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    text: "Cleaned Transcription",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    children: [new TextRun(data.cleanedText)],
                }),
                new Paragraph({ text: "" }),
                new Paragraph({
                    text: "Chart Data",
                    heading: HeadingLevel.HEADING_1,
                }),
                ...data.chartData.map(item => new Paragraph({
                    children: [
                        new TextRun({ text: `${item.name}: `, bold: true }),
                        new TextRun(String(item.value)),
                    ],
                    bullet: { level: 0 },
                })),
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.title.replace(/\s+/g, '_') || 'analysis'}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
};
