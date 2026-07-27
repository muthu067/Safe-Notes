const { HfInference } = require('@huggingface/inference');
const fs = require('fs');
const path = require('path');
const { fromPath } = require('pdf2pic');

const hf = new HfInference(process.env.HF_API_KEY);
const HF_API_KEY = process.env.HF_API_KEY;

// Custom error type so callers can tell "OCR genuinely found nothing" apart
// from "OCR could not run at all" without string-matching error messages.
class OcrUnavailableError extends Error {
    constructor(message) {
        super(message);
        this.name = 'OcrUnavailableError';
    }
}

exports.OcrUnavailableError = OcrUnavailableError;

exports.ocrImage = async (filePath) => {
    const imageBuffer = fs.readFileSync(filePath);
    // Let errors propagate — the caller decides how to handle a failure,
    // it is never this function's job to invent placeholder text.
    return await callHuggingFaceAPI(imageBuffer);
};

exports.ocrPdf = async (filePath) => {
    const outputDir = path.join(__dirname, '../uploads');
    const options = {
        density: 150,
        saveFilename: "temp_ocr_" + Date.now(),
        savePath: outputDir,
        format: "jpg",
        width: 800,
        // Render's native runtime ships ImageMagick, not GraphicsMagick.
        // pdf2pic defaults to GraphicsMagick — force ImageMagick explicitly
        // so this doesn't silently depend on a tool that isn't installed.
        graphicsMagick: false
    };

    let convertedImagePath = null;

    try {
        const convert = fromPath(filePath, options);
        const result = await convert(1, { responseType: "image" });

        if (!result || !result.path) {
            throw new OcrUnavailableError('PDF-to-image conversion produced no output');
        }
        convertedImagePath = result.path;

        return await exports.ocrImage(convertedImagePath);

    } catch (err) {
        // A missing Ghostscript/ImageMagick binary is a known, named failure
        // mode — surface it as a typed error, never as fake extracted text.
        if (err.message && (err.message.includes('EPIPE') || err.message.includes('gs') || err.message.includes('gm'))) {
            console.warn("PDF OCR Warning: PDF rasterization failed — Ghostscript/ImageMagick may be missing from PATH.", err.message);
            throw new OcrUnavailableError('PDF rasterization tool (Ghostscript/ImageMagick) unavailable');
        }
        console.error("OCR PDF Error:", err.message);
        throw err;

    } finally {
        if (convertedImagePath && fs.existsSync(convertedImagePath)) {
            fs.unlinkSync(convertedImagePath);
        }
    }
};

async function callHuggingFaceAPI(imageBuffer) {
    if (!HF_API_KEY) {
        // Configuration problem, not "no text found" — throw, don't fake a result.
        throw new OcrUnavailableError('HF_API_KEY not configured');
    }

    try {
        const result = await hf.imageToText({
            model: 'microsoft/trocr-small-handwritten',
            data: imageBuffer,
        });

        return result.generated_text || "";
    } catch (err) {
        console.error("HF Inference SDK Error:", err.message);
        throw new OcrUnavailableError(`Hugging Face OCR failed: ${err.message}`);
    }
}
