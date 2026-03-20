const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const { requireAuth, optionalAuth } = require('../middleware/supabaseAuth');

router.post('/', requireAuth, collectionController.createCollection);
router.get('/', collectionController.getCollections);
router.get('/mine', requireAuth, collectionController.getMyCollections);
router.get('/:id', optionalAuth, collectionController.getCollectionById);
router.post('/:id/notes', requireAuth, collectionController.addNoteToCollection);
router.delete('/:id/notes/:noteId', requireAuth, collectionController.removeNoteFromCollection);
router.delete('/:id', requireAuth, collectionController.deleteCollection);

module.exports = router;
