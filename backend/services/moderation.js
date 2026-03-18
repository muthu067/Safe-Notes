const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { ModerationAPI } = require('@moderation-api/sdk');

let modApiClient;
if (process.env.MODAPI_SECRET_KEY && !process.env.MODAPI_SECRET_KEY.includes('insert-your-secret')) {
    modApiClient = new ModerationAPI({ secretKey: process.env.MODAPI_SECRET_KEY });
}

exports.checkContent = async (text, options = {}) => {
    if (!text) return { safe: true };

    const { authorId, conversationId, contentId, metadata } = options;

    if (!modApiClient) {
        console.warn("MODAPI_SECRET_KEY not configured. Text moderation is currently bypassed.");
        return { safe: true };
    }

    try {
        const body = {
            content: {
                text: text,
                type: 'text'
            },
            metadata: {
                preview: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
                ...metadata 
            }
        };

        if (authorId) body.authorId = String(authorId);
        if (conversationId) body.conversationId = String(conversationId);
        if (contentId) body.contentId = String(contentId);

        const response = await modApiClient.content.submit(body);

        if (response.evaluation?.flagged) {
            console.log(`[Moderation] Flagged content: ${text.substring(0, 20)}... Result: ${response.recommendation?.action}`);
        }

        if (response.evaluation?.flagged || response.recommendation?.action === 'reject') {
            return {
                safe: false,
                reason: `Content rejected by moderation policy: ${response.recommendation?.action || "Policy Violation"}`
            };
        }

        return { safe: true };
    } catch (err) {
        console.error("Moderation API Error:", err.message);
        return { safe: true };
    }
};

exports.checkImage = async (filePath, options = {}) => {
    const apiUser = process.env.SIGHTENGINE_API_USER;
    const apiSecret = process.env.SIGHTENGINE_API_SECRET;
    const { authorId, contentId } = options;

    if (!apiUser || !apiSecret) {
        console.warn("Sightengine API credentials not configured. Bypassing OCR.");
    }

    try {
        const formData = new FormData();
        formData.append('models', 'text');
        formData.append('api_user', apiUser);
        formData.append('api_secret', apiSecret);
        formData.append('media', fs.createReadStream(filePath));

        const response = await axios({
            method: 'post',
            url: 'https://api.sightengine.com/1.0/check.json',
            data: formData,
            headers: formData.getHeaders()
        });

        const data = response.data;
        let extractedText = "";

        if (data.status === 'success' && data.text) {
            extractedText = data.text.texts.map(t => t.text).join(' ');
        }

        if (!modApiClient) {
            console.warn("MODAPI_SECRET_KEY not configured. Bypassing image safety AI.");
            return { safe: true, extractedText };
        }

        const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });
        const ext = filePath.split('.').pop().toLowerCase();
        const mimeType = (ext === 'png') ? 'image/png' : 'image/jpeg';

        const body = {
            content: {
                data: `data:${mimeType};base64,${imageBase64}`,
                type: 'image'
            },
            metadata: {
                filename: filePath.split(/[\\/]/).pop()
            }
        };

        if (authorId) body.authorId = String(authorId);
        if (contentId) body.contentId = String(contentId);

        const modResponse = await modApiClient.content.submit(body);

        if (modResponse.evaluation?.flagged || modResponse.recommendation?.action === 'reject') {
            return {
                safe: false,
                extractedText: "",
                reason: `Image rejected by moderation policy: ${modResponse.recommendation?.action || "Policy Violation"}`
            };
        }

        return { safe: true, extractedText };

    } catch (err) {
        console.error("Image Moderation Error:", err.message);
        return { safe: true, extractedText: "" };
    }
};
