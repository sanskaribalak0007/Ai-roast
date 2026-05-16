const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmailSafe = require("../utils/sendEmailSafe");
const { persistUserSession } = require("../utils/sessionHelpers");
const env = require("../config/env");
const { buildAccessState, ensureWeeklyCredits } = require("../services/usageService");

const normalizeEmail = (email = "") => email.trim().toLowerCase();


// REGISTER
exports.register = async (req,res)=>{

  try{

    const name = req.body?.name?.trim();
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const userExist = await User.findOne({email});

    if(userExist){
      return res.status(400).json({message:"User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const user = await User.create({
      name,
      email,
      password:hashedPassword
    });

    // Do not block registration on SMTP (avoids infinite "Processing..." on deploy).
    sendEmailSafe(email, "Registration Successful", "Thanks for registering on our platform");

    return res.json({ message: "User Registered Successfully" });

  } catch (error) {
    return res.status(500).json({ message: error.message || "Registration failed" });
  }
};


// LOGIN
exports.login = async (req, res) => {

  try {

    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    await persistUserSession(req, user);

    ensureWeeklyCredits(user).catch((creditsError) => {
      console.warn("[login] ensureWeeklyCredits:", creditsError.message);
    });

    return res.json({
      message: "Login successful",
      user: {
        id: String(user._id),
        email: user.email,
        access: buildAccessState(user)
      }
    });
  } catch (error) {
    console.error("[login] failed:", error.message);
    return res.status(500).json({
      message: error.message || "Login failed. Please try again."
    });
  }

};


// FORGOT PASSWORD
exports.forgotPassword = async (req,res)=>{

  try{

    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({email});

    if(!user){
      return res.json({message:"User not found"});
    }

    const resetToken = jwt.sign(
      {id:user._id},
      env.resetSecret,
      {expiresIn:"15m"}
    );

    user.resetToken = resetToken;

    await user.save();

    const resetLink = `${env.frontendUrl.replace(/\/$/, "")}/reset/${resetToken}`;

    sendEmailSafe(email, "Password Reset", `Reset your password here: ${resetLink}`);

    return res.json({ message: "Reset link sent to email" });

  }catch(error){

    res.status(500).json({error:error.message});

  }

};


// RESET PASSWORD
exports.resetPassword = async (req,res)=>{

  try{

    const {token} = req.params;
    const password = req.body?.password;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const decoded = jwt.verify(
      token,
      env.resetSecret
    );

    const user = await User.findById(decoded.id);

    if (!user || user.resetToken !== token) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password,10);

    user.password = hashedPassword;

    user.resetToken = "";

    await user.save();

    res.json({message:"Password reset successful"});

  }catch(error){

    res.status(500).json({error:error.message});

  }

};

// LOGOUT
exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie(env.sessionName || "ai_roast.sid");
    return res.json({ message: "Logout successful" });
  });
};


// CHECK SESSION
exports.checkAuth = (req, res) => {
  if (!req.session.user) {
    return res.json({
      loggedIn: false
    });
  }

  User.findById(req.session.user.id)
    .then(async (user) => {
      if (!user) {
        return res.json({ loggedIn: false });
      }

      await ensureWeeklyCredits(user);

      return res.json({
        loggedIn: true,
        user: {
          ...req.session.user,
          access: buildAccessState(user)
        }
      });
    })
    .catch(() => {
      res.json({
        loggedIn: true,
        user: req.session.user
      });
    });
};
