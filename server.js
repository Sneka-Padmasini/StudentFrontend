********* require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const OpenAI = require("openai"); // ✅ new SDK

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Email Route
app.post("/send-email", async (req, res) => {
  const { name, email, phone, enquiry } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: ["shabrinbegum15102001@gmail.com", "shabrinbegum151001@gmail.com"],
    replyTo: email,
    subject: `New enquiry from ${name}`,
    text: `Name: ${name}
Email: ${email}
Phone: ${phone}
Enquiry:
${enquiry}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent to inbox");
    res.status(200).send({ message: "Email sent successfully" });
  } catch (error) {
    console.error("❌ Email send error:", error);
    res.status(500).send({ message: "Failed to send email" });
  }
});

// ✅ Chat Route using OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1", // ✅ REQUIRED for OpenRouter
});

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo", // ✅ VALID model for OpenRouter
      messages,
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("❌ Chat error:", error?.response?.data || error.message);
    res.status(500).json({ error: "AI response failed" });
  }
});

app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});
