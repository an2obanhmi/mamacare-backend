const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Cấu hình Middleware CORS (Fix lỗi preflight request)
app.use(cors({
  origin: ["https://mamacare-demo.vercel.app", "http://localhost:5001"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Middleware xử lý JSON
app.use(express.json());

// ✅ Xử lý preflight request `OPTIONS`
app.options("*", cors());

// ✅ Kết nối MongoDB
mongoose.connect(process.env.DB_URI, {
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
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
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

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Đăng nhập thành công!", token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// ✅ API Test Authentication
app.get("/protected", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Không có token, quyền truy cập bị từ chối!" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: "Truy cập thành công!", user: decoded });
  } catch (error) {
    res.status(401).json({ message: "Token không hợp lệ!" });
  }
});

// ✅ API Gửi email xác nhận thanh toán (Sửa lỗi CORS & Tối ưu)
app.post("/send-payment-email", async (req, res) => {
  try {
    const { name, email, phone, message, servicesUse } = req.body;

    if (!email || !servicesUse) {
      return res.status(400).json({ message: "Email và gói dịch vụ là bắt buộc!" });
    }

    console.log(`📧 Gửi email xác nhận đến: ${email}`);
    console.log(`Dịch vụ: ${servicesUse}`);
    console.log(`SĐT: ${phone}`);
    console.log(`Lời nhắn: ${message}`);

    // ✅ Giả lập gửi email bằng Nodemailer (Bỏ comment nếu cần sử dụng)
    // await sendEmail(email, `Xác nhận dịch vụ ${servicesUse}`, `Xin chào ${name}, bạn đã đặt dịch vụ ${servicesUse}.`);

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
