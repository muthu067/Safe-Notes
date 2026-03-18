const Collection = require('../models/Collection');

exports.createCollection = async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;
        const ownerId = req.userData.userId;

        const collection = new Collection({
            name,
            description,
            ownerId,
            isPublic
        });

        await collection.save();
        res.status(201).json(collection);
    } catch (err) {
        res.status(500).json({ error: "Failed to create collection" });
    }
};

exports.getCollections = async (req, res) => {
    try {
        const { userId } = req.query;
        let filter = { isPublic: true };
        if (userId) filter.ownerId = userId;

        const collections = await Collection.find(filter).populate('notes', '-fileData -ocrText');
        res.json(collections);
    } catch (err) {
        res.status(500).json({ error: "Failed to load collections" });
    }
};

exports.getMyCollections = async (req, res) => {
    try {
        const userId = req.userData.userId;
        const collections = await Collection.find({ ownerId: userId }).populate('notes', '-fileData -ocrText');
        res.json(collections);
    } catch (err) {
        res.status(500).json({ error: "Failed to load your collections" });
    }
};

exports.getCollectionById = async (req, res) => {
    try {
        const { id } = req.params;
        const collection = await Collection.findById(id).populate('notes', '-fileData -ocrText');
        
        if (!collection) {
            return res.status(404).json({ error: "Collection not found" });
        }
        
        if (!collection.isPublic) {
            const currentUserId = req.userData ? req.userData.userId : null;
            if (collection.ownerId !== currentUserId) {
                return res.status(403).json({ error: "Unauthorized or private collection" });
            }
        }
        res.json(collection);
    } catch (err) {
        res.status(500).json({ error: "Failed to load collection" });
    }
};

exports.addNoteToCollection = async (req, res) => {
    try {
        const collectionId = req.params.id;
        const { noteId } = req.body;
        const userId = req.userData.userId;

        const collection = await Collection.findOneAndUpdate(
            { _id: collectionId, ownerId: userId },
            { $addToSet: { notes: noteId } },
            { returnDocument: 'after' }
        );
        
        if (!collection) {
            return res.status(404).json({ error: "Collection not found or unauthorized" });
        }

        res.json(collection);
    } catch (err) {
        res.status(500).json({ error: "Failed to update collection" });
    }
};

exports.removeNoteFromCollection = async (req, res) => {
    try {
        const collectionId = req.params.id;
        const { noteId } = req.params;
        const userId = req.userData.userId;

        const collection = await Collection.findOneAndUpdate(
            { _id: collectionId, ownerId: userId },
            { $pull: { notes: noteId } },
            { returnDocument: 'after' }
        );
        
        if (!collection) {
            return res.status(404).json({ error: "Collection not found or unauthorized" });
        }

        res.json(collection);
    } catch (err) {
        res.status(500).json({ error: "Failed to update collection" });
    }
};

exports.deleteCollection = async (req, res) => {
    try {
        const collectionId = req.params.id;
        const userId = req.userData.userId;

        const collection = await Collection.findOneAndDelete({ _id: collectionId, ownerId: userId });
        
        if (!collection) {
            return res.status(404).json({ error: "Collection not found or unauthorized to delete" });
        }

        res.json({ message: "Collection deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete collection" });
    }
};
