import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const cartItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'MenuItem'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  notes: {
    type: String,
    default: '',
  },
  selectedSubcategory: {
    title: {
      type: String,
      required: true
    },
    quantity: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  },
  name: String,
  image: String,
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  vendorName: String,
  vendorPhone: String,
  vendorAddress: String,
  vendorLocation: {
    coordinates: {
      lat: Number,
      lng: Number
    },
    formatted: String
  },
  order: {
    type: Number,
    default: 0
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    sparse: true, // Allow multiple null values
  },
  password: {
    type: String,
    minLength: [8, "Password must have at least 8 characters."],
    maxLength: [32, "Password cannot have more than 32 characters."],
    select: false,
  },
  phone: {
    type: String,
    sparse: true, // Allow multiple null values
  },
  role: {
    type: String,
    enum: ["user", "vendor", "deliveryPartner", "admin"],
    default: "user",
  },
  profileImage: {
    type: String,
    default: null
  },
  accountVerified: { type: Boolean, default: false },
  verificationCode: Number,
  verificationCodeExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  address: String,
  isBlocked: { type: Boolean, default: false },
  blockReason: String,
  isApproved: {
    type: Boolean,
    default: function() {
      // Default to false for vendors, true for other roles
      return this.role !== 'vendor';
    }
  },
  location: {
    coordinates: {
      lat: Number,
      lng: Number
    },
    formattedAddress: String
  },
  cart: {
    items: [cartItemSchema],
    default: [],
  },
  // Favorites will be stored in separate collection for better performance
  // This field is kept for backward compatibility and quick access
  favoriteItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Favorite'
  }],
  // Delivery partner specific data
  deliveryPartnerData: {
    isAvailable: { type: Boolean, default: false },
    vehicleType: { type: String, enum: ['bike', 'scooter', 'bicycle', 'car'], default: 'bike' },
    vehicleNumber: String,
    licenseNumber: String,
    totalDeliveries: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound unique index for verified accounts only
userSchema.index(
  { email: 1, accountVerified: 1 },
  {
    unique: true,
    partialFilterExpression: {
      accountVerified: true,
      email: { $exists: true, $ne: null }
    }
  }
);

userSchema.index(
  { phone: 1, accountVerified: 1 },
  {
    unique: true,
    partialFilterExpression: {
      accountVerified: true,
      phone: { $exists: true, $ne: null }
    }
  }
);

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Password comparison method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Verification code generation
userSchema.methods.generateVerificationCode = function () {
  const verificationCode = Math.floor(100000 + Math.random() * 900000);
  this.verificationCode = verificationCode;
  this.verificationCodeExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return verificationCode;
};

// JWT generation
userSchema.methods.generateToken = function () {
  console.log('🔐 Generating JWT token...');
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
  console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE);

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign({
    id: this._id,
    role: this.role
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Password reset token
userSchema.methods.generateResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);