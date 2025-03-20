const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const router = express.Router();
const prisma = new PrismaClient();

// Register Route
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. التحقق من إدخال البيانات
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 2. التأكد من عدم وجود المستخدم بالفعل
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ Username: username }, { Email: email }],
            },
        });

        if (existingUser) {
            return res.status(400).json({ message: "Username or Email already exists" });
        }

        // 3. تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. إنشاء المستخدم في قاعدة البيانات
        const newUser = await prisma.user.create({
            data: {
                Username: username,
                Email: email,
                Password: hashedPassword,
            },
        });

        // 5. إنشاء توكن JWT
        const token = jwt.sign({ userId: newUser.UserID }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        // 6. إرسال الاستجابة
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser.UserID,
                username: newUser.Username,
                email: newUser.Email,
            },
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
