const mongoose = require('mongoose');
const Note = require('../models/Note');
const moderationService = require('../services/moderation');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const fs = require('fs');
const pdfParse = require('pdf-parse');

exports.createNote = async (req, res) => {
    try {
        const { title, content, subject, tags } = req.body;
        const noteId = new mongoose.Types.ObjectId();

        let textToCheck = title + " ";
        let fileData = null;
        let fileMimetype = null;
        let fileUrl = null;
        let pdfText = "";

        if (req.file) {
            fileMimetype = req.file.mimetype;
            const fileBuffer = fs.readFileSync(req.file.path);
            fileData = fileBuffer.toString('base64');
            
            const protocol = req.get('x-forwarded-proto') || req.protocol;
            fileUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`.replace('http://', 'https://');
            const mimetype = req.file.mimetype;

            if (mimetype === 'application/pdf') {
                try {
                    const dataBuffer = fs.readFileSync(req.file.path);
                    const data = await pdfParse(dataBuffer);
                    pdfText = data.text;
                    textToCheck += data.text;
                } catch (err) {
                    console.error("PDF Parsing error:", err);
                    return res.status(400).json({ error: "Failed to parse PDF" });
                }

                try {
                    const handwrittenText = await ocrService.ocrPdf(req.file.path);
                    if (handwrittenText) {
                        pdfText = (pdfText || "") + " " + handwrittenText;
                    }
                } catch (err) {
                    console.warn("Handwritten OCR failed for PDF:", err.message);
                }
            } else if (mimetype.startsWith('image/')) {
                try {
                    const imageResult = await moderationService.checkImage(req.file.path, {
                        authorId: req.userData.userId,
                        contentId: noteId.toString()
                    });
                    if (!imageResult.safe) {
                        fs.unlinkSync(req.file.path);
                        return res.status(400).json({ error: imageResult.reason || "Image flagged by moderation policy" });
                    }
                    
                    if (imageResult.extractedText) {
                        pdfText = imageResult.extractedText;
                    }

                    const handwrittenText = await ocrService.ocrImage(req.file.path);
                    if (handwrittenText) {
                        pdfText = (pdfText || "") + " [Handwritten: " + handwrittenText + "]";
                    }

                    textToCheck += pdfText;
                } catch (err) {
                    console.error("Image parsing/moderation/OCR error:", err);
                    return res.status(500).json({ error: "Image processing failed" });
                }
            }
        } else if (content) {
            textToCheck += content;
        } else {
            return res.status(400).json({ error: "Either PDF file or text content is required" });
        }

        const moderationResult = await moderationService.checkContent(textToCheck, {
            authorId: req.userData.userId,
            contentId: noteId.toString(),
            metadata: req.file ? { filename: req.file.originalname || req.file.filename } : undefined
        });

        if (!moderationResult.safe) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: moderationResult.reason || "Content rejected by moderation API due to safety policy" });
        }

        const tagArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (Array.isArray(tags) ? tags : []);
        const combinedText = (content || "") + " " + (pdfText || "");
        const words = combinedText.trim().split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(words / 200));
        
        const cleanText = combinedText.replace(/\[Scan detected:.*?\]/g, '').trim();
        
        let summary = "No summary found.";
        if (cleanText.length > 5) {
            try {
                summary = await aiService.askAboutNote(cleanText, "Give me a one-sentence summary of these notes for a student dashboard. If you can't, say 'No summary found.'");
            } catch (err) {
                summary = cleanText.substring(0, 150).trim() + "...";
            }
        } else if (title) {
            summary = `Shared educational notes about ${title}.`;
        }

        const note = new Note({
            _id: noteId,
            title,
            content: combinedText.substring(0, 5000), 
            ocrText: (pdfText && !pdfText.includes('Ghostscript')) ? pdfText : "", 
            fileUrl,
            fileData,
            fileMimetype,
            uploadedBy: req.userData.userId,
            subject,
            tags: tagArray,
            summary,
            readingTime,
            keyTopics: tagArray.slice(0, 5)
        });

        await note.save();

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(201).json({ message: "Note shared on OpenNotes Hub!", noteId: note._id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getNotes = async (req, res) => {
    try {
        const { query, sort, subject, tags } = req.query; 

        let filter = { status: 'active' };

        if (subject) filter.subject = subject;
        if (tags) {
            const tagList = tags.split(',').map(t => t.trim());
            filter.tags = { $in: tagList };
        }

        let sortOption = {};
        if (sort === 'upvotes') {
            sortOption = { upvotes: -1, createdAt: -1 };
        } else {
            sortOption = { createdAt: -1 };
        }

        if (query) {
            filter.title = { $regex: query, $options: 'i' };
        }

        const notes = await Note.find(filter, '-__v -fileData -ocrText')
            .sort(sortOption)
            .limit(40);
        res.json(notes);
    } catch (error) {
        console.error("Get Notes Error:", error);
        res.status(500).json({ error: "Failed to load notes" });
    }
};

exports.getMyNotes = async (req, res) => {
    try {
        const userId = req.userData.userId;
        const notes = await Note.find({ uploadedBy: userId }, '-fileData -ocrText').sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

exports.getNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findById(id);

        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        if (note.status !== 'active') {
            const currentUserId = req.userData ? req.userData.userId : null;
            if (note.uploadedBy !== currentUserId) {
                return res.status(404).json({ error: "Note not found or private" });
            }
        }

        res.json(note);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

exports.upvoteNote = async (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.userData.userId;

        const note = await Note.findById(noteId);
        if (!note || note.status !== 'active') {
            return res.status(404).json({ error: "Note not found" });
        }

        const hasUpvoted = note.upvotedUsers.includes(userId);

        if (hasUpvoted) {
            note.upvotedUsers.pull(userId);
            note.upvotes -= 1;
        } else {
            note.upvotedUsers.push(userId);
            note.upvotes += 1;
        }

        await note.save();
        res.json({ message: "Upvote toggled", upvotes: note.upvotes, hasUpvoted: !hasUpvoted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.reportNote = async (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.userData.userId;
        const { reason } = req.body;

        const note = await Note.findById(noteId);
        if (!note || note.status !== 'active') {
            return res.status(404).json({ error: "Note not found" });
        }

        const hasReported = note.reports.some(r => r.reporterId === userId);
        if (hasReported) {
             return res.status(400).json({ error: "You have already reported this note" });
        }

        note.reports.push({ reporterId: userId, reason: reason || 'Inappropriate content' });
        let message = "Resource reported successfully. Thank you for keeping the hub safe.";

        if (note.reports.length >= 2) {
            const textToCheck = note.title + " " + (note.content || "");
            const moderationResult = await moderationService.checkContent(textToCheck);

            if (!moderationResult.safe) {
                note.status = 'removed';
                note.rejectionReason = moderationResult.reason || "Automatically removed after users reported policy violations.";
                message = "Resource automatically removed due to multiple reports and policy violation.";
            }
        }

        await note.save();
        res.json({ message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const noteId = req.params.id;
        const userId = req.userData.userId;

        const note = await Note.findById(noteId);

        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        if (note.uploadedBy !== userId) {
            return res.status(403).json({ error: "Not authorized to delete this note" });
        }

        if (note.fileUrl) {
            try {
                const filename = note.fileUrl.split('/').pop();
                const filePath = require('path').join(__dirname, '../uploads', filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error("Failed to delete local file:", err);
            }
        }

        await Note.findByIdAndDelete(noteId);
        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

exports.askQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { question } = req.body;

        const note = await Note.findById(id);
        if (!note || note.status !== 'active') {
            return res.status(404).json({ error: "Note not found" });
        }

        const context = `Title: ${note.title}\nSubject: ${note.subject}\nTags: ${note.tags.join(', ')}\nContent: ${note.content}\nHandwritten/OCR Text: ${note.ocrText || ""}`;
        const cleanContext = context.replace(/\[Scan detected:.*?\]/g, '').trim();

        const answer = await aiService.askAboutNote(cleanContext, question);
        res.json({ answer });
    } catch (err) {
        console.error("AI Q&A Error:", err);
        res.status(500).json({ error: "AI processing failed" });
    }
};

exports.getRelatedNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findById(id);
        if (!note) return res.status(404).json({ error: "Note not found" });

        const related = await Note.find({
            _id: { $ne: id },
            status: 'active',
            $or: [
                { subject: note.subject },
                { tags: { $in: note.tags } }
            ]
        }, '-fileData -ocrText').limit(5);

        res.json(related);
    } catch (err) {
        res.status(500).json({ error: "Failed to load related notes" });
    }
};

exports.getNoteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findById(id).select('fileData fileMimetype status uploadedBy');
        
        if (!note) return res.status(404).json({ error: "File not found" });
        if (note.status !== 'active' && note.uploadedBy !== req.userData?.userId) {
            return res.status(403).json({ error: "Unauthorized access to file" });
        }
        if (!note.fileData) return res.status(404).json({ error: "No file data available" });

        res.json({ 
            fileData: note.fileData, 
            fileMimetype: note.fileMimetype 
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch file data" });
    }
};
