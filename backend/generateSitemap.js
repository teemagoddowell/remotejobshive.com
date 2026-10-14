import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

// --- ⚙️ CONFIGURATION ---
const BASE_URL = process.env.BASE_URL || 'https://remotejobshive.com';
const SITEMAP_LIMIT = 50000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target mounted directory inside Docker, fallback to ../frontend/public locally
const FRONTEND_PUBLIC_DIR = fs.existsSync('/usr/src/app/sitemap')
    ? '/usr/src/app/sitemap'
    : (fs.existsSync('/app/sitemap') 
        ? '/app/sitemap' 
        : path.resolve(__dirname, '../frontend/public'));

const SITEMAP_SUBDIR = path.join(FRONTEND_PUBLIC_DIR, 'sitemap');

// Ensure parent public and /sitemap/ subdirectory exist before writing
fs.mkdirSync(FRONTEND_PUBLIC_DIR, { recursive: true });
fs.mkdirSync(SITEMAP_SUBDIR, { recursive: true });

// --- HELPER FUNCTIONS ---
const createUrlset = (paths) => {
    const urls = paths.map(url => `
  <url>
    <loc>${BASE_URL}${url}</loc>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
};

const createSitemapIndex = (sitemapFiles) => {
    const sitemaps = sitemapFiles.map(file => `
  <sitemap>
    <loc>${BASE_URL}/${file}</loc>
  </sitemap>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}
</sitemapindex>`;
};

// --- 🚀 MAIN SCRIPT ---
async function generateSitemaps() {
    // Isolated client so we don't terminate Express's active connection pool
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        user: process.env.DB_USER,
        host: process.env.DB_HOST || 'db',
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        await client.connect();
        console.log(`Starting sitemap generation... Output destination: ${FRONTEND_PUBLIC_DIR}`);

        // Base static sitemaps residing directly in frontend/public/
        const allSitemapFiles = [
            'sitemap-pages.xml',
            'sitemap-countries.xml'
        ];

        // --- 1. Generate Split Job Sitemaps ---
        const jobsResult = await client.query("SELECT slug FROM jobs WHERE status = 'active' ORDER BY date_posted DESC");
        const jobPaths = jobsResult.rows.map(job => `/job/${job.slug}`);
        console.log(`Found ${jobPaths.length} active job URLs.`);

        for (let i = 0; i < jobPaths.length; i += SITEMAP_LIMIT) {
            const chunk = jobPaths.slice(i, i + SITEMAP_LIMIT);
            const pageNumber = Math.floor(i / SITEMAP_LIMIT) + 1;
            let sitemapFile = `sitemap-jobs-${pageNumber}.xml`;
            if (i === 0) sitemapFile = `sitemap-jobs.xml`;

            const jobsSitemapChunk = createUrlset(chunk);
            fs.writeFileSync(path.join(SITEMAP_SUBDIR, sitemapFile), jobsSitemapChunk);

            console.log(`-> Generated sitemap/${sitemapFile} with ${chunk.length} URLs.`);
            allSitemapFiles.push(`sitemap/${sitemapFile}`);
        }

        // --- 2. Generate Split Company Sitemaps ---
        const companiesResult = await client.query(`
            SELECT DISTINCT c.slug, c.name
            FROM companies c
            JOIN jobs j ON c.id = j.company_id
            ORDER BY c.name
        `);
        const companyPaths = companiesResult.rows.map(company => `/company/${company.slug}`);
        console.log(`\nFound ${companyPaths.length} company URLs.`);

        for (let i = 0; i < companyPaths.length; i += SITEMAP_LIMIT) {
            const chunk = companyPaths.slice(i, i + SITEMAP_LIMIT);
            const pageNumber = Math.floor(i / SITEMAP_LIMIT) + 1;
            let sitemapFile = `sitemap-companies-${pageNumber}.xml`;
            if (i === 0) sitemapFile = `sitemap-companies.xml`;

            const companiesSitemapChunk = createUrlset(chunk);
            fs.writeFileSync(path.join(SITEMAP_SUBDIR, sitemapFile), companiesSitemapChunk);

            console.log(`-> Generated sitemap/${sitemapFile} with ${chunk.length} URLs.`);
            allSitemapFiles.push(`sitemap/${sitemapFile}`);
        }

        // --- 3. Generate Master Index (frontend/public/sitemap.xml) ---
        const sitemapIndexContent = createSitemapIndex(allSitemapFiles);
        fs.writeFileSync(path.join(FRONTEND_PUBLIC_DIR, 'sitemap_index.xml'), sitemapIndexContent);
        console.log('\n-> Generated main sitemap_index.xml index file at root.');

        console.log("\n✅ Sitemap generation complete!");

    } catch (error) {
        console.error("Error generating sitemaps:", error);
    } finally {
        await client.end();
    }
}

generateSitemaps();
