const Chat = require("../models/Chat");
const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");
const env = require("../config/env");
const User = require("../models/User");
const {
  buildAutoTitle,
  buildChatSearchResults,
  buildFileAnalysisContents,
  claimLegacyChatsIfNeeded,
  cleanupCloudinaryAsset,
  createShareToken,
  generateTutorResponse,
  getOwnedChatOr404,
  isCloudinaryConfigured,
  uploadBufferToCloudinary
} = require("../services/chatService");
const {
  assertChatMessageLimit,
  assertImageUploadLimit
} = require("../services/usageService");

const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

exports.askAI = async (req, res) => {
  try {
    const { question, chatId } = req.body;
    const userId = req.session.user.id;
    const user = await User.findById(userId);

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Question is required"
      });
    }

    let chat;

    if (chatId) {
      await claimLegacyChatsIfNeeded(userId);
      chat = await getOwnedChatOr404(chatId, userId, res);
      if (!chat) {
        return;
      }

      assertChatMessageLimit(user, chat);
    }

    if (!chat) {
      chat = new Chat({
        user: userId,
        title: buildAutoTitle(question, "New Chat"),
        messages: []
      });
    }

    chat.messages.push({
      role: "user",
      content: question.trim()
    });

    const parsed = await generateTutorResponse(chat.messages);

    chat.messages.push({
      role: "assistant",
      content: parsed.answer
    });

    await chat.save();

    return res.json({
      chatId: chat._id,
      title: chat.title,
      roast: parsed.roast,
      answer: parsed.answer
    });
  } catch (error) {
    console.log("Gemini Error:", error.message);

    return res.status(error.message?.includes("limit") ? 403 : 500).json({
      error: error.message?.includes("limit") ? error.message : "AI error"
    });
  }
};

exports.askFileAI = async (req, res) => {
  let uploadedAsset;

  try {
    const file = req.file;
    const { question, chatId } = req.body;
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    uploadedAsset = null;

    if (!file) {
      return res.status(400).json({
        error: "No file uploaded"
      });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        error: "Cloudinary configuration is missing"
      });
    }

    let chat;

    if (chatId) {
      await claimLegacyChatsIfNeeded(userId);
      chat = await getOwnedChatOr404(chatId, userId, res);
      if (!chat) {
        return;
      }

      assertChatMessageLimit(user, chat);
    }

    if (!chat) {
      chat = new Chat({
        user: userId,
        title: buildAutoTitle(question || file.originalname, "File Chat"),
        messages: []
      });
    }

    const isImageUpload = file.mimetype?.startsWith("image/");
    if (isImageUpload) {
      assertImageUploadLimit(user, chat);
    }

    uploadedAsset = await uploadBufferToCloudinary(file);
    const promptText = question?.trim() || "Explain this file briefly for study.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: buildFileAnalysisContents(file, promptText)
    });

    const answer = response.text || "No response generated for this file.";

    chat.messages.push({
      role: "user",
      content: `${promptText} (file)`,
      attachment: {
        url: uploadedAsset.secure_url,
        publicId: uploadedAsset.public_id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        bytes: file.size
      }
    });

    chat.messages.push({
      role: "assistant",
      content: answer
    });

    if (isImageUpload) {
      chat.imageUploadCount += 1;
    }

    await chat.save();

    return res.json({
      chatId: chat._id,
      title: chat.title,
      fileUrl: uploadedAsset.secure_url,
      answer
    });
  } catch (error) {
    console.log("File AI Error:", error.message);

    if (uploadedAsset?.public_id) {
      const resourceType = uploadedAsset.resource_type || "raw";
      await cleanupCloudinaryAsset(uploadedAsset.public_id, resourceType);
    }

    return res.status(error.message?.includes("limit") ? 403 : 500).json({
      error: error.message?.includes("limit")
        ? error.message
        : error.message?.includes("Timeout")
        ? "File analysis timed out. Try a smaller file or a shorter prompt."
        : "File AI failed"
    });
  }
};

exports.getHistory = async (req, res) => {
  const userId = req.session.user.id;
  const search = req.query.search?.trim();
  await claimLegacyChatsIfNeeded(userId);
  const filters = { user: userId };

  if (search) {
    const regex = new RegExp(search, "i");
    filters.$or = [
      { title: regex },
      { "messages.content": regex }
    ];
  }

  const history = await Chat
    .find(filters)
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(50)
    .select("_id title createdAt updatedAt");

  res.json(history);
};

exports.getChatById = async (req, res) => {
  await claimLegacyChatsIfNeeded(req.session.user.id);

  const chat = await getOwnedChatOr404(req.params.chatId, req.session.user.id, res);

  if (!chat) {
    return;
  }

  const search = req.query.search?.trim();
  const searchResults = buildChatSearchResults(chat, search);

  res.json({
    chat,
    searchResults
  });
};

exports.createShareLink = async (req, res) => {
  await claimLegacyChatsIfNeeded(req.session.user.id);

  const chat = await getOwnedChatOr404(req.params.chatId, req.session.user.id, res);

  if (!chat) {
    return;
  }

  if (!chat.shareToken) {
    chat.shareToken = createShareToken();
    await chat.save();
  }

  res.json({
    shareToken: chat.shareToken
  });
};

exports.getSharedChat = async (req, res) => {
  const token = req.params.shareToken?.trim();

  if (!token) {
    return res.status(400).json({
      error: "Share token is required"
    });
  }

  const chat = await Chat.findOne({ shareToken: token }).select("_id title messages createdAt updatedAt");

  if (!chat) {
    return res.status(404).json({
      error: "Shared chat not found"
    });
  }

  return res.json({
    chat
  });
};

exports.renameChat = async (req, res) => {
  await claimLegacyChatsIfNeeded(req.session.user.id);

  const chat = await getOwnedChatOr404(req.params.chatId, req.session.user.id, res);

  if (!chat) {
    return;
  }

  const title = req.body?.title?.trim();

  if (!title) {
    return res.status(400).json({
      error: "Title is required"
    });
  }

  chat.title = title.slice(0, 60);
  await chat.save();

  return res.json({
    message: "Chat renamed successfully",
    chat
  });
};

exports.deleteChat = async (req, res) => {
  await claimLegacyChatsIfNeeded(req.session.user.id);

  const chat = await getOwnedChatOr404(req.params.chatId, req.session.user.id, res);

  if (!chat) {
    return;
  }

  const attachments = chat.messages
    .filter((message) => message.attachment?.publicId)
    .map((message) => ({
      publicId: message.attachment.publicId,
      resourceType: message.attachment.mimeType?.startsWith("image/") ? "image" : "raw"
    }));

  await Chat.deleteOne({ _id: chat._id });
  await Promise.all(
    attachments.map((attachment) => cleanupCloudinaryAsset(attachment.publicId, attachment.resourceType))
  );

  return res.json({
    message: "Chat deleted successfully"
  });
};

exports.editMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.session.user.id;
    const content = req.body?.content?.trim();

    if (!content) {
      return res.status(400).json({
        error: "Message content is required"
      });
    }

    await claimLegacyChatsIfNeeded(userId);
    const chat = await getOwnedChatOr404(chatId, userId, res);

    if (!chat) {
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        error: "Invalid messageId"
      });
    }

    const messageIndex = chat.messages.findIndex((message) => message._id.toString() === messageId);

    if (messageIndex === -1) {
      return res.status(404).json({
        error: "Message not found"
      });
    }

    if (chat.messages[messageIndex].role !== "user") {
      return res.status(400).json({
        error: "Only user messages can be edited"
      });
    }

    chat.messages[messageIndex].content = content;
    chat.messages = chat.messages.slice(0, messageIndex + 1);

    const parsed = await generateTutorResponse(chat.messages);

    chat.messages.push({
      role: "assistant",
      content: parsed.answer
    });

    if (messageIndex === 0) {
      chat.title = buildAutoTitle(content, chat.title);
    }

    await chat.save();

    return res.json({
      message: "Message updated successfully",
      chat,
      roast: parsed.roast,
      answer: parsed.answer
    });
  } catch (error) {
    console.log("Edit Message Error:", error.message);

    return res.status(500).json({
      error: "Message update failed"
    });
  }
};
