import dotenv from 'dotenv';
import { db, sendEmail } from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processJobAlerts() {
    console.log("Starting job alert process...");
    try {
        const alertsResult = await db.query(`
            SELECT 
                ja.*, 
                u.full_name, 
                u.email
            FROM job_alerts ja
            JOIN users u ON ja.user_id = u.id
            WHERE ja.is_active = true 
              AND (ja.last_sent_at IS NULL OR ja.last_sent_at < NOW() - INTERVAL '2 hours')
        `);
        const alertsToSend = alertsResult.rows;
        console.log(`Found ${alertsToSend.length} alerts to process.`);

        const templatePath = path.join(__dirname, 'mail-templates', 'job-newsletter.html');
        const mainTemplateHtml = fs.readFileSync(templatePath, 'utf8');

        const jobCardTemplate = `
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <tr>
                    <td style="padding: 20px;">
                        <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                            <a href="[Job URL]" target="_blank" style="color: #2563eb; text-decoration: none;">[Job Title]</a>
                        </h2>
                        <p style="margin: 0 0 12px 0; font-size: 15px; color: #4b5563;">[Company Name] &ndash; [Job Location]</p>
                        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">[Job Excerpt]...</p>
                        <a href="[Job URL]" target="_blank" style="display: inline-block; padding: 10px 20px; border-radius: 6px; text-decoration: none; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 14px;">View Job</a>
                    </td>
                </tr>
            </table>
        `;

        for (const alert of alertsToSend) {
            try {
                let whereClauses = ["j.status = 'active'", `j.date_posted > NOW() - INTERVAL '30 day'`];
                let queryParams = [];
                
                if (alert.job_title_id) {
                    whereClauses.push(`j.job_title_id = ${alert.job_title_id}`);
                }
                if (alert.location_id && alert.location_id !== 1) {
                    whereClauses.push(`j.location_id = ${alert.location_id}`);
                }
                if (alert.job_position) {
                    whereClauses.push(`j.job_position = '${alert.job_position}'`);
                }

                const jobsResult = await db.query(`
                    SELECT j.title, j.slug, j.excerpts AS excerpts, c.name AS company_name, jl.name AS job_location
                    FROM jobs j
                    JOIN companies c ON j.company_id = c.id
                    LEFT JOIN job_locations jl ON j.location_id = jl.id
                    WHERE ${whereClauses.join(' AND ')}
                    ORDER BY j.date_posted DESC
                    LIMIT 5;
                `, queryParams);

                const matchingJobs = jobsResult.rows;

                if (matchingJobs.length > 0) {
                    let allJobsHtml = '';
                    matchingJobs.forEach(job => {
                        let itemHtml = jobCardTemplate;
                        itemHtml = itemHtml.replace(/\[Job URL\]/g, `https://www.remotejobshive.co/job/${job.slug}`);
                        itemHtml = itemHtml.replace('[Job Title]', job.title);
                        itemHtml = itemHtml.replace('[Company Name]', job.company_name);
                        itemHtml = itemHtml.replace('[Job Location]', job.job_location || 'Remote');
                        itemHtml = itemHtml.replace('[Job Excerpt]...', job.excerpts || '');
                        allJobsHtml += itemHtml;
                    });
                    
                    let finalEmailHtml = mainTemplateHtml;
                    finalEmailHtml = finalEmailHtml.replace('[User Name]', alert.full_name);
                    finalEmailHtml = finalEmailHtml.replace('[Job Count]', matchingJobs.length);
                    finalEmailHtml = finalEmailHtml.replace('<!-- JOB-LIST-PLACEHOLDER -->', allJobsHtml);

                    const fromAddress = "alerts";
                    const fromName = "JobsHive Alerts";
                    await sendEmail(alert.email, "Your Daily Job Digest from JobsHive", finalEmailHtml, fromAddress, fromName);
                    
                    await db.query("UPDATE job_alerts SET last_sent_at = NOW() WHERE id = $1", [alert.id]);
                    console.log(`-> Sent ${matchingJobs.length} jobs to ${alert.email}`);
                }
            } catch (userError) {
                console.error(`--> FAILED to process alert for user ${alert.user_id}:`, userError);
            }
        }
    } catch (error) {
        console.error("An error occurred in the job alert process:", error);
    } finally {
        if (db) {
            await db.end();
            console.log("Job alert process finished.");
        }
    }
}

processJobAlerts();
