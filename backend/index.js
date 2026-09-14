import express from "express";
import bodyParser from "body-parser";
import pg from 'pg';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import cors from 'cors';
import authenticateToken, { getIpAddress, attachUserIfPresent } from "./middleware/auth.js";
import verifyToken from "./middleware/verifyAdmin.js";
import slugify from "slugify";
import multer from 'multer';
import fs from 'fs';
import fsp from "fs/promises";
import axios from "axios";
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import apiKeyAuth from "./middleware/apiAuth.js";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import crypto from 'crypto';
import { Storage } from '@google-cloud/storage';

dotenv.config();
const app = express();
const port = 8000;
const URI = process.env.BASE_URL;
const CDN_UPLOAD_DIR = "/app/cdn/uploads";
const CDN_BASE_URL = process.env.CDN_BASE_URL;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const sesV2Client = new SESv2Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export const sendEmail = async (to, subject, html, fromAddress, fromName, addUnsubscribe = true) => {
    const fullFromAddress = `"${fromName}" <${fromAddress}@remotejobshive.com>`;

    const params = {
        FromEmailAddress: fullFromAddress,
        Destination: {
            ToAddresses: [to],
        },
        Content: {
            Simple: {
                Subject: { Data: subject },
                Body: {
                    Html: { Data: html }
                }
            }
        }
    };

    if (addUnsubscribe) {
        params.ListManagementOptions = {
            ContactListName: 'remotejobshive-users', 
            TopicName: 'JobAlerts' 
        };
    }

    const command = new SendEmailCommand(params);

    try {
        const response = await sesV2Client.send(command);
        console.log(`Email sent successfully to ${to}. Message ID: ${response.MessageId}`);
        return response;
    } catch (error) {
        console.error(`Failed to send email to ${to}:`);
        throw error;
    }
};

const allowedOrigins = [
  'https://remotejobshive.com',
  'https://www.remotejobshive.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};

// app.use(cors(corsOptions));
app.use(cors());
app.use(express.static('public')); 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

async function saveToCDN(relativePath, buffer) {
  const fullPath = path.join(CDN_UPLOAD_DIR, relativePath);

  await fsp.mkdir(path.dirname(fullPath), {
    recursive: true,
  });

  await fsp.writeFile(fullPath, buffer);

  return `${CDN_BASE_URL}/${relativePath}`;
}

const getSubscriptionStatus = async (userId) => {
    const subscriptionResult = await db.query(`
        SELECT EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_id = $1 AND (status = 'active' OR status = 'cancelled') AND end_date > NOW()
        )
    `, [userId]);
    return subscriptionResult.rows[0].exists;
};

export const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.db_port, 10),
});

async function connectToDatabase() {
    try {
        await db.connect();
        console.log("Connected to PostgreSQL Database");
    } catch (err) {
        console.error("Connection Error: ", err.stack);
        process.exit(1); 
    }
}
connectToDatabase();

// Homepage 
app.get("/", (req, res)=>{
    res.status(200).json({
        status: "online",
        api_name: "JobsHive API",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// Login 
app.post("/login", async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isSubscribed = await getSubscriptionStatus(user.id);
        
        const payload = { id: user.id, role: user.role, isSubscribed: isSubscribed, fullName: user.full_name };
        const expiresIn = rememberMe ? '30d' : '7d';

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: expiresIn }
        );
        
        res.status(200).json({ 
            message: "Login successful!", 
            token: token,
            user: { id: user.id, fullName: user.full_name, isSubscribed: isSubscribed, role: user.role, title: user.title, avatar:user.avatar_url, email: user.email }
        });

    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Google Login
app.post("/auth/google", async (req, res) => {
    try {
        await db.query('BEGIN');
        const { email, fullName, avatarUrl, loginType } = req.body;
        let userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        let user;
        let isSubscribed = false;

        if (userResult.rows.length > 0) {
            user = userResult.rows[0];
        } else {
            const newUserResult = await db.query(
                "INSERT INTO users (full_name, email, password, avatar_url, role, auth_provider) VALUES ($1, $2, 'NULL', $3, 'user', 'google') RETURNING *",
                [fullName, email, avatarUrl]
            );
            user = newUserResult.rows[0];

            try {
                const templatePath = path.join(__dirname, 'mail-templates', 'welcome.html');
                let emailHtml = fs.readFileSync(templatePath, 'utf8');
                emailHtml = emailHtml
                .replace('[User Name]', user.full_name)
                .replace('[dashboard-link]', `${URI}/dashboard/user`);
                
                const fromAddress = "welcome";
                const fromName = "Remote JobsHive Team";
                await sendEmail(
                    user.email, 
                    "Welcome to Remote JobsHive!", 
                    emailHtml,
                    fromAddress,
                    fromName
                );
            } catch (error) {
                console.error("Error sending welcome email:", error);
            }
        }

        isSubscribed = await getSubscriptionStatus(user.id);
        const payload = { id: user.id, role: user.role, isSubscribed: isSubscribed, fullName: user.full_name };
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '10d' }
        );

        await db.query('COMMIT');
        res.status(200).json({ 
            message: "Google authentication successful!", 
            token: token,
            user: { id: user.id, isSubscribed: isSubscribed, fullName: user.full_name, role: user.role, avatar: user.avatar_url, email: user.email, title: user.title }
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error during Google authentication:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Register 
app.post("/register", async (req, res) =>{
    try {
        await db.query('BEGIN');
        const {role, fullname, email, password, title} = req.body;

        if (!role || !fullname || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const existingUser = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const registerUser = await db.query("INSERT INTO users (role, full_name, email, password, title) VALUES($1, $2, $3, $4, $5) RETURNING *", [role, fullname, email, hashedPassword, title]);
        const newUser = registerUser.rows[0];

        try {
            const templatePath = path.join(__dirname, 'mail-templates', 'welcome.html');
            let emailHtml = fs.readFileSync(templatePath, 'utf8');

        emailHtml = emailHtml.replace('[User Name]', newUser.full_name);

        if (role === "recruiter"){
            emailHtml = emailHtml.replace('[dashboard-link]', `${URI}/dashboard/recruiter`);
        } else {
            emailHtml = emailHtml.replace('[dashboard-link]', `${URI}/dashboard/user`);
        }

        const fromAddress = "welcome";
        const fromName = "Remote JobsHive Team";
        await sendEmail(
            newUser.email, 
            "Welcome to Remote JobsHive!", 
            emailHtml,
            fromAddress,
            fromName
            );
        } catch (error) {
            console.error("Error sending welcome email:", error);
        }

        const isSubscribed = await getSubscriptionStatus(newUser.id);
        const payload = { id: newUser.id, role: newUser.role, isSubscribed: isSubscribed, fullName: newUser.full_name };

        const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '10d' }
        );
    
        await db.query('COMMIT');
        res.status(201).json({ 
            message: "Registration successful!", 
            token: token,
            user: { id: newUser.id, isSubscribed: isSubscribed, fullName: newUser.full_name, role: newUser.role, title: newUser.title, email: newUser.email, avatar: newUser.avatar_url }
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }

});

// All jobs 
app.get("/jobs", async (req, res)=> {
    try{
        const queryJobs = await db.query(`
            SELECT 
                jobs.id, jobs.title, jobs.slug, LEFT(jobs.description, 150) || '...' AS description, jobs.excerpts, jobs.job_type, 
                jobs.job_position, jobs.job_experience, jobs.department,
                jobs.salary_min, jobs.salary_max, jobs.location_id, jobs.salary, jobs.currency, jobs.date_posted,
                c.name AS company_name, 
                c.logo_url AS company_logo,
                c.slug AS company_slug,
                c.website_url AS company_url,
                c.linkedin_url AS company_linkedin,
                jl.name AS job_location,
                STRING_AGG(s.name, ', ') AS skills,
                COUNT(*) OVER() AS total_count
            FROM jobs 
            JOIN companies c ON jobs.company_id = c.id
            LEFT JOIN job_locations jl ON jobs.location_id = jl.id
            LEFT JOIN job_skills js ON jobs.id = js.job_id
            LEFT JOIN skills s ON js.skill_id = s.id
            WHERE jobs.status = 'active'
            GROUP BY jobs.id, c.id, jl.id
            ORDER BY jobs.date_posted DESC
            LIMIT 16;
        `);


        const totalCount = queryJobs.rows[0]?.total_count || 0;

        res.status(200).json({
            message: 'You are limited to 16 jobs. subscribe to load more',
            jobs: queryJobs.rows,
            totalCount: parseInt(totalCount), 
        });

    } catch (error){
        console.error("Unable to Retrieve Job Listings");
        res.status(500).json({ message: "Unable to Retrieve Job Listings. Please Refresh Page" });
    }

});

// Premium jobs
app.get("/jobs/premium", authenticateToken, async (req, res) => {
    try {
        let message = "";
        const limit = parseInt(req.query.limit) > 15 ? (message="Pls don't abuse our data", 15) : parseInt(req.query.limit) || 15;

        const offset = parseInt(req.query.offset) || 0;
        const queryJobs = await db.query(`
            SELECT 
                jobs.id, jobs.title, jobs.slug, LEFT(jobs.description, 150) || '...' AS description, jobs.excerpts, jobs.job_type, 
                jobs.job_position, jobs.job_experience, jobs.department,
                jobs.salary_min, jobs.salary_max, jobs.location_id, jobs.salary, jobs.currency, jobs.date_posted,
                c.name AS company_name, 
                c.logo_url AS company_logo,
                c.slug AS company_slug,
                c.website_url AS company_url,
                c.linkedin_url AS company_linkedin,
                jl.name AS job_location,
                STRING_AGG(s.name, ', ') AS skills,
                COUNT(*) OVER() AS total_count
            FROM jobs 
            JOIN companies c ON jobs.company_id = c.id
            LEFT JOIN job_locations jl ON jobs.location_id = jl.id
            LEFT JOIN job_skills js ON jobs.id = js.job_id
            LEFT JOIN skills s ON js.skill_id = s.id
            WHERE jobs.status = 'active'
            GROUP BY jobs.id, c.id, jl.id
            ORDER BY jobs.date_posted DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]); 

        const totalCount = queryJobs.rows[0]?.total_count || 0;

        res.status(200).json({
            message,
            jobs: queryJobs.rows,
            totalCount: parseInt(totalCount),
        });

    } catch (error) {
        console.error("Unable to Retrieve Job Listings:", error);
        res.status(500).json({ message: "Unable to Retrieve Job Listings. Please Refresh Page" });
    }
});


// Search jobs
app.post("/jobs/search", async (req, res) => {
    const {
        searchTerm,
        filters = {}, 
        limit = 15,
        offset = 0
    } = req.body;

    try {
        await db.query('BEGIN');
        let queryValues = [];
        let whereClauses = ["jobs.status = 'active'"];
        let paramIndex = 1;

        if (searchTerm) {
            const searchPattern = `%${searchTerm}%`;
            whereClauses.push(`
                (jobs.title ILIKE $${paramIndex}
                OR jobs.description ILIKE $${paramIndex}
                OR companies.name ILIKE $${paramIndex}
                OR skills.name ILIKE $${paramIndex})
            `);
            queryValues.push(searchPattern);
            paramIndex++;
        }

        if (filters.experience) {
            whereClauses.push(`jobs.job_position = $${paramIndex++}`);
            queryValues.push(filters.experience);
        }
        if (filters.jobType) {
            whereClauses.push(`jobs.job_type = $${paramIndex++}`);
            queryValues.push(filters.jobType);
        }
        if (filters.titleId) {
            whereClauses.push(`jobs.job_title_id = $${paramIndex++}`);
            queryValues.push(parseInt(filters.titleId));
        }
        if (filters.locationId) {
            whereClauses.push(`jobs.location_id = $${paramIndex++}`);
            queryValues.push(parseInt(filters.locationId));
        }
        if (filters.visaSponsorship && filters.visaSponsorship !== 'any') {
             whereClauses.push(`jobs.visa_sponsorship = $${paramIndex++}`);
             queryValues.push(filters.visaSponsorship === 'true');
        }
        if (filters.salaryMin) {
            whereClauses.push(`jobs.salary_max >= $${paramIndex++}`);
            queryValues.push(parseInt(filters.salaryMin));
        }
        if (filters.skillId) {
            whereClauses.push(`job_skills.skill_id = $${paramIndex++}`);
            queryValues.push(parseInt(filters.skillId));
        }
        if (filters.degreeRequired && filters.degreeRequired !== 'any') {
            whereClauses.push(`jobs.degree_required = $${paramIndex++}`);
            queryValues.push(filters.degreeRequired === 'true');
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const queryString = `
            SELECT 
                jobs.id, jobs.title, jobs.slug, LEFT(jobs.description, 150) || '...' AS description, jobs.excerpts, jobs.job_type, 
                jobs.job_position, jobs.job_experience, jobs.department,
                jobs.salary_min, jobs.salary_max, jobs.salary, jobs.currency, jobs.date_posted,
                companies.name AS company_name, 
                companies.logo_url AS company_logo, 
                companies.website_url AS company_url, 
                companies.linkedin_url AS company_linkedin, 
                companies.slug AS company_slug,
                job_locations.name AS job_location,
                STRING_AGG(DISTINCT skills.name, ', ') AS skills,
                COUNT(*) OVER() AS total_count
            FROM 
                jobs 
            JOIN 
                companies ON jobs.company_id = companies.id
            LEFT JOIN 
                job_locations ON jobs.location_id = job_locations.id
            LEFT JOIN 
                job_skills ON jobs.id = job_skills.job_id
            LEFT JOIN 
                skills ON job_skills.skill_id = skills.id
            ${whereString}
            GROUP BY
                jobs.id, companies.id, job_locations.id
            ORDER BY 
                jobs.date_posted DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const finalQueryValues = [...queryValues, limit, offset];
        const queryJobs = await db.query(queryString, finalQueryValues);

        const totalCount = queryJobs.rows[0]?.total_count || 0;

        await db.query('COMMIT');
        res.status(200).json({
            jobs: queryJobs.rows,
            totalCount: parseInt(totalCount),
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Unable to perform search/filter: " + error.message);
        res.status(500).json({ message: "Unable to perform search/filter. Please Refresh Page" });
    }
});

// Single Job 
app.get("/jobs/:slug", async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await db.query(`SELECT jobs.*, 
                companies.name AS company_name, 
                companies.logo_url AS company_logo,
                companies.slug AS company_slug,
                companies.about AS company_about,
                job_locations.name AS job_location,
                STRING_AGG(skills.name, ', ') AS skills
            FROM 
                jobs 
            JOIN 
                companies ON jobs.company_id = companies.id 
            LEFT JOIN 
                job_locations ON jobs.location_id = job_locations.id
            LEFT JOIN 
                job_skills ON jobs.id = job_skills.job_id
            LEFT JOIN 
                skills ON job_skills.skill_id = skills.id
            WHERE 
                jobs.slug = $1 AND jobs.status = 'active'
            GROUP BY 
                jobs.id, companies.id, job_locations.id
                `, [slug]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Job not found." });
        }
        const job = result.rows[0];
        res.status(200).json(job);
    } catch (error) {
        console.error("Error fetching single job:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Single Job 
app.get("/jobs/edit/:jobID", async (req, res) => {
    try {
        const { jobID } = req.params;
        const result = await db.query(`SELECT jobs.*, 
                companies.name AS company_name, 
                companies.logo_url AS company_logo,
                companies.slug AS company_slug,
                companies.about AS company_about,
                job_locations.name AS job_location,
                STRING_AGG(skills.name, ', ') AS skills
            FROM 
                jobs 
            JOIN 
                companies ON jobs.company_id = companies.id 
            LEFT JOIN 
                job_locations ON jobs.location_id = job_locations.id
            LEFT JOIN 
                job_skills ON jobs.id = job_skills.job_id
            LEFT JOIN 
                skills ON job_skills.skill_id = skills.id
            WHERE 
                jobs.id = $1 AND jobs.status = 'active'
            GROUP BY 
                jobs.id, companies.id, job_locations.id
                `, [jobID]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Job not found." });
        }
        const job = result.rows[0];
        res.status(200).json(job);
    } catch (error) {
        console.error("Error fetching single job:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// All Companies
app.get("/companies", async (req, res) => {
    try {
        const query = "SELECT id, name FROM companies ORDER BY name ASC";
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching companies list:", error);
        res.status(500).json({ message: "Unable to retrieve companies list." });
    }
});

// Add New Company 
app.post("/companies", authenticateToken, multerUpload.single("logo"), async (req, res) => {
    try {
        const {name, about,website_url,linkedin_url} = req.body;
        const companySlug = slugify(name, {lower: true, strict: true});
        let logoUrl = null;

        if (req.file) {
            const fileExtension = path
                .extname(req.file.originalname)
                .toLowerCase();

            const fileName = `logos/${companySlug}-${Date.now()}${fileExtension}`;
            logoUrl = await saveToCDN(fileName, req.file.buffer);
        }

        const newCompanyResult = await db.query(
            `INSERT INTO companies (name, about, logo_url, website_url, linkedin_url, slug) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, about, logoUrl, website_url, linkedin_url, companySlug]
        );
        res.status(201).json(newCompanyResult.rows[0]);

    } catch (error) {
        console.error("Error creating company:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

// Add New Jobs 
app.post("/add-jobs", authenticateToken, async (req, res) => {
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Only recruiters can post jobs." });
    }

    try {
        await db.query('BEGIN');
        const { company, job } = req.body;
        const recruiterId = req.user.id;
        let companyId;
        let companySlug;
        
        if (company.id) {
            companyId = company.id;
            const companyResult = await db.query('SELECT slug FROM companies WHERE id = $1', [companyId]);
            if (companyResult.rows.length === 0) {
                throw new Error("Selected company not found.");
            }
            companySlug = companyResult.rows[0].slug;
        } else {
            companySlug = slugify(company.newCompanyName);
            const newCompanyResult = await db.query(
                `INSERT INTO companies (name, about, website_url, linkedin_url, slug)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [company.newCompanyName, company.aboutCompany, company.website, company.linkedin, companySlug]
            );
            companyId = newCompanyResult.rows[0].id;
        }
        
        
        const jobSlug = `${slugify(job.title)}-${companySlug}`.toLocaleLowerCase();
        const newJobQuery = `
            INSERT INTO jobs (
                title, description, requirements, benefits, location_id, job_type, 
                job_position, job_experience, visa_sponsorship, degree_required, 
                slug, recruiter_id, company_id, job_title_id, department, salary_min, salary_max, currency
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *;
        `;

        const jobValues = [
            job.title, job.jobDescription, job.jobRequirements, job.jobBenefits, job.locationId,
            job.jobType, job.jobPosition, job.jobExperience, job.visaSponsorship,
            job.degreeRequired, jobSlug, recruiterId, companyId, job.jobTitleId, job.department, job.salary_min, job.salary_max, job.currency
        ];

        const newJobResult = await db.query(newJobQuery, jobValues); 
        const newJob = newJobResult.rows[0];

        if (job.skills && job.skills.length > 0) {
            const skillInsertQuery = 'INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2)';
            for (const skillId of job.skills) {
                await db.query(skillInsertQuery, [newJob.id, skillId]);
            }
        }

        await db.query('COMMIT');
        res.status(201).json({ message: "Job posted successfully!", job: newJobResult.rows[0] });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error during job posting:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all standardized job titles
app.get("/job-titles", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM job_titles ORDER BY name ASC");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching job titles:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all standardized job Locations
app.get("/job-locations", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM job_locations ORDER BY name ASC");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching job locations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all standardized skills
app.get("/skills", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM skills ORDER BY name ASC");
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET current user's saved jobs
app.get("/saved-jobs", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const queryText = `
            SELECT 
                jobs.*,
                jl.name AS job_location,
                companies.name AS company_name,
                companies.logo_url AS company_logo
            FROM saved_jobs
            JOIN jobs ON saved_jobs.job_id = jobs.id
            JOIN companies ON jobs.company_id = companies.id
            LEFT JOIN job_locations jl ON jobs.location_id = jl.id
            WHERE saved_jobs.user_id = $1
            ORDER BY saved_jobs.saved_date DESC
        `;
        const result = await db.query(queryText, [userId]);
        res.json(result.rows);
        

    } catch (error) {
        console.error("Error fetching saved jobs:", error);
        res.status(500).json({ message: "Internal server error"});
    }
});

// POST to save a new job
app.post("/saved-jobs", authenticateToken, async (req, res) => {
    try {
        const { jobId } = req.body;
        await db.query("INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2)", [req.user.id, jobId]);
        res.status(201).json({ message: "Job saved successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error saving job." });
    }
});

// DELETE to unsave a job
app.delete("/saved-jobs/:jobId", authenticateToken, async (req, res) => {
    try {
        const { jobId } = req.params;
        await db.query("DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2", [req.user.id, jobId]);
        res.status(200).json({ message: "Job unsaved successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error unsaving job." });
    }
});

// Job Applications
app.post("/applications", authenticateToken, async (req, res) => {
    try {
        const { jobId, status } = req.body;
        const userId = req.user.id;
        const existingApplication = await db.query(
            "SELECT * FROM applications WHERE user_id = $1 AND job_id = $2",
            [userId, jobId]
        );

        if (existingApplication.rows.length > 0) {
            if (status === 'Applied') {
                return res.status(409).json({ message: "You have already applied for this job." });
            } else {
                return res.status(200).end();
            }
        }

        const result = await db.query(
            "INSERT INTO applications (user_id, job_id, status) VALUES ($1, $2, $3) RETURNING *",
            [userId, jobId, status]
        );

    if (status === 'Applied') {
            return res.status(201).json({ message: "Your application has been submitted." });
        } else {
            return res.status(201).end();
        }
        

    } catch (error) {
        console.error("Error adding application:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET all of the current users tracked applications 
app.get("/applications", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(`
            SELECT 
                a.id AS application_id,
                a.status AS application_status, 
                a.application_date,
                j.title,
                j.slug,
                jl.name AS job_location,
                j.job_type,
                c.name AS company_name,
                c.logo_url AS company_logo
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN companies c ON j.company_id = c.id
            LEFT JOIN job_locations jl ON j.location_id = jl.id
            WHERE a.user_id = $1
            ORDER BY a.application_date DESC
        `, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get a single company's details and all its active jobs
app.get("/companies/:slug", async (req, res) => {
    try {
        const { slug } = req.params;
        const offset = parseInt(req.query.offset, 10) || 0;
        const limit = 15;

        const companyResult = await db.query("SELECT * FROM companies WHERE slug = $1", [slug]);

        if (companyResult.rows.length === 0) {
            return res.status(404).json({ message: "Company not found." });
        }

        const company = companyResult.rows[0];

        const jobsResult = await db.query(`
            SELECT 
                j.*,
                LEFT(j.description, 160) || '...' AS description, 
                c.name AS company_name, 
                c.logo_url AS company_logo,
                l.name AS job_location,
                STRING_AGG(s.name, ', ') AS skills
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            LEFT JOIN job_locations l ON j.location_id = l.id
            LEFT JOIN job_skills js ON j.id = js.job_id
            LEFT JOIN skills s ON js.skill_id = s.id
            WHERE j.company_id = $1 AND j.status = 'active'
            GROUP BY j.id, c.id, l.id
            ORDER BY j.date_posted DESC
            LIMIT $2 OFFSET $3
        `, [company.id, limit, offset]);

        const countResult = await db.query(
            "SELECT COUNT(*) FROM jobs WHERE company_id = $1 AND status = 'active'",
            [company.id]
        );
        const totalJobs = parseInt(countResult.rows[0].count, 10);
        
        const responseData = {
            ...company,
            jobs: jobsResult.rows,
            totalJobs: totalJobs
        };

        res.json(responseData);

    } catch (error) {
        console.error("Error fetching company profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// User Stats
app.get("/dashboard/user/stats", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const subscriptionResult = await db.query(`
            SELECT end_date 
            FROM user_subscriptions 
            WHERE user_id = $1 AND (status = 'active' OR status = 'cancelled') AND end_date > NOW()
            ORDER BY end_date DESC 
            LIMIT 1
        `, [userId]);

        const activeSubscription = subscriptionResult.rows[0];
        const isSubscribed = !!activeSubscription;
        const expiryDate = activeSubscription ? activeSubscription.end_date : null;

        const applicationsResult = await db.query("SELECT COUNT(*) FROM applications WHERE user_id = $1", [userId]);
        const applicationsCount = parseInt(applicationsResult.rows[0].count, 10);

        const savedJobsResult = await db.query("SELECT COUNT(*) FROM saved_jobs WHERE user_id = $1", [userId]);
        const savedJobsCount = parseInt(savedJobsResult.rows[0].count, 10);

        const recentApplicationsResult = await db.query(`
            SELECT a.status AS application_status, j.title, c.name AS company_name
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN companies c ON j.company_id = c.id
            WHERE a.user_id = $1
            ORDER BY a.application_date DESC
            LIMIT 3
        `, [userId]);

        const userDetailsResult = await db.query("SELECT resume_filename FROM users WHERE id = $1", [userId]);

        res.json({
            jobsApplied: applicationsCount,
            savedJobs: savedJobsCount,
            recentApplications: recentApplicationsResult.rows,
            resumeFilename: userDetailsResult.rows[0]?.resume_filename || null,
            isSubscribed: isSubscribed,
            expiryDate: expiryDate 
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET the current logged-in user
app.get("/users/me", authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, full_name, email, avatar_url, title FROM users WHERE id = $1",
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update Users Proffile Information 
app.patch("/users/me/profile", authenticateToken, async (req, res) => {
    try {
        const { fullName, title } = req.body;
        const result = await db.query(
            "UPDATE users SET full_name = $1, title = $2 WHERE id = $3 RETURNING id, full_name, email, avatar_url, title",
            [fullName, title, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Change Password 
app.post("/users/me/change-password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const userResult = await db.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
        const user = userResult.rows[0];
        if (!user.password_hash) {
            return res.status(400).json({ message: "Cannot change password for accounts signed in with Google." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);
        await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNewPassword, req.user.id]);

        res.status(200).json({ message: "Password updated successfully." });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update Users Avatar
app.patch("/users/me/avatar", authenticateToken, multerUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No avatar file uploaded.' });
        }

        const userId = req.user.id;

        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        const fileName = `avatars/${userId}-${Date.now()}${fileExtension}`;

        const publicUrl = await saveToCDN(
            fileName,
            req.file.buffer
        );

        const result = await db.query(
            "UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING avatar_url",
            [publicUrl, userId]
        );
        
        res.status(200).json({
            message: "Avatar updated successfully!",
            avatar_url: result.rows[0].avatar_url,
        });

    } catch (error) {
        console.error("Avatar upload error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Upload Resume
app.patch("/users/me/resume", authenticateToken, multerUpload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const user = req.user;
        const fullNameSlug = slugify(user.fullName);

        const fileExtension = path
            .extname(req.file.originalname)
            .toLowerCase();

        const fileName = `resumes/${fullNameSlug}-resume-${user.id}-${Date.now()}${fileExtension}`;

        const publicUrl = await saveToCDN(
            fileName,
            req.file.buffer
        );

        await db.query(
            "UPDATE users SET resume_url = $1, resume_filename = $2 WHERE id = $3",
            [
                publicUrl,
                req.file.originalname,
                user.id
            ]
        );

        res.status(200).json({
            message: "Resume uploaded successfully!"
        });

    } catch (error) {
        console.error("Error uploading resume:", error);

        res.status(500).json({
            message: "Unable to Upload Resume. Try again."
        });
    }
});

// Active subscription details
app.get("/subscriptions/me", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query(`
            SELECT 
                us.start_date,
                us.end_date,
                us.status,
                sp.name AS plan_name,
                sp.price AS plan_price,
                sp.fw_plan_id AS fw_plan_id,
                sp.period AS period
            FROM 
                user_subscriptions us
            JOIN 
                subscription_plans sp ON us.fw_plan_id = sp.fw_plan_id
            WHERE 
                us.user_id = $1 AND (status = 'active' OR status = 'cancelled') AND us.end_date > NOW()
            ORDER BY 
                us.end_date DESC 
            LIMIT 1;
        `, [userId]);

        if (result.rows.length === 0) {
            return res.json(null); 
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching subscription details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Cancel Subscription 
app.post("/subscriptions/cancel", authenticateToken, async (req, res)=> {
    try {
        const userId = req.user.id;

        const subResult = await db.query(`
            SELECT id, fw_sub_id, end_date FROM user_subscriptions 
            WHERE user_id = $1 AND status = 'active'
        `, [userId]);

        if (subResult.rows.length === 0) {
            return res.status(404).json({ message: "No active subscription found to cancel." });
        }

        const flutterwaveSubId = subResult.rows[0].fw_sub_id;
	    const endDate = subResult.rows[0].end_date;

        await axios.put(
            `https://api.flutterwave.com/v3/subscriptions/${flutterwaveSubId}/cancel`,
            {},
            { headers: { 'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
        );

        const response = await db.query(
            "UPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'", 
            [userId]
        );

        const userResult = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
        const user = userResult.rows[0];

        const newPayload = { 
            id: user.id, 
            role: user.role,
            fullName: user.full_name,
            isSubscribed: true,
        };
        const newToken = jwt.sign(newPayload, process.env.JWT_SECRET, { expiresIn: '10d' });

        try {
            const templatePath = path.join(__dirname, 'mail-templates', 'cancel-subscription.html');
            let emailHtml = fs.readFileSync(templatePath, 'utf8');

            emailHtml = emailHtml
			.replace('[User Name]', user.full_name)
            .replace('[End Date]', endDate);

            const fromAddress = "noreply";
            const fromName = "Remote JobsHive Team";
            await sendEmail(
                user.email, 
                "Your Subscription Has Been Cancelled", 
                emailHtml,
                fromAddress,
                fromName,
                false
            );
        } catch (error) {
            console.error("Error sending welcome email:", error);
        }

        return res.status(200).json({ 
            message: "Subscription Cancelled.",
            token: newToken, 
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                isSubscribed: true,
            }
        });

    } catch (error) {
        console.error("Cannot cancel subscription: ", error);
        res.status(500).json({ message: "Cannot cancel subscription" });
    }
});

// Payment Verification
app.post("/payments/verify", authenticateToken, async (req, res) => {
    try {
        const { transaction_id, fw_plan_id } = req.body;
        const userId = req.user.id;

        const response = await axios.get(
            `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
            { headers: { 'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
        );
        const data = response.data.data;
        
        const planResult = await db.query("SELECT * FROM subscription_plans WHERE fw_plan_id = $1", [fw_plan_id]);
        if (planResult.rows.length === 0) {
            throw new Error(`Plan with ID ${fw_plan_id} not found.`);
        }
        const planDetails = planResult.rows[0];

        if (
            data.status === "successful" &&
            Number(data.amount) === Number(planDetails.price)
        ) {
            let subscriptionId;
            const SubResponse = await axios.get(
            `https://api.flutterwave.com/v3/subscriptions?transaction_id=${data.id}&status=active`,
            { headers: { 'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
        );
            let flutterwaveSubId;
            const subData = SubResponse.data.data[0];
            if (subData){
                flutterwaveSubId = subData.id? subData.id : 5;
            } else {
                flutterwaveSubId = 5;
            }

            const existingSubResult = await db.query(`
                SELECT id, end_date FROM user_subscriptions 
                WHERE user_id = $1 AND status = 'active' AND end_date > NOW()
                ORDER BY end_date DESC LIMIT 1
            `, [userId]);

            if (existingSubResult.rows.length > 0) {
                const currentSub = existingSubResult.rows[0];
                const newEndDate = new Date();
                newEndDate.setDate(newEndDate.getDate() + planDetails.duration_days);

                await db.query("UPDATE user_subscriptions SET end_date = $1, fw_plan_id = $2, fw_sub_id = $3 WHERE id = $4", [newEndDate, fw_plan_id, flutterwaveSubId, currentSub.id]);
                subscriptionId = currentSub.id; 

                try {
                    const templatePath = path.join(__dirname, 'mail-templates', 'renew-subscription.html');
                    const emailUser = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
                    const currentUser = emailUser.rows[0];
                    let emailHtml = fs.readFileSync(templatePath, 'utf8');


                    if (currentUser.role === 'recruiter'){
                        emailHtml = emailHtml
                        .replace('[New End Date]', 'Lifetime')
                        .replace('[User Name]', currentUser.full_name)
                        .replace('[Plan Name]', planDetails.name);
                    } else {
                        const formattedEndDate = newEndDate.toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        });

                        emailHtml = emailHtml
                        .replace('[User Name]', currentUser.full_name)
                        .replace('[Plan Name]', planDetails.name)
                        .replace('[New End Date]', formattedEndDate);
                    }

                    const fromAddress = "noreply";
                    const fromName = "Remote JobsHive Team";
                    await sendEmail(
                        currentUser.email, 
                        "Your Subscription Has Been Renewed", 
                        emailHtml,
                        fromAddress,
                        fromName,
                        false
                    );
                } catch (error) {
                    console.error("Error sending welcome email:", error);
                }
                
            } else {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + planDetails.duration_days);
                
                const newSubResult = await db.query(
                    `INSERT INTO user_subscriptions (user_id, fw_plan_id, start_date, end_date, status, fw_sub_id) 
                     VALUES ($1, $2, $3, $4, 'active', $5) RETURNING id`,
                    [userId, fw_plan_id, startDate, endDate, flutterwaveSubId]
                );
                subscriptionId = newSubResult.rows[0].id;

                try {
                    const templatePath = path.join(__dirname, 'mail-templates', 'payment-successful.html');
                    const emailUser = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
                    const currentUser = emailUser.rows[0];
                    let emailHtml = fs.readFileSync(templatePath, 'utf8');

                    if (currentUser.role === 'recruiter'){
                        emailHtml = emailHtml
                        .replace('[End Date]', 'Lifetime')
                        .replace('[User Name]', currentUser.full_name)
                        .replace('[Plan Name]', planDetails.name);
                    } else {
                        const formattedEndDate = endDate.toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        });
                        emailHtml = emailHtml
                        .replace('[User Name]', currentUser.full_name)
                        .replace('[Plan Name]', planDetails.name)
                        .replace('[End Date]', formattedEndDate);
                    }
                    
                    const fromAddress = "noreply";
                    const fromName = "Remote JobsHive Team";
                    await sendEmail(
                        currentUser.email, 
                        "Your Subscription is Active!", 
                        emailHtml,
                        fromAddress,
                        fromName,
                        false
                    );
                } catch (error) {
                    console.error("Error sending welcome email:", error);
                }
            }

            await db.query(
                `INSERT INTO transactions (user_id, subscription_id, flutterwave_transaction_id, tx_ref, amount, currency, status, payment_type, customer_name, customer_email)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    userId,
                    subscriptionId,
                    data.id,
                    data.tx_ref,
                    data.amount,
                    data.currency,
                    data.status,
                    data.payment_type,
                    data.customer.name,
                    data.customer.email
                ]
            );
        
            const userResult = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
            const user = userResult.rows[0];
            const isSubscribed = await getSubscriptionStatus(user.id);
            
            const newPayload = { 
                id: user.id, 
                role: user.role,
                fullName: user.full_name,
                isSubscribed: true,
            };
            const newToken = jwt.sign(newPayload, process.env.JWT_SECRET, { expiresIn: '10d' });

            return res.status(200).json({ 
                message: "Subscription activated.",
                token: newToken, 
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    role: user.role,
                    isSubscribed: isSubscribed
                }
            });
        } else {
            return res.status(400).json({ message: "Payment verification failed." });
        }
    } catch (error) {
        console.error("Verification error: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/recruiter/jobs", authenticateToken, async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const result = await db.query(`
            SELECT 
                j.*,
                COUNT(a.id) AS applicant_count
            FROM jobs j
            LEFT JOIN applications a ON j.id = a.job_id
            WHERE j.recruiter_id = $1
            GROUP BY j.id
            ORDER BY j.date_posted DESC;
        `, [recruiterId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching recruiter jobs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Delete Job Listing
app.delete("/jobs/:jobId", authenticateToken, async (req, res) => {
    try {
        const { jobId } = req.params;
        const recruiterId = req.user.id;

        const result = await db.query(
            "DELETE FROM jobs WHERE id = $1 AND recruiter_id = $2",
            [jobId, recruiterId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Job not found or you do not have permission to delete it." });
        }
        res.status(200).json({ message: "Job deleted successfully." });
    } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Patch to update jobs
app.patch("/jobs/:jobId", authenticateToken, async (req, res) => {
    try {
        await db.query('BEGIN');

        const { jobId } = req.params;
        const recruiterId = req.user.id;
        const { job } = req.body;

        const updateJobQuery = `
            UPDATE jobs SET 
                title = $1, job_title_id = $2, location_id = $3, description = $4, 
                requirements = $5, benefits = $6, job_type = $7, job_position = $8, 
                job_experience = $9, salary_min = $10, salary_max = $11, currency = $12, 
                visa_sponsorship = $13, degree_required = $14, department = $15
            WHERE id = $16 AND recruiter_id = $17
            RETURNING *;
        `;
        const jobValues = [
            job.title, job.jobTitleId, job.locationId, job.jobDescription, job.jobRequirements,
            job.jobBenefits, job.jobType, job.jobPosition, job.jobExperience, job.salary_min,
            job.salary_max, job.currency, job.visaSponsorship, job.degreeRequired, job.department,
            jobId, recruiterId
        ];
        const result = await db.query(updateJobQuery, jobValues);

        if (result.rowCount === 0) {
            throw new Error("Job not found or you do not have permission to edit it.");
        }
        const updatedJob = result.rows[0];

        await db.query("DELETE FROM job_skills WHERE job_id = $1", [jobId]);

        if (job.skills && job.skills.length > 0) {
            const skillInsertQuery = 'INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2)';
            for (const skillId of job.skills) {
                await db.query(skillInsertQuery, [jobId, skillId]);
            }
        }

        await db.query('COMMIT');
        res.status(200).json({ message: "Job updated successfully!", job: updatedJob });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error updating job:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Applicants 
app.get("/recruiter/applicants", authenticateToken, async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const result = await db.query(`
            SELECT 
                a.id AS application_id,
                a.application_date,
                j.id AS job_id,
                j.title AS job_title,
                u.id AS applicant_id,
                u.full_name AS applicant_name,
                u.email AS applicant_email,
                u.title AS applicant_title,
                u.avatar_url AS applicant_avatar,
                u.resume_url,
                u.resume_filename
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN jobs j ON a.job_id = j.id
            WHERE j.recruiter_id = $1
            ORDER BY j.title ASC, a.application_date DESC;
        `, [recruiterId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching applicants:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// R: Download Resume 
app.get("/resumes/download", authenticateToken, async (req, res) => {
    try {
        const { path: gcsFilePath, filename } = req.query;
        const recruiterId = req.user.id;

        const permissionResult = await db.query(`
            SELECT 1 
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN jobs j ON a.job_id = j.id
            WHERE j.recruiter_id = $1 AND u.resume_url = $2
            LIMIT 1;
        `, [recruiterId, gcsFilePath]);
        if (permissionResult.rows.length === 0) {
            return res.status(403).json({ 
            message: "Forbidden: You do not have permission to access this file." });
        }
        
        const [signedUrl] = await bucket.file(gcsFilePath).getSignedUrl({
            action: 'read',
            expires: Date.now() + 5 * 60 * 1000,
            responseDisposition: `attachment; filename="${filename}"`
        });
        
        res.redirect(signedUrl);

    } catch (error) {
        console.error("Error downloading resume:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// R: View Resume 
app.get("/resumes/open", authenticateToken, async (req, res) => {
    try {
        const { path: gcsFilePath } = req.query;
        const recruiterId = req.user.id;

        const permissionResult = await db.query(`
            SELECT 1 
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN jobs j ON a.job_id = j.id
            WHERE j.recruiter_id = $1 AND u.resume_url = $2
            LIMIT 1;
        `, [recruiterId, gcsFilePath]);
        if (permissionResult.rows.length === 0) {
            return res.status(403).json({ 
            message: "Forbidden: You do not have permission to access this file." });
        }
        
        const [signedUrl] = await bucket.file(gcsFilePath).getSignedUrl({
            action: 'read',
            expires: Date.now() + 5 * 60 * 1000, 
        });
        
        res.redirect(signedUrl);

    } catch (error) {
        console.error("Error opening resume:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// R: Dashboard Stats 
app.get("/recruiter/dashboard/stats", authenticateToken, async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const statsQuery = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM jobs WHERE recruiter_id = $1 AND status = 'active') AS active_jobs_count,
                (SELECT COUNT(*) FROM applications WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = $1)) AS total_applicants_count,
                (SELECT COUNT(*) FROM applications WHERE job_id IN (SELECT id FROM jobs WHERE recruiter_id = $1) AND application_date >= NOW() - INTERVAL '7 days') AS new_applicants_this_week;
        `, [recruiterId]);
        
        const recentJobsQuery = await db.query(`
            SELECT 
                j.title, 
                j.status,
                (SELECT COUNT(*) FROM applications WHERE job_id = j.id) AS applicants
            FROM jobs j
            WHERE j.recruiter_id = $1
            ORDER BY j.date_posted DESC
            LIMIT 5;
        `, [recruiterId]);

        const recentApplicantsQuery = await db.query(`
            SELECT 
                u.full_name AS name, 
                u.avatar_url AS avatar, 
                j.title AS applyingFor
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN jobs j ON a.job_id = j.id
            WHERE j.recruiter_id = $1
            ORDER BY a.application_date DESC
            LIMIT 5;
        `, [recruiterId]);

        const subscriptionResult = await db.query(`
            SELECT EXISTS (
                SELECT 1 FROM user_subscriptions 
                WHERE user_id = $1 AND status = 'active' AND end_date > NOW()
            )
        `, [recruiterId]);
        const isSubscribed = subscriptionResult.rows[0].exists;

        res.json({
            stats: statsQuery.rows[0],
            activeJobs: recentJobsQuery.rows,
            recentApplicants: recentApplicantsQuery.rows,
            
        });

    } catch (error) {
        console.error("Error fetching recruiter dashboard data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Scrapper API Endpoint (Protected)
app.post("/hiver/add-job", apiKeyAuth, async (req, res) => {
       try {
        await db.query('BEGIN');
        const jobData = req.body;

        if (jobData.source !== 'hiver') {
            return res.status(400).json({ message: "Invalid Request." });
        }

        let companyId;

        // Insert Company Data 
        const checkCompany = await db.query('SELECT id FROM companies WHERE slug = $1', [jobData.company_slug]);

        if (checkCompany.rows.length === 0) {
            const newCompanyResult = await db.query(
                `INSERT INTO companies (name, about, logo_url, website_url, linkedin_url, slug)
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                    [jobData.company_name, jobData.about_company, jobData.company_logo, jobData.company_website, jobData.company_linkedin, jobData.company_slug]
                );
                companyId = newCompanyResult.rows[0].id;
        } else {
            companyId = checkCompany.rows[0].id;
            // NEW 
            await db.query('update companies SET logo_url = $1 WHERE id = $2 AND logo_url IS DISTINCT FROM $1', [jobData.company_logo, companyId]);
            // NEW 
        }
        // Insert Company Data Ends

        // Insert Job Data
        const jobSql = await db.query(
            `INSERT INTO jobs (
                title, description, requirements, benefits, job_type, job_position, 
                job_experience, salary_min, salary_max, salary,
                visa_sponsorship, degree_required, apply_url, department,
                company_id, location_id, job_title_id, slug, status, date_posted, excerpts
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING id`, [jobData.title, jobData.description, jobData.requirements, jobData.benefits, 
                jobData.job_type, jobData.job_position, jobData.job_experience, 
                jobData.salary_min, jobData.salary_max, jobData.salary, jobData.visa_sponsorship, 
                jobData.degree_required, jobData.apply_url, jobData.department, companyId, 
                jobData.location_id, jobData.job_title, jobData.slug, 'active', jobData.date_posted, jobData.excerpts]);

        const jobId = jobSql.rows[0].id;

        // Insert Job Data Starts
        const skillsData = jobData.skills;

            if (skillsData && typeof skillsData === 'string') {
        const skillIdArray = skillsData.split(',').map(id => parseInt(id.trim()));

        const skillInsertQuery = 'INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2)';
        
        for (const skillId of skillIdArray) {
            await db.query(skillInsertQuery, [jobId, skillId]);
         }
        }
        // Insert Skills Data Ends
        
        await db.query('COMMIT');
        res.status(201).json({ message: "Job added successfully!", jobId: jobId });
      

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error processing scraped job:", error);
        res.status(500).json({ message: "Error processing scraped job." });
    }
});

// Forgot Password
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        await db.query('BEGIN');
        const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(201).json({ message: "This email isn’t linked to any account. Please verify your email and retry." });
        }
        const user = userResult.rows[0];

        if (user.auth_provider === 'google') {
            return res.status(400).json({ message: "Password reset is not available for Google-authenticated accounts." });
        }

        const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });

        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

        await db.query(
            "UPDATE users SET reset_token_hash = $1, reset_token_expires = $2 WHERE id = $3",
            [hashedToken, tokenExpiry, user.id]
        );

        try {
            const templatePath = path.join(__dirname, 'mail-templates', 'password-reset.html');
            const resetLink = `${process.env.BASE_URL}/reset-password/${resetToken}`;
            console.log(resetLink);
            let emailHtml = fs.readFileSync(templatePath, 'utf8');

            emailHtml = emailHtml
                .replace('[Reset Link]', resetLink)
                .replace('[User Name]', user.full_name);

            const fromAddress = "noreply";
            const fromName = "Remote JobsHive";
            await sendEmail(user.email, "Your Password Reset Link", emailHtml, fromAddress, fromName, false);

        } catch (error) {
            console.error("Error sending welcome email:", error);
        }

        await db.query('COMMIT');
        res.status(200).json({ message: "A password reset link has been sent to your email." });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error sending password reset email:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Reset Password 
app.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        await db.query('BEGIN');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        console.log(hashedToken);

        const userResult = await db.query(
            "SELECT * FROM users WHERE reset_token_hash = $1 AND reset_token_expires > NOW()",
            [hashedToken]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "Password reset link is invalid or has expired." });
        }
        const user = userResult.rows[0];

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query(
            "UPDATE users SET password = $1, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = $2",
            [hashedPassword, user.id]
        );

        await db.query('COMMIT');
        res.status(200).json({ message: "Password has been reset successfully. You can now log in with new. password." });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Contact Us 
app.post("/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const emailSubject = `New Contact Form Message: ${subject}`;
        const emailHtml = `
            <h3>New Message from JobsHive Contact Form</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
        `;

        const fromAddress = "noreply";
        const fromName = "Remote JobsHive Ltd"

        await sendEmail(
            'teema@remotejobshive.com',
            emailSubject,
            emailHtml,
            fromAddress,
            fromName,
            false
        );

        res.status(200).json({ message: "Thank you! Your message has been sent." });

    } catch (error) {
        console.error("Error sending contact form email:", error);
        res.status(500).json({ message: "Sorry, we could not send your message at this time." });
    }
});

app.get("/job-alerts", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query("SELECT * FROM job_alerts WHERE user_id = $1", [userId]);
        
        if (result.rows.length === 0) {
            return res.json(null); 
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch alert settings." });
    }
});

app.delete("/job-alerts", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query("DELETE FROM job_alerts WHERE user_id = $1", [userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "No active alert found to delete." }); 
        }
        res.status(200).json({ message: "Job alert deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete alert." });
    }
});

// Job Alert 
app.post("/job-alerts", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { job_title_id, location_id, job_position } = req.body;

        const query = `
            INSERT INTO job_alerts (user_id, job_title_id, location_id, job_position, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                job_title_id = EXCLUDED.job_title_id,
                location_id = EXCLUDED.location_id,
                job_position = EXCLUDED.job_position,
                updated_at = NOW();
        `;
        
        await db.query(query, [
            userId,
            job_title_id || null,
            location_id || null,
            job_position || null
        ]);

        res.status(200).json({ message: "Job alert preferences saved." });
    } catch (error) {
        console.error("Error saving job alert:", error);
        res.status(500).json({ message: "Failed to save preferences." });
    }
});

// Update Status 
app.get("/users/me/status", authenticateToken, async (req, res) => {
    const isSubscribed = await getSubscriptionStatus(req.user.id);

    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "User not found." });
    }

    const user = { ...userResult.rows[0], isSubscribed: isSubscribed };
    const updatedUser = { id: user.id, isSubscribed: isSubscribed, fullName: user.full_name, role: user.role, avatar: user.avatar_url, email: user.email, title: user.title };
    res.status(200).json(updatedUser);
});

// Webhook to Updated Renewed Payments 
app.post("/flutterwave/webhook", async (req, res) => {
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    const signature = req.headers["verif-hash"];
    
    if (!signature || (signature !== secretHash)) {
        return res.status(401).end();
    }
    const eventData = req.body;
    
    if (eventData.event === "charge.completed") {
        try {
            await db.query('BEGIN');
            const transactionData = eventData.data;
            const customerEmail = transactionData.customer.email;
            
            const SubResponse = await axios.get(
            `https://api.flutterwave.com/v3/subscriptions?transaction_id=${transactionData.id}&status=active`,
            { headers: { 'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
        );
            const subData = SubResponse.data.data[0];
            const flutterwaveSubId = subData.id;

            const userResult = await db.query("SELECT id, full_name FROM users WHERE email = $1", [customerEmail]);
            if (userResult.rows.length === 0) {
                throw new Error(`Webhook Error: User with email ${customerEmail} not found.`);
            }
            const userId = userResult.rows[0].id;
            const username = userResult.rows[0].full_name;

            
            const subResult = await db.query("SELECT * FROM user_subscriptions WHERE user_id = $1", [userId]);
            if (subResult.rows.length === 0) {
                 throw new Error(`Webhook Error: Subscription for user ${userId} not found.`);
            }
            const currentSub = subResult.rows[0];
            const planDetails = await db.query("SELECT * FROM subscription_plans WHERE fw_plan_id = $1", [currentSub.fw_plan_id]);
            
            const newEndDate = new Date();
            newEndDate.setDate(newEndDate.getDate() + planDetails.rows[0].duration_days);

            await db.query("UPDATE user_subscriptions SET end_date = $1, fw_sub_id = $2, status = 'active' WHERE id = $3", [newEndDate, flutterwaveSubId, currentSub.id]);
            await db.query(
                `INSERT INTO transactions (user_id, subscription_id, flutterwave_transaction_id, tx_ref, amount, currency, status, payment_type, customer_name, customer_email)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    userId,
                    currentSub.id,
                    transactionData.id,
                    transactionData.tx_ref,
                    transactionData.amount,
                    transactionData.currency,
                    transactionData.status,
                    transactionData.payment_type,
                    transactionData.customer.name,
                    transactionData.customer.email
                ]
            );
            
            await db.query('COMMIT');


            try {
                const templatePath = path.join(__dirname, 'mail-templates', 'renew-subscription.html');
                let emailHtml = fs.readFileSync(templatePath, 'utf8');

                const formattedEndDate = newEndDate.toLocaleDateString('en-US', 
                    {year: 'numeric', month: 'long', day: 'numeric'});
                emailHtml = emailHtml
                .replace('[User Name]', username)
                .replace('[Plan Name]', planDetails.rows[0].name)
                .replace('[New End Date]', formattedEndDate);

                const fromAddress = "noreply";
                const fromName = "Remote JobsHive Team";
                await sendEmail(
                    customerEmail, 
                    "Your Subscription Has Been Renewed", 
                    emailHtml,
                    fromAddress,
                    fromName,
                    false
                );
            } catch (error) {
                console.error("Error sending welcome email:", error);
            }
            
            console.log(`Successfully renewed subscription for user ${userId}.`);

        } catch (error) {
            await db.query('ROLLBACK');
            console.error("Webhook processing error:", error);
        }
    }
    res.status(200).send();
});

app.listen(port, "0.0.0.0", ()=>{
    console.log("Server is listening and I am watching you...")
});


// ADMIN PANEL 
// --- Dashboard ---
app.get('/admin/stats', verifyToken, async (req, res) => {
    try {
        const userCounts = await db.query(`
            SELECT 
                COUNT(*) AS total_users,
                COUNT(CASE WHEN role = 'user' THEN 1 END) AS job_seekers,
                COUNT(CASE WHEN role = 'recruiter' THEN 1 END) AS recruiters
            FROM users;
        `);
        const jobCount = await db.query("SELECT COUNT(*) FROM jobs WHERE status = 'active';");
        const subCount = await db.query("SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active';");

        res.json({
            totalUsers: parseInt(userCounts.rows[0].total_users, 10),
            jobSeekers: parseInt(userCounts.rows[0].job_seekers, 10),
            recruiters: parseInt(userCounts.rows[0].recruiters, 10),
            activeJobs: parseInt(jobCount.rows[0].count, 10),
            activeSubscriptions: parseInt(subCount.rows[0].count, 10),
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats." });
    }
});

// --- User Management ---
app.get('/admin/users', verifyToken, async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10); 
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    try {
        const searchQuery = `%${searchTerm}%`;

        
        
        const usersResult = await db.query(`
            SELECT
                u.id, u.full_name, u.email, u.role, u.title, u.auth_provider,
                u.created_at, u.avatar_url, 
                us.status AS subscription_status,
                us.end_date AS subscription_end_date
            FROM
                users u
            LEFT JOIN LATERAL (
                SELECT status, end_date
                FROM user_subscriptions
                WHERE user_id = u.id
                ORDER BY end_date DESC
                LIMIT 1
            ) us ON true
            WHERE
                u.full_name ILIKE $1 OR u.email ILIKE $1
            ORDER BY
                u.created_at DESC
            LIMIT $2 OFFSET $3;
        `, [searchQuery, limit, offset]);
        
        const totalResult = await db.query(`
            SELECT COUNT(*) FROM users
            WHERE full_name ILIKE $1 OR email ILIKE $1;
        `, [searchQuery]);

        res.json({
            users: usersResult.rows,
            totalUsers: parseInt(totalResult.rows[0].count, 10),
            currentPage: page,
            totalPages: Math.ceil(totalResult.rows[0].count / limit)
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users." });
    }
});

app.delete('/admin/users/:id', verifyToken, async (req, res) => {
    const userIdToDelete = parseInt(req.params.id, 10);

    if (userIdToDelete === req.user.id) { 
         return res.status(400).json({ message: "Cannot delete your own admin account." });
    }

    try {
        const result = await db.query(
            'DELETE FROM users WHERE id = $1',
            [userIdToDelete]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        
        res.status(200).json({ message: "User deleted successfully." });

    } catch (error) {
        console.error(`Error deleting user ${userIdToDelete}:`, error);
        res.status(500).json({ message: "Failed to delete user." });
    }
});

// --- Job Management ---
app.get('/admin/jobs', verifyToken, async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10);
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    try {
        const searchQuery = `%${searchTerm}%`;
        
        const jobsResult = await db.query(`
            SELECT j.id, j.title, j.slug, j.status, j.date_posted, c.name as company_name, jl.name as job_location
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            LEFT JOIN job_locations jl ON j.location_id = jl.id
            WHERE j.title ILIKE $1 OR c.name ILIKE $1 OR jl.name ILIKE $1
            ORDER BY j.date_posted DESC
            LIMIT $2 OFFSET $3;
        `, [searchQuery, limit, offset]);
        
        const totalResult = await db.query(`
             SELECT COUNT(j.id) 
             FROM jobs j
             JOIN companies c ON j.company_id = c.id
             LEFT JOIN job_locations jl ON j.location_id = jl.id
             WHERE j.title ILIKE $1 OR c.name ILIKE $1 OR jl.name ILIKE $1;
        `, [searchQuery]);

        res.json({
            jobs: jobsResult.rows,
            totalJobs: parseInt(totalResult.rows[0].count, 10),
            currentPage: page,
            totalPages: Math.ceil(totalResult.rows[0].count / limit)
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ message: "Failed to fetch jobs." });
    }
});

app.delete('/admin/jobs/:id', verifyToken, async (req, res) => {
    const jobId = parseInt(req.params.id, 10);
    try {
        await db.query('DELETE FROM jobs WHERE id = $1', [jobId]);
        res.status(200).json({ message: "Job deleted successfully." });

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Job not found." });
        }

    } catch (error) {
        console.error(`Error deleting job ${jobId}:`, error);
        res.status(500).json({ message: "Failed to delete job." });
    }
});

// --- Company Management ---
app.get('/admin/companies', verifyToken, async (req, res) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10);
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    try {
        const searchQuery = `%${searchTerm}%`;

        const companiesResult = await db.query(`
            SELECT c.id, c.name, c.slug, c.website_url, c.created_at, COUNT(j.id) as job_count
            FROM companies c
            LEFT JOIN jobs j ON c.id = j.company_id AND j.status = 'active'
            WHERE c.name ILIKE $1 OR c.website_url ILIKE $1
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT $2 OFFSET $3;
        `, [searchQuery, limit, offset]);

        const totalResult = await db.query(`
            SELECT COUNT(*) FROM companies
            WHERE name ILIKE $1 OR website_url ILIKE $1;
        `, [searchQuery]);

        res.json({
            companies: companiesResult.rows.map(c => ({
                ...c,
                job_count: parseInt(c.job_count, 10)
            })),
            totalCompanies: parseInt(totalResult.rows[0].count, 10),
            currentPage: page,
            totalPages: Math.ceil(totalResult.rows[0].count / limit)
        });
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({ message: "Failed to fetch companies." });
    }
});


app.delete('/admin/companies/:id', verifyToken, async (req, res) => {
    const companyId = parseInt(req.params.id, 10);
    if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID." });
    }

    try {
        const result = await db.query('DELETE FROM companies WHERE id = $1', [companyId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Company not found." });
        }

        res.status(200).json({ message: "Company deleted successfully." });

    } catch (error) {
        console.error(`Error deleting company ${companyId}:`, error);
        if (error.code === '23503') {
            res.status(400).json({ message: "Cannot delete company. Delete associated job listings first." });
        } else {
            res.status(500).json({ message: "Failed to delete company." });
        }
    }
});

// --- Admin Login Endpoint ---
app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const user = userResult.rows[0];
        if (user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admin privileges required." }); 
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const payload = {
            id: user.id,
            role: user.role,
            fullName: user.full_name,
        };

        const token = jwt.sign(
            payload,
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Admin login successful!",
            token: token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
            }
        });

    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({ message: "Internal server error during login." });
    }
});

// Analytics Tracking Endpoint
app.post('/analytics/track', attachUserIfPresent, async (req, res) => {
    const { event_type, page_visited, job_id } = req.body;
    const userId = req.user?.id || null; 
    const ip = getIpAddress(req);
    const userAgent = req.headers['user-agent'];

    try {
        await db.query(
            `INSERT INTO analytics_events (event_type, user_id, visitor_ip, user_agent, page_visited, job_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [event_type, userId, ip, userAgent, page_visited, job_id]
        );
        res.status(200).json({ message: 'Event tracked' });
    } catch (error) {
        console.error("Analytics track error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ADMIN ANALYTICS PANEL

app.get('/admin/analytics/stats', verifyToken, async (req, res) => {
    const { range = 'all' } = req.query;
    let dateFilter = '';
    let dateFilterSubquery = ''; 

    switch (range) {
        case 'today':
            dateFilter = "AND created_at >= NOW()::date";
            dateFilterSubquery = "AND ae.created_at >= NOW()::date";
            break;
        case '1d': 
            dateFilter = "AND created_at >= NOW() - INTERVAL '1 day'"; 
            dateFilterSubquery = "AND ae.created_at >= NOW() - INTERVAL '1 day'"; 
            break;
        case '3d': 
            dateFilter = "AND created_at >= NOW() - INTERVAL '3 days'"; 
            dateFilterSubquery = "AND ae.created_at >= NOW() - INTERVAL '3 days'";
            break;
        case '7d': 
            dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'"; 
            dateFilterSubquery = "AND ae.created_at >= NOW() - INTERVAL '7 days'";
            break;
        case '30d': 
            dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'"; 
            dateFilterSubquery = "AND ae.created_at >= NOW() - INTERVAL '30 days'";
            break;
        case '1y': 
            dateFilter = "AND created_at >= NOW() - INTERVAL '1 year'"; 
            dateFilterSubquery = "AND ae.created_at >= NOW() - INTERVAL '1 year'";
            break;
    }

    try {
        const statsQuery = `
            SELECT
                (SELECT COUNT(DISTINCT ae.user_id) 
                 FROM analytics_events ae
                 WHERE ae.user_id IS NOT NULL 
                   AND EXISTS (SELECT 1 FROM users u WHERE u.id = ae.user_id)
                   ${dateFilterSubquery}
                ) AS total_user_visits,
                
                COUNT(DISTINCT visitor_ip) FILTER (WHERE user_id IS NULL ${dateFilter}) AS total_guest_visits,
                COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW' ${dateFilter}) AS total_page_views,
                COUNT(*) FILTER (WHERE event_type = 'APPLY_CLICK' ${dateFilter}) AS total_apply_clicks
            FROM analytics_events
            WHERE 1=1 ${dateFilter};
        `;
        const stats = await db.query(statsQuery);
        
        const formattedStats = {
            total_user_visits: parseInt(stats.rows[0].total_user_visits, 10),
            total_guest_visits: parseInt(stats.rows[0].total_guest_visits, 10),
            total_page_views: parseInt(stats.rows[0].total_page_views, 10),
            total_apply_clicks: parseInt(stats.rows[0].total_apply_clicks, 10)
        };
        
        res.json(formattedStats);
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// REGISTERED USER VISITORS ---
app.get('/admin/analytics/user-visitors', verifyToken, async (req, res) => {
    const { page = 1, limit = 20, sort = 'desc', range = 'all' } = req.query;
    const offset = (page - 1) * limit;
    const sortOrder = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    

    let dateFilter = '';
    switch (range) {
        case 'today': dateFilter = "AND ae.created_at >= NOW()::date"; break;
        case '1d': dateFilter = "AND ae.created_at >= NOW() - INTERVAL '1 day'"; break;
        case '3d': dateFilter = "AND ae.created_at >= NOW() - INTERVAL '3 days'"; break;
        case '7d': dateFilter = "AND ae.created_at >= NOW() - INTERVAL '7 days'"; break;
        case '30d': dateFilter = "AND ae.created_at >= NOW() - INTERVAL '30 days'"; break;
        case '1y': dateFilter = "AND ae.created_at >= NOW() - INTERVAL '1 year'"; break;
    }

    try {
        const visitorsQuery = `
            SELECT
                u.id,
                u.full_name,
                u.email,
                COUNT(ae.id) AS page_views,
                MAX(ae.created_at) AS last_seen
            FROM analytics_events ae
            JOIN users u ON ae.user_id = u.id
            WHERE ae.user_id IS NOT NULL ${dateFilter}
            GROUP BY u.id, u.full_name, u.email
            ORDER BY last_seen ${sortOrder}
            LIMIT $1 OFFSET $2;
    `;
        const visitors = await db.query(visitorsQuery, [limit, offset]);
        
        const total = await db.query(`
            SELECT COUNT(DISTINCT u.id)
            FROM analytics_events ae
            JOIN users u ON ae.user_id = u.id
            WHERE ae.user_id IS NOT NULL ${dateFilter}
        `);
        
        res.json({
            visitors: visitors.rows,
            totalVisitors: parseInt(total.rows[0].count, 10),
            totalPages: Math.ceil(total.rows[0].count / limit)
        });
    } catch (error) {
        console.error("Error fetching user visitors:", error);
        res.status(500).json({ message: 'Error fetching user visitors' });
    }
});

// GUEST VISITORS ---
app.get('/admin/analytics/guest-visitors', verifyToken, async (req, res) => {
    const { page = 1, limit = 20, sort = 'desc', range = 'all' } = req.query;
    const offset = (page - 1) * limit;
    const sortOrder = sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let dateFilter = '';
    switch (range) {
        case 'today': dateFilter = "AND created_at >= NOW()::date"; break;
        case '1d': dateFilter = "AND created_at >= NOW() - INTERVAL '1 day'"; break;
        case '3d': dateFilter = "AND created_at >= NOW() - INTERVAL '3 days'"; break;
        case '7d': dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'"; break;
        case '30d': dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'"; break;
        case '1y': dateFilter = "AND created_at >= NOW() - INTERVAL '1 year'"; break;
}

    try {
        const visitorsQuery = `
            SELECT
                COALESCE(ae.visitor_ip, 'unknown') AS visitor_ip,
                COUNT(ae.id) AS page_views,
                MAX(ae.created_at) AS last_seen
            FROM analytics_events ae
            WHERE ae.user_id IS NULL 
            ${dateFilter}
            GROUP BY COALESCE(ae.visitor_ip, 'unknown')
            ORDER BY last_seen ${sortOrder}
            LIMIT $1 OFFSET $2;
        `;
        const visitors = await db.query(visitorsQuery, [limit, offset]);

        const total = await db.query(`
            SELECT COUNT(DISTINCT COALESCE(visitor_ip, 'unknown')) 
            FROM analytics_events 
            WHERE user_id IS NULL ${dateFilter};
        `);

        res.json({
            visitors: visitors.rows,
            totalVisitors: parseInt(total.rows[0].count, 10),
            totalPages: Math.ceil(total.rows[0].count / limit)
        });
    } catch (error) {
    console.error("❌ Error fetching guest visitors:");
    console.error(error.stack || error);
    res.status(500).json({
        message: 'Error fetching guest visitors',
        error: error.message,
    });
    }
});


// VISITOR DETAIL (SIDEBAR) ---
app.get('/admin/analytics/visitor-details', verifyToken, async (req, res) => {
    // This endpoint now fetches ALL events for a given user OR ip
    const { userId, ip } = req.query;

    try {
        let query;
        let params;

        if (userId) {
            query = `SELECT event_type, page_visited, job_id, created_at 
                     FROM analytics_events 
                     WHERE user_id = $1 
                     ORDER BY created_at DESC`;
            params = [userId];
        } else if (ip) {
            query = `SELECT event_type, page_visited, job_id, created_at 
                     FROM analytics_events 
                     WHERE visitor_ip = $1 AND user_id IS NULL 
                     ORDER BY created_at DESC`;
            params = [ip];
        } else {
            return res.status(400).json({ message: "A user ID or IP is required." });
        }
        
        const events = await db.query(query, params);
        res.json(events.rows);

    } catch (error) {
        console.error("Error fetching visitor details:", error);
        res.status(500).json({ message: 'Error fetching visitor details' });
    }
});
