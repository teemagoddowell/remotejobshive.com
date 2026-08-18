import jwt from 'jsonwebtoken';
import { db } from '../index.js';

const authenticateToken = (req, res, next) => {
    let token;
    
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        token = authHeader.split(' ')[1];
    }

    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.sendStatus(403); 
        }

        try {
            await db.query(
                "UPDATE user_subscriptions SET status = 'expired' WHERE user_id = $1 AND status = 'active' AND end_date <= NOW()",
                [user.id]
            );
        } catch (dbError) {
            console.error("Failed to update subscription status:", dbError);
        }

        req.user = user;
        next(); 
    });
};

export const attachUserIfPresent = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1]; 

        if (!token) {
            req.user = null; 
            return next();
        }

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedPayload;
    } catch (error) {
        req.user = null;
    }

    next();
};

export const getIpAddress = (req) => {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
};

export default authenticateToken;