const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { requireAuth, optionalAuth } = require('../middleware/clerkAuth');
const upload = require('../middleware/upload');

router.post('/', requireAuth, upload.single('file'), noteController.createNote);
router.get('/', noteController.getNotes);
router.get('/mine', requireAuth, noteController.getMyNotes);
router.get('/:id', optionalAuth, noteController.getNoteById);
router.get('/:id/related', noteController.getRelatedNotes);
router.post('/:id/upvote', requireAuth, noteController.upvoteNote);
router.post('/:id/report', requireAuth, noteController.reportNote);
router.post('/:id/ask', requireAuth, noteController.askQuestion);
router.delete('/:id', requireAuth, noteController.deleteNote);

module.exports = router;
