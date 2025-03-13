  const express = require("express");
  const mongoose = require("mongoose");
  const cors = require("cors");
  const bcrypt = require("bcrypt");
  const jwt = require("jsonwebtoken");
  const dotenv = require("dotenv");
  const nodemailer = require("nodemailer"); // ✅ Thêm Nodemailer để gửi email

  dotenv.config();
  const app = express();
  const PORT = process.env.PORT || 5000;

  // ✅ Cấu hình Middleware CORS (Fix lỗi preflight request)
  app.use(
    cors({
      origin: ["https://mamacare-demo.vercel.app", "http://localhost:5001"], // ✅ Fix lỗi cấu hình
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // ✅ Xử lý preflight request `OPTIONS`
  app.options("*", cors());

  app.use(express.json());

  // ✅ Kết nối MongoDB
  mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ Kết nối MongoDB thành công!"))
    .catch((error) => console.error("❌ Lỗi kết nối MongoDB:", error));

  // ✅ Kiểm tra server đang chạy
  app.get("/", (req, res) => {
    res.send("🎉 Mamacare Backend đang chạy trên Vercel!");
  });

  // ✅ Định nghĩa Schema và Model cho User
  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  });

  const User = mongoose.model("User", UserSchema);

  // ✅ API Đăng ký tài khoản
  app.post("/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email đã tồn tại!" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();

      res.status(201).json({ message: "Đăng ký thành công!" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server!" });
    }
  });

  // ✅ API Đăng nhập
  app.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Email không tồn tại!" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Sai mật khẩu!" });
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Đăng nhập thành công!",
        token,
        username: user.username,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server!" });
    }
  });

  // ✅ API Gửi email xác nhận thanh toán bằng Gmail
  app.post("/send-payment-email", async (req, res) => {
    try {
      const { name, email, phone, message, servicesUse } = req.body;

      if (!email || !servicesUse) {
        return res
          .status(400)
          .json({ message: "Email và gói dịch vụ là bắt buộc!" });
      }

      // ✅ Cấu hình Nodemailer với Gmail
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER, // 📩 Email gửi
          pass: process.env.EMAIL_PASS, // 🔑 Mật khẩu ứng dụng (App Password)
        },
      });

      let mailOptions = {
        from: `"Mamacare Support" <${process.env.EMAIL_USER}>`,
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
        `,
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
