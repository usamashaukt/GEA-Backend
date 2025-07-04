const { google } = require("googleapis");

exports.handler = async (event) => {
    // Handle preflight requests for CORS
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204, // No Content
            headers: {
                "Access-Control-Allow-Origin": "https://huconsultants.netlify.app/", // Replace with your frontend domain
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: "",
        };
    }

    // Ensure the method is POST
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405, // Method Not Allowed
            headers: {
                "Access-Control-Allow-Origin": "https://huconsultants.netlify.app/",
            },
            body: JSON.stringify({ error: "Method not allowed" }),
        };
    }

    try {
        // Parse the request body
        const { name, email, phone, queries, lastQualification } = JSON.parse(event.body);

        // Validate required fields
        if (!name || !email || !lastQualification) {
            return {
                statusCode: 400, // Bad Request
                headers: {
                    "Access-Control-Allow-Origin": "https://huconsultants.netlify.app/",
                },
                body: JSON.stringify({ error: "Name, Email, and Last Qualification are required fields." }),
            };
        }

        // Initialize Google OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            process.env.REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN,
        });

        const sheets = google.sheets({ version: "v4", auth: oauth2Client });

        // Append data to Google Sheets
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: "Sheet1!A1:E1", // Update range to include the new column
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[name, email, phone || "N/A", queries || "N/A", lastQualification]],
            },
        });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "https://huconsultants.netlify.app/",
            },
            body: JSON.stringify({ message: "Data saved successfully!" }),
        };
    } catch (error) {
        console.error("Error saving to Google Sheets:", error.message);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "https://huconsultants.netlify.app/",
            },
            body: JSON.stringify({
                error: error.message || "Failed to save data to Google Sheets.",
            }),
        };
    }
};
