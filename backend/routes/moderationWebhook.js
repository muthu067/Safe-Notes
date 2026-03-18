const express = require('express');
const { ModerationAPI } = require('@moderation-api/sdk');
const Note = require('../models/Note');
const router = express.Router();

const moderationApi = new ModerationAPI({
    secretKey: process.env.MODAPI_SECRET_KEY
});

// Moderation Webhook Handler
// This allows the server to receive notifications from the Moderation API Dashboard
// For example: when a moderator manually REJECTS or APPROVES an item in the queue.
router.post(
    '/',
    express.raw({ type: 'application/json' }), // Moderation API sends JSON, but we need raw for signature verification
    async (req, res) => {
        const signature = req.header('modapi-signature');
        const secret = process.env.MODAPI_WEBHOOK_SECRET;

        if (!signature) {
            console.error("Moderation Webhook Error: No signature header");
            return res.status(400).json({ error: 'No signature header' });
        }

        try {
            // Validate the signature from the cloud API
            const payload = await moderationApi.webhooks.constructEvent(
                req.body,
                signature,
                secret
            );

            console.log(`Moderation Webhook Received Event: ${payload.action?.key || payload.type}`);

            const contentId = payload.content?.id;

            switch (payload.action?.key) {
                case 'ITEM_REJECT':
                    // The note was rejected in the dashboard.
                    if (contentId) {
                        const reason = payload.action?.reason || "Safety Policy Violation";
                        await Note.findByIdAndUpdate(contentId, {
                            status: 'rejected',
                            rejectionReason: reason
                        });
                        console.log(`Note ${contentId} successfully marked as REJECTED in database. Reason: ${reason}`);
                    }
                    break;
                case 'ITEM_ALLOW':
                    if (contentId) {
                        await Note.findByIdAndUpdate(contentId, { status: 'active' });
                    }
                    break;
                case 'AUTHOR_BLOCK':
                    console.log(`User ${payload.author?.id} was blocked globally.`);
                    break;
                default:
                    // Other events like ITEM_ALLOW, etc.
                    break;
            }

            return res.json({ received: true });
        } catch (err) {
            console.error("Moderation Webhook Verification Error:", err.message);
            return res.status(401).json({ error: 'Webhook signature verification failed' });
        }
    }
);

module.exports = router;
