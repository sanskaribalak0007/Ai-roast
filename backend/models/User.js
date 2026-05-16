const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name:{
    type:String,
    required:true,
    trim:true
  },

  email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true
  },

  password:{
    type:String,
    required:true
  },

  resetToken:{
    type:String
  },

  subscribed: {
    type: Number,
    default: 0
  },

  subscriptionStatus: {
    type: String,
    default: "inactive"
  },

  subscriptionPlanKey: {
    type: String,
    default: ""
  },

  razorpayCustomerId: {
    type: String,
    default: ""
  },

  razorpaySubscriptionId: {
    type: String,
    default: ""
  },

  subscriptionCurrentStart: {
    type: Date,
    default: null
  },

  subscriptionCurrentEnd: {
    type: Date,
    default: null
  },

  weeklyCreditsBalance: {
    type: Number,
    default: 0
  },

  weeklyCreditsResetAt: {
    type: Date,
    default: null
  },

  purchasedCreditsBalance: {
    type: Number,
    default: 0
  },

  freeScraperCreditsRemaining: {
    type: Number,
    default: 5
  },

  freeAuditCreditsRemaining: {
    type: Number,
    default: 5
  },

  processedRazorpayPaymentIds: {
    type: [String],
    default: []
  }

},{timestamps:true});

module.exports = mongoose.model("User",userSchema);
