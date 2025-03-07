const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Cấu hình Middleware CORS
app.use(cors({
  origin: ["https://mamacare-demo.vercel.app"],  // Thêm domain frontend của bạn
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
  origin: ["https://mamacare-demo.vercel.app", "http://localhost:5001"], // Cho phép cả Localhost và FE trên Vercel
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Xử lý preflight request `OPTIONS`
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

app.use(express.json());

// Kết nối MongoDB
// ✅ Kết nối MongoDB
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Kết nối MongoDB thành công!"))
.catch((error) => console.error("❌ Lỗi kết nối MongoDB:", error));

// Route mặc định để kiểm tra server chạy
// ✅ Kiểm tra server đang chạy
app.get("/", (req, res) => {
  res.send("🎉 Mamacare Backend đang chạy trên Vercel!");
});

// Định nghĩa Schema và Model cho User
// ✅ Định nghĩa Schema và Model cho User
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
@@ -40,7 +51,7 @@ const UserSchema = new mongoose.Schema({

const User = mongoose.model("User", UserSchema);

// API Đăng ký tài khoản
// ✅ API Đăng ký tài khoản
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
@@ -64,7 +75,7 @@ app.post("/register", async (req, res) => {
  }
});

// API Đăng nhập
// ✅ API Đăng nhập
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
@@ -90,7 +101,7 @@ app.post("/login", async (req, res) => {
  }
});

// API Test Authentication
// ✅ API Test Authentication
app.get("/protected", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Không có token, quyền truy cập bị từ chối!" });
@@ -103,5 +114,34 @@ app.get("/protected", (req, res) => {
  }
});

// Export app thay vì chạy `app.listen()`
// ✅ API Gửi email xác nhận thanh toán
app.post("/send-payment-email", async (req, res) => {
  try {
    const { name, email, phone, message, servicesUse } = req.body;

    if (!email || !servicesUse) {
      return res.status(400).json({ message: "Email và gói dịch vụ là bắt buộc!" });
    }

    // ✅ Giả lập gửi email (Bạn cần thay bằng Nodemailer hoặc SendGrid nếu thực tế)
    console.log(`📧 Gửi email xác nhận đến: ${email}`);
    console.log(`Dịch vụ: ${servicesUse}`);
    console.log(`SĐT: ${phone}`);
    console.log(`Lời nhắn: ${message}`);

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
