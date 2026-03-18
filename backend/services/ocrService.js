const { HfInference } = require('@huggingface/inference');
const fs = require('fs');
const path = require('path');
const { fromPath } = require('pdf2pic');

const hf = new HfInference(process.env.HF_API_KEY); 
const HF_API_KEY = process.env.HF_API_KEY; 

exports.ocrImage = async (filePath) => {
    try {
        const imageBuffer = fs.readFileSync(filePath);
        return await callHuggingFaceAPI(imageBuffer);
    } catch (err) {
        console.error("OCR Image Error:", err);
        return "";
    }
};

exports.ocrPdf = async (filePath) => {
    try {
        const outputDir = path.join(__dirname, '../uploads');
        const options = {
            density: 150,
            saveFilename: "temp_ocr_" + Date.now(),
            savePath: outputDir,
            format: "jpg",
            width: 800
        };
        const convert = fromPath(filePath, options);
        const result = await convert(1, { responseType: "image" });
        
        let extractedText = "";
        if (result && result.path) {
            extractedText = await this.ocrImage(result.path);
            if (fs.existsSync(result.path)) {
                fs.unlinkSync(result.path);
            }
        }
        return extractedText;
    } catch (err) {
        if (err.message.includes('EPIPE') || err.message.includes('gs')) {
            console.warn("PDF OCR Warning: Scanned document detected but Ghostscript is not in PATH. OCR skipped for this PDF.");
            return "[Scan detected: Please install Ghostscript to enable OCR for handwritten PDFs]";
        }
        console.error("OCR PDF Error:", err.message);
        return "";
    }
};

async function callHuggingFaceAPI(imageBuffer) {
    if (!HF_API_KEY) {
        console.warn("HF_API_KEY not configured. Bypassing Hugging Face OCR.");
        return "HF_API_KEY not configured. OCR unavailable.";
    }

    try {
        const result = await hf.imageToText({
            model: 'microsoft/trocr-small-handwritten',
            data: imageBuffer,
        });

        return result.generated_text || "";
    } catch (err) {
        console.error("HF Inference SDK Error:", err.message);
        return "Failed to extract text. Note might be too complex or API limit reached.";
    }
}
