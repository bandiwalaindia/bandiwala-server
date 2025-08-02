import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import { User } from "../models/usermodel.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  // Check for token in cookies first
  let token = req.cookies.token;

  // If no token in cookies, check Authorization header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Using token from Authorization header:', token.substring(0, 10) + '...');
  }

  if (!token) {
    return next(new ErrorHandler("User is not authenticated.", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add timeout for database operations
    const findUserWithTimeout = () => {
      return Promise.race([
        User.findById(decoded.id),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database operation timeout')), 5000)
        )
      ]);
    };

    req.user = await findUserWithTimeout();

    if (!req.user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    next();
  } catch (error) {
    console.error('JWT verification error:', error);

    // Handle specific database connection errors
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out') || error.message.includes('Database operation timeout')) {
      console.error('Database connection issue in auth middleware:', error.message);
      return next(new ErrorHandler("Database connection issue. Please try again later.", 503));
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ErrorHandler("Invalid or expired token. Please login again.", 401));
    }

    return next(new ErrorHandler("Authentication failed. Please try again.", 401));
  }
});

// Role-based access control middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler("User not authenticated.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler(`Access denied. Required role: ${roles.join(' or ')}`, 403));
    }

    next();
  };
};

// Specific role middleware functions
export const isAdmin = (req, res, next) => {
  return authorizeRoles("admin")(req, res, next);
};

export const isVendor = (req, res, next) => {
  return authorizeRoles("vendor")(req, res, next);
};

export const isDeliveryPartner = (req, res, next) => {
  return authorizeRoles("deliveryPartner")(req, res, next);
};

export const isUser = (req, res, next) => {
  return authorizeRoles("user")(req, res, next);
};

export const isVendorOrAdmin = (req, res, next) => {
  return authorizeRoles("vendor", "admin")(req, res, next);
};

export const isDeliveryPartnerOrAdmin = (req, res, next) => {
  return authorizeRoles("deliveryPartner", "admin")(req, res, next);
};