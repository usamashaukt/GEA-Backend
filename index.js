const cors = require("cors");
const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

// Configure CORS
app.use(
    cors({
        origin: ["http://localhost:5173", "https://https://huconsultants.netlify.app"],
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    })
);

// Parse JSON request bodies
app.use(bodyParser.json());

// OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI,
    process.env.react_APP_REDIRECT_URI
);
oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
});
const sheets = google.sheets({ version: "v4", auth: oauth2Client });

// POST endpoint to save data to Google Sheets
app.post("/save-to-sheets", async (req, res, next) => {
    try {
        const { name, email, phone, queries, lastQualification } = req.body;

        // Validate required fields
        if (!name || !email || !lastQualification) {
            throw new Error("Name, Email, and Last Qualification are required fields.");
        }

        // Append data to Google Sheets
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: "Sheet1!A1:E1", // Update range to include the new column
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [
                    [
                        name,
                        email,
                        phone || "N/A",
                        queries || "N/A",
                        lastQualification, // Include last qualification
                    ],
                ],
            },
        });
        console.log("Google Sheets API Response:", response.data);
        res.status(200).send({ message: "Data saved successfully!" });
    } catch (error) {
        console.error("Error saving to Google Sheets:", error.message);
        next(error);
    }
});

// Centralized error handling
app.use((err, req, res, next) => {
    res.status(500).send({ error: "INTERNAL_SERVER_ERROR", message: err.message });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
