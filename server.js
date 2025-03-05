const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Cấu hình Middleware CORS
app.use(cors({
  origin: ["http://localhost:5001", "https://mamacare-demo.vercel.app"], 
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

// ✅ API kiểm tra server đang chạy
app.get("/", (req, res) => {
  res.send("🎉 Mamacare Backend đang chạy trên Vercel!");
});

// ✅ API Đăng ký
app.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email đã tồn tại!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, username });
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
    if (!user) return res.status(400).json({ message: "Email không tồn tại!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu!" });

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Đăng nhập thành công!", token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// ✅ Quan trọng: Thêm `app.listen()` khi chạy trên Vercel
app.listen(PORT, () => {
  console.log(`🚀 Server chạy trên http://localhost:${PORT}`);
});
