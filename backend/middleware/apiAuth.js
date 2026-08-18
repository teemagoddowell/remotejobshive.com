const apiKeyAuth = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ message: 'Unauthorized: API Key is missing.' });
    }

    try {
        if (apiKey !== process.env.SCRAPER_API_KEY) {
            return res.status(403).json({ message: 'Forbidden: Invalid API Key.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export default apiKeyAuth;
