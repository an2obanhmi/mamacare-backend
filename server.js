const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer"); // 📩 Thêm Nodemailer để gửi email

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Cấu hình Middleware CORS
app.use(cors({
  origin: ["https://mamacare-demo.vercel.app", "http://localhost:5001"], // Cho phép frontend gọi API
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Xử lý preflight request `OPTIONS`
app.options("*", cors());

app.use(express.json());

// ✅ Kết nối MongoDB
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Kết nối MongoDB thành công!"))
.catch((error) => console.error("❌ Lỗi kết nối MongoDB:", error));

// ✅ API Test Server
app.get("/", (req, res) => {
  res.send("🎉 Mamacare Backend đang chạy trên Vercel!");
});

// ✅ API Gửi email xác nhận thanh toán bằng Gmail (Nodemailer)
app.post("/send-payment-email", async (req, res) => {
  try {
    const { name, email, phone, message, servicesUse } = req.body;

    if (!email || !servicesUse) {
      return res.status(400).json({ message: "Email và gói dịch vụ là bắt buộc!" });
    }

    // ✅ Cấu hình Nodemailer với Gmail
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // 📩 Email của bạn (cần bật "Less Secure Apps" nếu dùng tài khoản cá nhân)
        pass: process.env.GMAIL_PASS  // 🔑 Mật khẩu ứng dụng (App Password)
      }
    });

    let mailOptions = {
      from: `"Mamacare Support" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Xác nhận đăng ký dịch vụ",
      html: `
        <h3>Xin chào ${name},</h3>
        <p>Bạn đã đăng ký gói dịch vụ <strong>${servicesUse}</strong>.</p>
        <p>Chúng tôi sẽ liên hệ với bạn qua số điện thoại: <strong>${phone}</strong></p>
        <p>Lời nhắn của bạn: <i>${message || "Không có lời nhắn"}</i></p>
        <br>
        <p>Trân trọng,</p>
        <p><strong>Đội ngũ Mamacare</strong></p>
      `
    };

    // ✅ Gửi email
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email đã gửi thành công đến: ${email}`);

    res.json({ message: "✅ Email xác nhận đã được gửi!" });
  } catch (error) {
    console.error("❌ Lỗi khi gửi email:", error);
    res.status(500).json({ message: "Lỗi server khi gửi email" });
  }
});

// ✅ Chạy server trên localhost (Chỉ khi chạy local)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server chạy trên http://localhost:${PORT}`);
  });
}

// ✅ Xuất module cho Vercel
module.exports = app;
