const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true
  },

  content: {
    type: String,
    required: true
  },

  attachment: {
    url: String,
    publicId: String,
    originalName: String,
    mimeType: String,
    bytes: Number
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  title: {
    type: String,
    default: "New Chat"
  },

  shareToken: {
    type: String,
    default: null,
    index: true
  },

  imageUploadCount: {
    type: Number,
    default: 0
  },

  messages: [messageSchema],

},{
  timestamps:true
});

module.exports = mongoose.model("Chat", chatSchema);
