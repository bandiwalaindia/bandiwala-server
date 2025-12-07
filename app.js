import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connection } from "./database/dbconnection.js";
import { errorMiddleware } from "./middleware/error.js";
import userRouter from "./routes/userrouter.js";
import cartRouter from "./routes/cartRouter.js";
import menuItemRouter from "./routes/menuItemRouter.js";
import vendorRouter from "./routes/vendorRouter.js";
import orderRouter from "./routes/orderRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import paymentRouter from "./routes/paymentRouter.js";
import favoriteRouter from "./routes/favoriteRouter.js";
import adminRouter from "./routes/adminRouter.js";
import deliveryPartnerRouter from "./routes/deliveryPartnerRouter.js";
import feedbackRouter from "./routes/feedbackRouter.js";
import promoCodeRouter from "./routes/promoCodeRouter.js";

// Load environment variables from config.env file
config({ path: "./.env" });

export const app = express();

console.log("🔧 Environment Variables Loaded:");
console.log("PORT:", process.env.PORT);
console.log(
  "MONGO_URL:",
  process.env.MONGODB_URI ? "✅ Configured" : "❌ Missing"
);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log(
  "JWT_SECRET:",
  process.env.JWT_SECRET ? "✅ Configured" : "❌ Missing"
);
console.log("SMTP_MAIL:", process.env.SMTP_MAIL);
console.log(
  "TWILIO_SID:",
  process.env.TWILIO_SID ? "✅ Configured" : "❌ Missing"
);

// ✅ CORRECT CORS middleware - Allow all origins for mobile development
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads for profile images only (user-uploaded content)
app.use(
  "/uploads",
  express.static("public/uploads", {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=31536000");
    },
  })
);

// Test endpoints
app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend server is running and connected!",
    timestamp: new Date().toISOString(),
    emailConfig: {
      smtpHost: process.env.SMTP_HOST,
      smtpService: process.env.SMTP_SERVICE,
      smtpPort: process.env.SMTP_PORT,
      smtpMail: process.env.SMTP_MAIL,
      smtpPassConfigured: !!process.env.SMTP_PASS,
    },
  });
});

app.get("/api/profile-test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Profile endpoint is working!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/cart-test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cart endpoint is working!",
    items: [],
    timestamp: new Date().toISOString(),
  });
});

// Email testing endpoint
app.post("/api/test-email", async (req, res) => {
  try {
    const { sendEmail, testEmailConnection } = await import(
      "./utils/sendemail.js"
    );

    console.log("📧 Email test endpoint called");

    // Test SMTP connection first
    const connectionTest = await testEmailConnection();
    console.log("Connection test result:", connectionTest);

    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        message: "SMTP connection failed",
        error: connectionTest.error,
        timestamp: new Date().toISOString(),
      });
    }

    // Try to send a test email
    const testEmail = req.body.email || "gurramkarthik2006@gmail.com";
    const testMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4CAF50;">Email Test Successful!</h2>
        <p>This is a test email from your Bandiwala backend server.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Server:</strong> Running on port ${process.env.PORT}</p>
        <p>If you received this email, your email configuration is working correctly!</p>
      </div>
    `;

    const emailResult = await sendEmail({
      email: testEmail,
      subject: "Bandiwala Email Test",
      message: testMessage,
    });

    if (emailResult) {
      res.status(200).json({
        success: true,
        message: "Test email sent successfully!",
        emailSent: true,
        messageId: emailResult.messageId,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Email sending failed",
        emailSent: false,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Email test endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "Email test failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/api/clear-user", async (req, res) => {
  try {
    const { User } = await import("./models/usermodel.js");

    const result = await User.deleteMany({
      $or: [
        { email: "gurramkarthik2005@gmail.com" },
        { email: "gurramkarthik006@gmail.com" },
        { phone: "+918688660055" },
        { phone: "8688660055" },
      ],
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} users with matching email/phone`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Register API routes
app.use("/api/users", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/menu-items", menuItemRouter);
app.use("/api/vendors", vendorRouter);
app.use("/api/orders", orderRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/admin", adminRouter);
app.use("/api/delivery-partners", deliveryPartnerRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/promo-codes", promoCodeRouter);

// Connect DB
connection();

// Start order status monitoring
import orderStatusService from "./services/orderStatusService.js";
orderStatusService.startStatusMonitoring();

// Error middleware
app.use(errorMiddleware);
