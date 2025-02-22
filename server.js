const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5001"],  // Thêm domain frontend của bạn
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Kết nối MongoDB thành công!"))
.catch((error) => console.error("❌ Lỗi kết nối MongoDB:", error));

// Định nghĩa Schema và Model cho User
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

// API Đăng ký tài khoản
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra tài khoản đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại!" });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lưu vào DB
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// API Đăng nhập
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra tài khoản
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại!" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu!" });
    }

    // Tạo token JWT
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Đăng nhập thành công!", token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// API Test Authentication
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

// Server listening
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));
