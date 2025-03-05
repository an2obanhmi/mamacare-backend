const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Cập nhật Middleware CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ Thêm middleware `cors()` đúng
app.use(cors({
  origin: ["http://localhost:5001", "https://mamacare-demo.vercel.app"], // Đảm bảo đúng URL Frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

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

// ✅ Định nghĩa API Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email không tồn tại!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu!" });

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Đăng nhập thành công!", token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// ✅ Xuất app thay vì chạy `app.listen()`
module.exports = app;
