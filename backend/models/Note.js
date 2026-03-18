const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        trim: true
    },
    fileUrl: {
        type: String
    },
    fileData: {
        type: String
    },
    fileMimetype: {
        type: String
    },
    uploadedBy: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    upvotes: {
        type: Number,
        default: 0
    },
    upvotedUsers: [String],
    reports: [{
        reporterId: String,
        reason: String,
        createdAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['active', 'removed', 'rejected'],
        default: 'active'
    },
    rejectionReason: {
        type: String
    },
    summary: {
        type: String
    },
    ocrText: {
        type: String
    },
    readingTime: {
        type: Number
    },
    keyTopics: [{
        type: String
    }]
}, { timestamps: true });

noteSchema.index({ status: 1, createdAt: -1 });
noteSchema.index({ uploadedBy: 1, createdAt: -1 });
noteSchema.index({ title: 'text' });
noteSchema.index({ subject: 1 });
noteSchema.index({ tags: 1 });

module.exports = mongoose.model('Note', noteSchema);
