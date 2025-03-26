const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root", // Change if needed
    password: "nan@2004", // Change if needed
    database: "aptitude"
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("Connected to MySQL database");
});

// Signup Endpoint
app.post("/signup", async(req, res) => {
    const { email, username, password } = req.body;

    // Hashing password (assuming bcrypt is used)
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";

    db.query(query, [email, username, hashedPassword], (err, result) => {
        if (err) {
            // Check for duplicate entry error (MySQL Error Code: ER_DUP_ENTRY)
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "Email or username already exists." });
            }
            console.error(err); // Log any other errors
            return res.status(500).json({ message: "An unexpected error occurred." });
        }

        // Successful signup
        res.status(201).json({ message: "User registered successfully!" });
    });
});


// Handle Login Request
// Handle Login Request (Secure)
app.post("/login", async(req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and Password are required" });
    }

    const sql = "SELECT * FROM users WHERE username = ?";

    db.query(sql, [username], async(err, results) => {
        if (err) {
            console.error(" Database query error:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = results[0];

        try {
            // Compare hashed password using bcrypt
            const isPasswordMatch = await bcrypt.compare(password, user.password);

            if (!isPasswordMatch) {
                return res.status(401).json({ message: "Invalid username or password" });
            }

            // ✅ Successful login
            res.status(200).json({ message: "Login successful", user });

        } catch (error) {
            console.error(" Password comparison error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    });
});

app.get("/api/getQuestions", (req, res) => {
    const query = "SELECT * FROM questions ORDER BY RAND() LIMIT 10"; // Randomly select 10 questions
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});




// Start Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});