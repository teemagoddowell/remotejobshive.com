import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './index.js';
import dotenv from "dotenv";

dotenv.config();

// --- ⚙️ CONFIGURATION ---
const BASE_URL = process.env.BASE_URL;
const SITEMAP_LIMIT = 50000; 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public/sitemap'); 

// --- HELPER FUNCTIONS (Unchanged) ---

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
    try {
        console.log("Starting sitemap generation...");
        // This master list will hold all generated sitemap files.
        const allSitemapFiles = [
            'sitemap-pages.xml',
            'sitemap-countries.xml'
        ];

        // --- 1. Generate Split Job Sitemaps ---
        const jobsResult = await db.query("SELECT slug FROM jobs WHERE status = 'active' ORDER BY date_posted DESC");
        const jobPaths = jobsResult.rows.map(job => `/job/${job.slug}`);
        console.log(`Found ${jobPaths.length} active job URLs.`);

        for (let i = 0; i < jobPaths.length; i += SITEMAP_LIMIT) {
            const chunk = jobPaths.slice(i, i + SITEMAP_LIMIT);
            const pageNumber = (i / SITEMAP_LIMIT) + 1;
            let sitemapFile = `sitemap-jobs-${pageNumber}.xml`;
            i === 0 && (sitemapFile = `sitemap-jobs.xml`);
            
            const jobsSitemapChunk = createUrlset(chunk);
            fs.writeFileSync(path.join(PUBLIC_DIR, sitemapFile), jobsSitemapChunk);
            
            console.log(`-> Generated ${sitemapFile} with ${chunk.length} URLs.`);
            allSitemapFiles.push(sitemapFile);
        }
        
        // --- Generate Split Company Sitemaps ---
        const companiesResult = await db.query(`
            SELECT DISTINCT c.slug, c.name
            FROM companies c
            JOIN jobs j ON c.id = j.company_id
            ORDER BY c.name
        `);
        const companyPaths = companiesResult.rows.map(company => `/company/${company.slug}`);
        console.log(`\nFound ${companyPaths.length} company URLs.`);

        for (let i = 0; i < companyPaths.length; i += SITEMAP_LIMIT) {
            const chunk = companyPaths.slice(i, i + SITEMAP_LIMIT);
            const pageNumber = (i / SITEMAP_LIMIT) + 1;
            let sitemapFile = `sitemap-companies-${pageNumber}.xml`;
            i === 0 && (sitemapFile = `sitemap-companies.xml`);

            const companiesSitemapChunk = createUrlset(chunk);
            fs.writeFileSync(path.join(PUBLIC_DIR, sitemapFile), companiesSitemapChunk);

            console.log(`-> Generated ${sitemapFile} with ${chunk.length} URLs.`);
            allSitemapFiles.push(sitemapFile);
        }
        
        // --- 3. Generate the Main Sitemap Index ---
        const sitemapIndexContent = createSitemapIndex(allSitemapFiles);
        fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapIndexContent);
        console.log('\n-> Generated main sitemap.xml index file.');
        
        console.log("\n✅ Sitemap generation complete!");

    } catch (error) {
        console.error("Error generating sitemaps:", error);
    } finally {
        await db.end();
    }
}

generateSitemaps();
