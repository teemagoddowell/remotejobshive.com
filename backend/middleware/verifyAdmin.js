import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decodedPayload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        req.user = decodedPayload;

        if (decodedPayload.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Not an admin." });
        }
    
        next();

    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

export default verifyToken;