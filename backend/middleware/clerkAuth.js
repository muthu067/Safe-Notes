const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];

        const session = await clerkClient.verifyToken(token);

        if (!session) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        req.userData = { userId: session.sub };
        next();
    } catch (error) {
        console.error('Clerk Auth Error:', error.message);
        return res.status(401).json({ error: 'Auth failed' });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const session = await clerkClient.verifyToken(token);
            if (session) {
                req.userData = { userId: session.sub };
            }
        }
    } catch (error) {

    }
    next();
};

module.exports = { requireAuth, optionalAuth };
