const { PrismaClient } = require("@prisma/client");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const fileupload = require("express-fileupload");
const app = express();
const PORT = process.env.PORT || 8080;
const latex = require("node-latex");
const { join, resolve } = require("path");
var cors = require("cors");
var fs = require("fs");
var path = require("path");
var temp = require("temp");
const bodyParser = require("body-parser");
const prisma = new PrismaClient();
const axios = require('axios');
const cheerio = require('cheerio');
app.use(cors());
app.use(fileupload());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "build")));

const { hash, compare } = bcryptjs;
const SECRET_KEY = process.env.SECRET_KEY;

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Please authenticate." });
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Please authenticate." });
  }
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});


app.post("/upload", async function (req, res) {

  const options = {
    inputs: [resolve(join(__dirname, "/"))],
    cmd: "xelatex",
    passes: 2,
  };

  res.setHeader("Content-Type", "application/pdf");

  try {
    let buf = Buffer.from(req.body.tex.toString("utf8"), "base64");
    let text = buf.toString();

    // Generate PDF locally
    const pdf = latex(text, options);
    
    // Convert PDF to base64
    let chunks = [];
    pdf.on('data', (chunk) => chunks.push(chunk));
    pdf.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const pdfBase64 = pdfBuffer.toString('base64');

      // Call Lambda function to save to S3
      const s3Response = await SaveToS3(pdfBase64, req.body.filename);
      console.log('S3 Response:', s3Response);
      const update = await prisma.job.update({
        where: { id: req.body.id },
        data: {
          resumeLink: s3Response.pdfUrl,
        },

    });});
    pdf.pipe(res);
    pdf.on("error", (err) => {
      res.status(400).json({ error: err.message });
    });
    pdf.on("finish", () => {});

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Failed to process the LaTeX document' });
  }
});

const SaveToS3 = async (pdfBase64,fileName) => {
  console.log('Saving to S3:', fileName);
  try {
    const response = await axios.post("https://2jwcwpbxod.execute-api.us-east-1.amazonaws.com/dev/save", {
      latexCode: pdfBase64,
      fileName,
    });
    console.log('Lambda response:', response.data.body);
    return response.data.body;
  } catch (error) {
    console.error('Error calling Lambda:', error);
    throw error;
  }
}

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});

var removeDir = function (dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  var list = fs.readdirSync(dirPath);
  for (var i = 0; i < list.length; i++) {
    var filename = path.join(dirPath, list[i]);
    var stat = fs.statSync(filename);
    console.log("removing: " + filename);
    if (filename == "." || filename == "..") {
      // do nothing for current and parent dir
    } else if (stat.isDirectory()) {
      removeDir(filename);
    } else {
      fs.unlinkSync(filename);
    }
  }
  console.log("removing: " + dirPath);
  fs.rmdirSync(dirPath);
};
// Registration
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await hash(password, 12);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "This email is already in use" });
    }
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        previousJobs: "",
        projects: "",
        skills: "",
      },
    });
    return res.status(200).json(newUser);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.put("/update", async (req, res) => {
  try {
    const { previousJobs, projects, skills } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        previousJobs: previousJobs,
        projects: projects,
        skills: skills,
      },
    });
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}); 

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ userId: user.id }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ id: user.id, email: user.email, name: user.name, previousJobs: user.previousJobs, projects: user.projects, skills: user.skills });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new project
app.post("/projects", authenticate, async (req, res) => {
  console.log(req.body);

  const { title, resume, userId,status, jobDescription,link,coverLetter,type,coverLetterLink,resumeLink } = req.body;
  try {
    const project = await prisma.job.create({
      data: {
        title,
        resume,
        userId,
        status,
        jobDescription,
        link,
        coverLetter,
        type,
        coverLetterLink,
        resumeLink,
      },
    });
    console.log(project);
    res.status(201).json(project);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

// Read all projects
app.get("/projects", authenticate, async (req, res) => {
  try {
    const projects = await prisma.job.findMany({
      select: {
        id: true,
        title: true,
        updatedAt: true,
        userId: true,
        status: true,
        jobDescription: true,
        link: true,
        coverLetter: true,
        type: true,
        coverLetterLink: true,
        resumeLink: true,
      },
    });
    res.json(projects);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Read a single project by ID
app.get("/projects/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.job.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a project by ID
app.put("/projects/:id", async (req, res) => {
  const { id } = req.params;
  console.log(req.body);
  const { title, resume } = req.body;
  console.log(title, resume);
  
  try {
    const project = await prisma.job.update({
      where: { id },
      data: {
        title,
        resume,
      },
    });
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.put("/projects/cover/:id", async (req, res) => {
  const { id } = req.params;
  console.log(req.body);
  const { coverLetter } = req.body;
  console.log(coverLetter);
  
  try {
    const project = await prisma.job.update({
      where: { id },
      data: {
        coverLetter,
      },
    });
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a project by ID
app.delete("/projects/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.job.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


function cleanText(text) {
  return text
    // Remove extra whitespace and newlines
    .replace(/\s+/g, ' ')
    // Remove any HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove CSS class names and related artifacts
    .replace(/\.\w+(-\w+)*(\.\w+(-\w+)*)*\s*(\{[^}]*\})?/g, '')
    // Remove CSS pseudo-classes and related artifacts
    .replace(/:\w+(\([^)]*\))?/g, '')
    // Remove common JavaScript artifacts
    .replace(/function\s*\([^)]*\)\s*\{[^}]+\}/g, '')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    // Remove specific patterns mentioned
    .replace(/\*\.overwritable[^*]+/g, '')
    // Remove any remaining non-alphanumeric characters at the start or end
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    // Final trim
    .trim();
}

const relevantSelectors = [
  'job-description', 'jobDescription', 'job-details', 'jobDetails', 'description',
  'job_description', 'job_details', 'full-description', 'fullDescription', 'job-summary',
  'jobSummary', 'job_summary', 'position-description', 'positionDescription', 'role-description',
  'roleDescription', 'job-responsibilities', 'jobResponsibilities', 'job_responsibilities', 'responsibilities',
  'duties', 'job-duties', 'jobDuties', 'job_duties', 'requirements',
  'job-requirements', 'jobRequirements', 'job_requirements', 'qualifications', 'job-qualifications',
  'jobQualifications', 'job_qualifications', 'job-overview', 'jobOverview', 'job_overview',
  'about-job', 'aboutJob', 'about_job', 'job-content', 'jobContent',
  'job_content', 'vacancy-description', 'vacancyDescription', 'job-spec', 'jobSpec',
  'job_spec', 'position-details', 'positionDetails', 'role-summary', 'roleSummary',
  'job-info', 'jobInfo', 'job_info', 'detailed-description', 'detailedDescription',
  'job-listing-description', 'jobListingDescription', 'job-post-description', 'jobPostDescription', 'employment-details',
  'employmentDetails', 'job-brief', 'jobBrief', 'job_brief', 'position-summary',
  'positionSummary', 'job-posting', 'jobPosting', 'job_posting', 'listing-description',
  'listingDescription', 'job-opportunity', 'jobOpportunity', 'job_opportunity', 'career-description',
  'careerDescription', 'position-content', 'positionContent', 'role-details', 'roleDetails',
  'job-specifics', 'jobSpecifics', 'job_specifics', 'vacancy-details', 'vacancyDetails',
  'job-ad-description', 'jobAdDescription', 'job-listing-content', 'jobListingContent', 'employment-opportunity',
  'employmentOpportunity', 'job-role', 'jobRole', 'job_role', 'position-overview',
  'positionOverview', 'job-expectations', 'jobExpectations', 'job_expectations', 'role-responsibilities',
  'roleResponsibilities', 'job-function', 'jobFunction', 'job_function', 'position-brief',
  'positionBrief', 'job-synopsis', 'jobSynopsis', 'job_synopsis', 'role-overview',
  'roleOverview', 'job-profile', 'jobProfile', 'job_profile', 'position-responsibilities',
  'positionResponsibilities', 'job-summary-description', 'jobSummaryDescription', 'detailed-job-description', 'detailedJobDescription',
  'full-job-description', 'fullJobDescription', 'complete-job-description', 'completeJobDescription', 'job-description-container',
  'jobDescriptionContainer', 'job-details-section', 'jobDetailsSection', 'job-description-section', 'jobDescriptionSection',
  'job-listing-details', 'jobListingDetails', 'job-post-content', 'jobPostContent', 'job-vacancy-description',
  'jobVacancyDescription', 'job-opening-details', 'jobOpeningDetails', 'job-description-text', 'jobDescriptionText',
  'job-summary-text', 'jobSummaryText', 'job-details-text', 'jobDetailsText', 'job-description-body',
  'jobDescriptionBody', 'job-details-body', 'jobDetailsBody', 'job-post-body', 'jobPostBody',
  'job-listing-body', 'jobListingBody', 'job-description-main', 'jobDescriptionMain', 'job-details-main',
  'jobDetailsMain', 'job-post-main', 'jobPostMain', 'job-listing-main', 'jobListingMain',
  'job-description-content', 'jobDescriptionContent', 'job-details-content', 'jobDetailsContent', 'job-post-content','job','content',
  'jobPostContent', 'job-listing-content', 'jobListingContent', 'job-description-paragraph', 'jobDescriptionParagraph','job-description-text',
  'jobDescriptionText', 'job-description-body', 'jobDescriptionBody', 'job-description-main', 'jobDescriptionMain', 'job-description-content',
  'requirements', 'qualifications', 'responsibilities', 'duties', 'job-duties', 'jobDuties', 'job_duties', 'requirements',
  'job-requirements', 'jobRequirements', 'job_requirements', 'qualifications', 'job-qualifications', 'jobQualifications', 'job_qualifications',
  'job-overview', 'jobOverview', 'job_overview', 'about-job', 'aboutJob', 'about_job', 'job-content', 'jobContent', 'job_content',
  'vacancy-description', 'vacancyDescription', 'job-spec', 'jobSpec', 'job_spec', 'position-details', 'positionDetails', 'role-summary',
  'roleSummary', 'job-info', 'jobInfo', 'job_info', 'detailed-description', 'detailedDescription', 'job-listing-description', 'jobListingDescription',
  'job-post-description', 'jobPostDescription', 'employment-details', 'employmentDetails', 'job-brief', 'jobBrief', 'job_brief', 'position-summary','mainContent'
];

const relevantKeywords = [
  'job description', 'role overview', 'about the job', 'position summary',
  'what you\'ll do', 'responsibilities', 'requirements', 'qualifications',
  'about this opportunity', 'the role', 'job details', 'about the role',
  'job summary', 'job responsibilities', 'job duties', 'job requirements',
  'job qualifications', 'job overview', 'job functions', 'job specifics',
  'job details', 'job specifics', 'job functions', 'job responsibilities',
  'job duties', 'job requirements', 'job qualifications', 'job overview',
  'job summary', 'job description', 'job details', 'job specifics',
  'Duties', 'Responsibilities', 'Requirements', 'Qualifications',
  'About this opportunity', 'The role', 'Job details', 'About the role',
  'What you\'ll do', 'Responsibilities', 'Requirements', 'Qualifications',
  'Intern', 'Internship', 'Trainee', 'Traineeship', 'Apprentice', 'Apprenticeship',
  'Coop', 'Co-op', 'Cooperative', 'Co-operative', 'Graduate', 'Entry level',
  'Junior', 'Associate', 'Assistant', 'Analyst', 'Specialist', 'Coordinator',
  'Representative', 'Officer', 'Consultant', 'Advisor', 'Agent', 'Manager',
  'Director', 'Leader', 'Supervisor', 'Executive', 'Administrator', 'Engineer',
  'Developer', 'Designer', 'Architect', 'Scientist', 'Researcher', 'Technician',
  'Programmer', 'Analyst', 'Planner', 'Strategist', 'Coordinator', 'Consultant',
  'Is this role right for you? In this role you will:', 'Key responsibilities',
  'Key duties', 'Key requirements', 'Key qualifications', 'Key responsibilities',
  'Key', 'responsibilities', 'Key duties', 'Key requirements', 'Key qualifications',
  'Front-End Developer Intern', 'You’ll be responsible for: ', 'jobPostingPage','mainContent',
  "Whats in it for you", "What you'll do", "What you will do", "What you will be doing", "What you will be responsible for",
  "what you will bring", "What you'll bring", "What you will need", "What you will need to succeed", "What you will need to bring",
  "About the role", "About the job", "About the position", "About the opportunity", "About the role", "About the position", "About the opportunity",
  "About this role", "About this job", "About this position", "About this opportunity", "About this role", "About this job", "About this position", "About this opportunity",
];

app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = response.data;
    const $ = cheerio.load(html);

    let jobDescription = '';

    // Method 1: Search for relevant selectors
    for (const selector of relevantSelectors) {
      const elements = $(`#${selector}, .${selector}`);
      if (elements.length) {
        jobDescription = elements.text();
        break;
      }
    }

    // Method 2: Check content for relevant keywords
    if (!jobDescription) {
      $('div, section, article').each((index, element) => {
        const content = $(element).text().toLowerCase();
        if (relevantKeywords.some(keyword => content.includes(keyword))) {
          jobDescription = $(element).text();
          return false; // Break the loop
        }
      });
    }

    // Method 3: Look for headers and following content
    if (!jobDescription) {
      $('h1, h2, h3, h4, h5, h6').each((index, element) => {
        const headerText = $(element).text().toLowerCase();
        if (relevantKeywords.some(keyword => headerText.includes(keyword))) {
          jobDescription = $(element).nextUntil('h1, h2, h3, h4, h5, h6').text();
          return false; // Break the loop
        }
      });
    }

    // Method 4: Look for structured data
    if (!jobDescription) {
      const structuredData = $('script[type="application/ld+json"]');
      structuredData.each((index, element) => {
        try {
          const data = JSON.parse($(element).html());
          if (data['@type'] === 'JobPosting' && data.description) {
            jobDescription = data.description;
            return false; // Break the loop
          }
        } catch (e) {
          console.error('Error parsing structured data:', e);
        }
      });
    }

    if (!jobDescription) {
      return res.status(404).json({ error: 'Unable to find job description' });
    }

    // Clean and format the job description
    jobDescription = cleanText(jobDescription);
    jobDescription = jobDescription.replace(/[.#]\w+(-\w+)*(\s*\{[^}]*\})?/g, '');

    res.json({ jobDescription });
  } catch (error) {
    console.error('Error scraping job description:', error);
    if (error.response) {
      res.status(error.response.status).json({ error: `Failed to fetch the webpage: ${error.message}` });
    } else {
      res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
  }
});