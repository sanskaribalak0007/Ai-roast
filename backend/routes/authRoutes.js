const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  register,
  login,
  logout,
  checkAuth,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");


// REGISTER
router.post("/register", register);


// LOGIN
router.post("/login", login);


// LOGOUT (protected)
router.get("/logout", authMiddleware, logout);


// CHECK SESSION (public — returns loggedIn true/false)
router.get("/check", checkAuth);


// FORGOT PASSWORD
router.post("/forgot", forgotPassword);


// RESET PASSWORD
router.post("/reset/:token", resetPassword);


module.exports = router;