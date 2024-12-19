const cors = require("cors");
const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000; // Use dynamic port for deployment

// Configure CORS
app.use(
    cors({
        origin: ["http://localhost:5173", "https://globaleducationadviser.netlify.app"], // Allow local and deployed frontend URLs
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
    })
);

app.use(bodyParser.json());

// OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
});

const sheets = google.sheets({ version: "v4", auth: oauth2Client });

// POST endpoint to save data to Google Sheets
app.post("/save-to-sheets", async (req, res) => {
    const { name, email, phone, queries } = req.body;

    try {
        // Validate required fields
        if (!name || !email) {
            throw new Error("Name and Email are required fields.");
        }

        // Append data to Google Sheets
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: "Sheet1!A1:D1",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[name, email, phone || "N/A", queries || "N/A"]],
            },
        });

        console.log("Google Sheets API Response:", response.data);
        res.status(200).send({ message: "Data saved successfully!" });
    } catch (error) {
        console.error("Error saving to Google Sheets:", error.message);
        res.status(500).send({
            error: error.message || "Failed to save data to Google Sheets.",
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
