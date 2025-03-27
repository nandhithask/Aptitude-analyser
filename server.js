const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: "bspknp2miraf4yj8ufg5-mysql.services.clever-cloud.com",
    user: "uopdjrimuwnnyrbx", // Your MySQL user
    password: "CLoyJ2Gapy8pfjsvrMeM", // Your MySQL password
    database: "bspknp2miraf4yj8ufg5",
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("Connected to MySQL database");
});

// Signup Endpoint
app.post("/signup", async (req, res) => {
    const { email, username, password } = req.body;

    // Hashing password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";

    db.query(query, [email, username, hashedPassword], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "Email or username already exists." });
            }
            console.error("Signup database error:", err);
            return res.status(500).json({ message: "An unexpected error occurred." });
        }
        res.status(201).json({ message: "User registered successfully!" });
    });
});

// Login Endpoint
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and Password are required" });
    }

    const sql = "SELECT * FROM users WHERE username = ?";

    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error("Login database query error:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const user = results[0];
        try {
            const isPasswordMatch = await bcrypt.compare(password, user.password);

            if (!isPasswordMatch) {
                return res.status(401).json({ message: "Invalid username or password" });
            }

            res.status(200).json({ message: "Login successful", user });
        } catch (error) {
            console.error("Password comparison error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    });
});

// Get Questions Endpoint
app.get("/api/questions", (req, res) => {
    const count = parseInt(req.query.count) || 10;

    const query = `
        SELECT 
            question AS text,
            option_a AS optionA,
            option_b AS optionB,
            option_c AS optionC,
            option_d AS optionD,
            correct_answer AS correctAnswer,
            explanation
        FROM profit_loss_questions
        ORDER BY RAND()
        LIMIT ?
    `;

    db.query(query, [count], (err, results) => {
        if (err) {
            console.error("Database error while fetching questions:", err);
            return res.status(500).json({ error: "Failed to fetch questions", details: err });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "No questions found" });
        }

        const questions = results.map(q => ({
            id: q.id,
            text: q.text,
            options: [q.optionA, q.optionB, q.optionC, q.optionD],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,  //new func
        }));

        res.json({ questions });  // Fixed: Sending an object with 'questions' key
    });
});

// Start Server on Port 3001
app.listen(3000, () => {
    console.log("Server running on port 3000");
    console.log("Available endpoints:");
    console.log("- POST /signup");
    console.log("- POST /login");
    console.log("- GET /api/questions?count=10");
});
