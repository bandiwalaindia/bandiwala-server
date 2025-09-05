import ErrorHandler from "../middleware/error.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { User } from "../models/usermodel.js";
import { sendEmail } from "../utils/sendemail.js";
import twilio from "twilio";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Initialize Twilio client when needed
const getTwilioClient = () => {
  return twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
};

export const register = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, phone, password, verificationMethod, role } = req.body;
    if (!name || !email || !phone || !password || !verificationMethod) {
      return next(new ErrorHandler("All fields are required.", 400));
    }
    function validatePhoneNumber(phone) {
      const phoneRegex = /^\+91[0-9]{10}$/;
      return phoneRegex.test(phone);
    }

    if (!validatePhoneNumber(phone)) {
      return next(new ErrorHandler("Invalid phone number.", 400));
    }

    // Check for verified users first
    const existingVerifiedUser = await User.findOne({
      $or: [
        {
          email,
          accountVerified: true,
        },
        {
          phone,
          accountVerified: true,
        },
      ],
    });

    if (existingVerifiedUser) {
      return next(new ErrorHandler("Phone or Email is already used.", 400));
    }

    // Check for existing unverified user with the same email
    const existingUnverifiedUser = await User.findOne({
      email,
      accountVerified: false,
    });

    if (existingUnverifiedUser) {
      // User exists but is not verified - resend OTP instead of creating duplicate
      console.log(`Found existing unverified user with email: ${email}`);

      // Update user data if provided (in case user wants to change name, phone, etc.)
      existingUnverifiedUser.name = name;
      existingUnverifiedUser.phone = phone;
      if (password) {
        existingUnverifiedUser.password = password;
      }
      if (
        role &&
        ["user", "vendor", "deliveryPartner", "admin"].includes(role)
      ) {
        existingUnverifiedUser.role = role;
      }

      // Generate new verification code
      const verificationCode =
        await existingUnverifiedUser.generateVerificationCode();
      await existingUnverifiedUser.save();

      console.log(`Resending OTP to existing unverified user: ${email}`);

      // Send verification code with a message indicating this is a resend
      try {
        console.log(`Attempting to send OTP via ${verificationMethod}`);
        console.log(`Verification code: ${verificationCode}`);

        // Development mode: Always log OTP to console for testing
        console.log("=".repeat(50));
        console.log("🔐 DEVELOPMENT OTP FOR EXISTING USER 🔐");
        console.log(`📧 Email: ${email}`);
        console.log(`📱 Phone: ${phone}`);
        console.log(`🔢 OTP: ${verificationCode}`);
        console.log(`⏰ Expires in: 10 minutes`);
        console.log("=".repeat(50));

        if (verificationMethod === "email") {
          console.log(`Sending email OTP to existing user: ${email}`);
          const message = generateEmailTemplate(verificationCode);
          const emailResult = await sendEmail({
            email,
            subject: "Your Verification Code",
            message,
          });

          if (emailResult) {
            console.log("Email sent successfully to existing user");
            res.status(200).json({
              success: true,
              message: `Account found! New verification email sent to ${email}. Please verify your account.`,
            });
          } else {
            console.log(
              "Email sending failed for existing user - but registration successful"
            );
            res.status(200).json({
              success: true,
              message: `Account found! Check server console for OTP (Email: ${email}). OTP: ${verificationCode}`,
            });
          }
        } else if (verificationMethod === "phone") {
          console.log(`Sending SMS OTP to existing user: ${phone}`);

          // Check if we have valid Twilio credentials and purchased phone number
          if (
            !process.env.TWILIO_SID ||
            !process.env.TWILIO_AUTH_TOKEN ||
            !process.env.TWILIO_PHONE_NUMBER ||
            process.env.TWILIO_SID === "YOUR_ACTUAL_TWILIO_ACCOUNT_SID" ||
            process.env.TWILIO_PHONE_NUMBER === "+917416467890"
          ) {
            console.log(
              "⚠️  Twilio credentials not configured - using development mode for existing user"
            );
            console.log("📱 SMS would be sent to:", phone);
            console.log(
              "📝 SMS content:",
              `Your Bandiwala verification code is: ${verificationCode}. This code will expire in 10 minutes.`
            );

            res.status(200).json({
              success: true,
              message: `Development Mode: Account found! OTP generated for ${phone}. Check server console for OTP: ${verificationCode}`,
            });
          } else {
            const smsResult = await client.messages.create({
              body: `Your Bandiwala verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: phone,
            });

            console.log(
              "SMS sent successfully to existing user:",
              smsResult.sid
            );
            res.status(200).json({
              success: true,
              message: `Account found! New OTP sent to ${phone}. Please verify your account.`,
            });
          }
        } else {
          return res.status(500).json({
            success: false,
            message: "Invalid verification method.",
          });
        }
      } catch (error) {
        console.error(
          "Error sending verification code to existing user:",
          error
        );
        return res.status(500).json({
          success: false,
          message: "Failed to send verification code. Please try again.",
        });
      }
      return;
    }

    // Check registration attempts for phone number
    const registerationAttemptsByUser = await User.find({
      $or: [
        { phone, accountVerified: false },
        { email, accountVerified: false },
      ],
    });

    if (registerationAttemptsByUser.length > 3) {
      return next(
        new ErrorHandler(
          "You have exceeded the maximum number of attempts (3). Please try again after an hour.",
          400
        )
      );
    }

    // Create new user
    const userData = {
      name,
      email,
      phone,
      password,
    };

    // Add role if provided and valid
    if (role && ["user", "vendor", "deliveryPartner", "admin"].includes(role)) {
      userData.role = role;
    }

    const user = await User.create(userData);
    const verificationCode = await user.generateVerificationCode();
    await user.save();
    sendVerificationCode(
      verificationMethod,
      verificationCode,
      name,
      email,
      phone,
      res
    );
  } catch (error) {
    next(error);
  }
});

async function sendVerificationCode(
  verificationMethod,
  verificationCode,
  name,
  email,
  phone,
  res
) {
  try {
    console.log(`Attempting to send OTP via ${verificationMethod}`);
    console.log(`Verification code: ${verificationCode}`);

    // Development mode: Always log OTP to console for testing
    console.log("=".repeat(50));
    console.log("🔐 DEVELOPMENT OTP FOR TESTING 🔐");
    console.log(`📧 Email: ${email}`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔢 OTP: ${verificationCode}`);
    console.log(`⏰ Expires in: 10 minutes`);
    console.log("=".repeat(50));

    if (verificationMethod === "email") {
      console.log(`Sending email OTP to: ${email}`);
      const message = generateEmailTemplate(verificationCode);
      const emailResult = await sendEmail({
        email,
        subject: "Your Verification Code",
        message,
      });

      if (emailResult) {
        console.log("Email sent successfully");
        res.status(200).json({
          success: true,
          message: `Verification email successfully sent to ${email}`,
        });
      } else {
        console.log("Email sending failed - but registration successful");
        console.log(
          "🔐 DEVELOPMENT MODE: Email not configured, but user created successfully"
        );
        console.log(`📧 Email: ${email}`);
        console.log(`🔢 OTP: ${verificationCode}`);
        console.log("⏰ Use this OTP to verify your account");

        // In development, still return success but with a different message
        res.status(200).json({
          success: true,
          message: `Registration successful! Check server console for OTP (Email: ${email}). OTP: ${verificationCode}`,
        });
      }
    } else if (verificationMethod === "phone") {
      console.log(`Sending SMS OTP to: ${phone}`);
      console.log(`Using Twilio number: ${process.env.TWILIO_PHONE_NUMBER}`);

      // Check if we have valid Twilio credentials and purchased phone number
      if (
        !process.env.TWILIO_SID ||
        !process.env.TWILIO_AUTH_TOKEN ||
        !process.env.TWILIO_PHONE_NUMBER ||
        process.env.TWILIO_SID === "YOUR_ACTUAL_TWILIO_ACCOUNT_SID" ||
        process.env.TWILIO_PHONE_NUMBER === "+917416467890"
      ) {
        console.log(
          "⚠️  Twilio credentials not configured - using development mode"
        );
        console.log("📱 SMS would be sent to:", phone);
        console.log(
          "📝 SMS content:",
          `Your Bandiwala verification code is: ${verificationCode}. This code will expire in 10 minutes.`
        );

        res.status(200).json({
          success: true,
          message: `OTP generated for ${phone}. Check server console for OTP: ${verificationCode}`,
        });
      } else {
        // Send SMS with actual Twilio
        const client = getTwilioClient();
        const smsResult = await client.messages.create({
          body: `Your Bandiwala verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        });

        console.log("SMS sent successfully:", smsResult.sid);
        res.status(200).json({
          success: true,
          message: `OTP sent to ${phone}.`,
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: "Invalid verification method.",
      });
    }
  } catch (error) {
    console.error("OTP sending error:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      status: error.status,
      moreInfo: error.moreInfo,
    });

    let errorMessage = "Verification code failed to send.";

    // Provide specific error messages based on the error type
    if (error.code === 21211) {
      errorMessage =
        "Invalid phone number format. Please check the phone number.";
    } else if (error.code === 21608) {
      errorMessage =
        "The phone number is not verified with Twilio. Please use a verified number.";
    } else if (error.code === 21614) {
      errorMessage = "Invalid Twilio phone number.";
    } else if (
      verificationMethod === "email" &&
      error.message?.includes("auth")
    ) {
      errorMessage =
        "Email authentication failed. Please check email configuration.";
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}

function generateEmailTemplate(verificationCode) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 16px; color: #333;">Dear User,</p>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          ${verificationCode}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
      <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Thank you,<br>Bandiwala Team</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
      </footer>
    </div>
  `;
}

// Dedicated resend OTP function
export const resendOTP = catchAsyncError(async (req, res, next) => {
  try {
    const { email, phone, verificationMethod } = req.body;

    if (!email || !phone || !verificationMethod) {
      return next(
        new ErrorHandler(
          "Email, phone, and verification method are required.",
          400
        )
      );
    }

    function validatePhoneNumber(phone) {
      const phoneRegex = /^\+91[0-9]{10}$/;
      return phoneRegex.test(phone);
    }

    if (!validatePhoneNumber(phone)) {
      return next(new ErrorHandler("Invalid phone number.", 400));
    }

    // Find the unverified user
    const user = await User.findOne({
      email,
      phone,
      accountVerified: false,
    });

    if (!user) {
      return next(
        new ErrorHandler(
          "No unverified account found with this email and phone. Please register first.",
          404
        )
      );
    }

    // Generate new verification code
    const verificationCode = await user.generateVerificationCode();
    await user.save();

    console.log(`Resending OTP to user: ${email}, ${phone}`);

    // Send verification code
    sendVerificationCode(
      verificationMethod,
      verificationCode,
      user.name,
      email,
      phone,
      res
    );
  } catch (error) {
    next(error);
  }
});

export const verifyOTP = catchAsyncError(async (req, res, next) => {
  const { email, otp, phone } = req.body;

  function validatePhoneNumber(phone) {
    const phoneRegex = /^\+91[0-9]{10}$/;
    return phoneRegex.test(phone);
  }

  if (!validatePhoneNumber(phone)) {
    console.log("hello");
    return next(new ErrorHandler("Invalid phone number.", 400));
  }

  try {
    const userAllEntries = await User.find({
      $or: [
        {
          email,
          accountVerified: false,
        },
        {
          phone,
          accountVerified: false,
        },
      ],
    }).sort({ createdAt: -1 });

    if (!userAllEntries || userAllEntries.length === 0) {
      return next(new ErrorHandler("User not found.", 404));
    }

    let user;

    if (userAllEntries.length > 1) {
      user = userAllEntries[0];

      await User.deleteMany({
        _id: { $ne: user._id },
        $or: [
          { phone, accountVerified: false },
          { email, accountVerified: false },
        ],
      });
    } else {
      user = userAllEntries[0];
    }

    if (user.verificationCode !== Number(otp)) {
      return next(new ErrorHandler("Invalid OTP.", 400));
    }

    const currentTime = Date.now();

    const verificationCodeExpire = new Date(
      user.verificationCodeExpire
    ).getTime();
    console.log(currentTime);
    console.log(verificationCodeExpire);
    if (currentTime > verificationCodeExpire) {
      return next(new ErrorHandler("OTP Expired.", 400));
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save({ validateModifiedOnly: true });

    sendToken(user, 200, "Account Verified.", res);
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return next(
      new ErrorHandler(`Internal Server Error: ${error.message}`, 500)
    );
  }
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, phone, password } = req.body;

  // Check if either email or phone is provided along with password
  if ((!email && !phone) || !password) {
    return next(
      new ErrorHandler("Email/Phone and password are required.", 400)
    );
  }

  // Validate phone number format if phone is provided
  if (phone) {
    function validatePhoneNumber(phone) {
      const phoneRegex = /^\+91[0-9]{10}$/;
      return phoneRegex.test(phone);
    }

    if (!validatePhoneNumber(phone)) {
      return next(
        new ErrorHandler("Invalid phone number format. Use +91XXXXXXXXXX", 400)
      );
    }
  }

  // Build query to find user by email or phone
  const query = { accountVerified: true };
  if (email) {
    query.email = email;
  } else if (phone) {
    query.phone = phone;
  }

  const user = await User.findOne(query).select("+password");

  if (!user) {
    // Check if user exists but is not verified
    const unverifiedQuery = {};
    if (email) {
      unverifiedQuery.email = email;
    } else if (phone) {
      unverifiedQuery.phone = phone;
    }

    const unverifiedUser = await User.findOne(unverifiedQuery);

    if (unverifiedUser && !unverifiedUser.accountVerified) {
      return next(
        new ErrorHandler("Please verify your account first to login.", 400)
      );
    }

    // If no user found at all, suggest registration
    if (email) {
      return next(
        new ErrorHandler(
          "No account found with this email. Please register to create an account.",
          404
        )
      );
    } else {
      return next(
        new ErrorHandler(
          "No account found with this phone number. Please register to create an account.",
          404
        )
      );
    }
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Incorrect password. Please try again.", 400));
  }

  // Check if user is blocked
  if (user.isBlocked) {
    return next(
      new ErrorHandler(
        "Your account has been blocked. Please contact support.",
        403
      )
    );
  }

  // Check if vendor is approved
  if (user.role === "vendor" && !user.isApproved) {
    return next(
      new ErrorHandler(
        "Your vendor account is pending admin approval. Please wait for approval before accessing the system.",
        403
      )
    );
  }

  sendToken(user, 200, "User logged in successfully.", res);
});

export const logout = catchAsyncError(async (req, res, next) => {
  console.log("Logout request received");

  // Set cookie options for clearing
  const cookieOptions = {
    expires: new Date(Date.now()),
    httpOnly: true,
    path: "/",
    // In development, we need to set sameSite to 'Lax' to allow cookies to be sent in cross-site requests
    // In production, it should be 'None' with secure: true
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    // Only set secure: true in production or if explicitly configured
    secure: process.env.NODE_ENV === "production",
  };

  console.log("Clearing token cookie with options:", {
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
  });

  res.status(200).cookie("token", "", cookieOptions).json({
    success: true,
    message: "Logged out successfully.",
  });
});

export const getUser = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    accountVerified: true,
  });
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }
  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Utility function to properly construct URLs without double slashes
  const constructUrl = (baseUrl, path) => {
    if (!baseUrl || !path) return "";

    // Remove all trailing slashes from base URL
    let cleanBaseUrl = baseUrl.replace(/\/+$/, "");

    // Remove all leading slashes from path
    let cleanPath = path.replace(/^\/+/, "");

    // Construct the URL with exactly one slash
    let finalUrl = `${cleanBaseUrl}/${cleanPath}`;

    // Final cleanup: replace any sequence of 2+ slashes with single slash,
    // but preserve the :// in protocol
    finalUrl = finalUrl.replace(/([^:])\/\/+/g, "$1/");

    return finalUrl;
  };

  // Get frontend URL
  let frontendUrl = process.env.FRONTEND_URL;

  // If no frontend URL is set, try to determine from the request
  if (!frontendUrl) {
    const protocol = req.get("X-Forwarded-Proto") || req.protocol || "http";
    const host =
      req.get("X-Forwarded-Host") || req.get("Host") || "localhost:3111";
    frontendUrl = `${protocol}://${host}`;
  }

  const resetPasswordUrl = constructUrl(
    frontendUrl,
    `/password/reset/${resetToken}`
  );

  console.log("🔧 Password Reset URL Debug:");
  console.log("  - FRONTEND_URL env var:", process.env.FRONTEND_URL);
  console.log("  - Final frontend URL:", frontendUrl);
  console.log("  - Reset token:", resetToken);
  console.log("  - Final reset URL:", resetPasswordUrl);

  // Additional validation to catch any remaining double slashes
  if (resetPasswordUrl.includes("//") && !resetPasswordUrl.includes("://")) {
    console.error("❌ WARNING: Double slash detected in reset URL!");
    console.error("   Original URL:", resetPasswordUrl);
    // Force fix any remaining double slashes
    const fixedUrl = resetPasswordUrl.replace(/([^:])\/\/+/g, "$1/");
    console.error("   Fixed URL:", fixedUrl);
  }

  const message = `Your Reset Password Token is:- \n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it.`;

  try {
    sendEmail({
      email: user.email,
      subject: "MERN AUTHENTICATION APP RESET PASSWORD",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new ErrorHandler(
        error.message ? error.message : "Cannot send reset password token.",
        500
      )
    );
  }
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "Reset password token is invalid or has been expired.",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler("Password & confirm password do not match.", 400)
    );
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendToken(user, 200, "Reset Password Successfully.", res);
});

export const updateProfile = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, address, location } = req.body;

    // Find the user
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Update user fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (address) user.address = address;

    // Update location if provided
    if (location) {
      user.location = {
        coordinates: location.coordinates || user.location?.coordinates,
        formattedAddress:
          location.formattedAddress || user.location?.formattedAddress,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
});

// Upload profile photo
export const uploadProfilePhoto = catchAsyncError(async (req, res, next) => {
  try {
    console.log("Upload photo request received");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    console.log("Request files:", req.files);
    console.log("Request headers:", req.headers);

    if (!req.file) {
      console.log("No file found in request");
      return next(new ErrorHandler("No file uploaded", 400));
    }

    console.log("File details:", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    // Find the user
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Delete old profile image if it exists
    if (user.profileImage) {
      const oldImagePath = path.join(
        process.cwd(),
        "public",
        user.profileImage
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update user with new profile image path
    const imagePath = `/uploads/profiles/${req.file.filename}`;
    user.profileImage = imagePath;
    await user.save();

    console.log("Profile photo updated successfully:", imagePath);

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      user,
      imageUrl: imagePath,
    });
  } catch (error) {
    console.error("Error in uploadProfilePhoto:", error);
    // If there's an error, delete the uploaded file
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
});

// Admin-only function to get all users
export const getAllUsers = catchAsyncError(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role;
    const search = req.query.search;
    const status = req.query.status;

    let query = {};

    if (role && role !== "all") {
      query.role = role;
    }

    if (status === "blocked") {
      query.isBlocked = true;
    } else if (status === "active") {
      query.isBlocked = { $ne: true };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password -verificationCode -resetPasswordToken")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: page < Math.ceil(totalUsers / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export const blockUser = catchAsyncError(async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    user.isBlocked = true;
    user.blockReason = reason;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isBlocked: user.isBlocked,
        blockReason: user.blockReason,
      },
    });
  } catch (error) {
    next(error);
  }
});

export const unblockUser = catchAsyncError(async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    user.isBlocked = false;
    user.blockReason = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    next(error);
  }
});

export const getUserOrderHistory = catchAsyncError(async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNext: page < Math.ceil(totalOrders / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Delete user's orders, reviews, etc. (optional - you might want to keep for records)
    // await Order.deleteMany({ userId });
    // await Review.deleteMany({ userId });

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});
