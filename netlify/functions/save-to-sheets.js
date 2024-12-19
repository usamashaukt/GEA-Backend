const { google } = require("googleapis");

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method not allowed" }),
        };
    }

    const { name, email, phone, queries } = JSON.parse(event.body);

    try {
        if (!name || !email) {
            throw new Error("Name and Email are required fields.");
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            process.env.REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN,
        });

        const sheets = google.sheets({ version: "v4", auth: oauth2Client });

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: "Sheet1!A1:D1",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[name, email, phone || "N/A", queries || "N/A"]],
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Data saved successfully!" }),
        };
    } catch (error) {
        console.error("Error saving to Google Sheets:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || "Failed to save data to Google Sheets.",
            }),
        };
    }
};
