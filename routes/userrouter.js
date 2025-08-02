import express from "express";
import {
  register,
  resendOTP,
  verifyOTP,
  login,
  logout,
  getUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  uploadProfilePhoto,
  getAllUsers,
  blockUser,
  unblockUser,
  getUserOrderHistory,
  deleteUser,
} from "../controllers/userController.js";
import { isAuthenticated, isAdmin, isVendor, isDeliveryPartner } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/register", register);
router.post("/resend-otp", resendOTP);
router.post("/otp-verification", verifyOTP);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/me", isAuthenticated, getUser);
router.put("/profile", isAuthenticated, updateProfile);
router.post("/upload-photo", isAuthenticated, upload.single('profilePhoto'), uploadProfilePhoto);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);

// Admin-only routes
router.get("/admin/users", isAuthenticated, isAdmin, getAllUsers);
router.put("/admin/users/:userId/block", isAuthenticated, isAdmin, blockUser);
router.put("/admin/users/:userId/unblock", isAuthenticated, isAdmin, unblockUser);
router.get("/admin/users/:userId/orders", isAuthenticated, isAdmin, getUserOrderHistory);
router.delete("/admin/users/:userId", isAuthenticated, isAdmin, deleteUser);

export default router;