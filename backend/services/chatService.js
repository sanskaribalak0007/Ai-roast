const { GoogleGenAI } = require("@google/genai");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { Readable } = require("stream");
const env = require("../config/env");
const Chat = require("../models/Chat");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

const textLikeExtensions = new Set([
  ".txt",
  ".md",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".html",
  ".css",
  ".scss",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".cs",
  ".php",
  ".sql",
  ".xml",
  ".yml",
  ".yaml"
]);

const buildChatAccessQuery = (chatId, userId) => ({
  _id: chatId,
  user: userId
});

const extractJsonResponse = (text = "") => {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

  return fencedMatch ? fencedMatch[1].trim() : trimmed;
};

const normalizeJsonishText = (text = "") => text
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'");

const decodeEscapedSequences = (text = "") => text
  .replace(/\\n/g, "\n")
  .replace(/\\t/g, "\t")
  .replace(/\\"/g, '"')
  .replace(/\\\\/g, "\\");

const normalizeAnswerText = (text = "") => {
  const cleaned = decodeEscapedSequences(String(text || "").trim());
  return cleaned.replace(/^"+|"+$/g, "").trim();
};

const parseTutorPayload = (text = "") => {
  const normalized = normalizeJsonishText(extractJsonResponse(text));

  try {
    const parsed = JSON.parse(normalized);
    return {
      roast: normalizeAnswerText(parsed.roast || ""),
      answer: normalizeAnswerText(parsed.answer || "")
    };
  } catch {
    const answerMatch = normalized.match(/"answer"\s*:\s*"([\s\S]*)"\s*}/);
    const roastMatch = normalized.match(/"roast"\s*:\s*"([\s\S]*?)"\s*,\s*"answer"/);

    if (answerMatch) {
      return {
        roast: normalizeAnswerText(roastMatch?.[1] || ""),
        answer: normalizeAnswerText(answerMatch[1])
      };
    }

    return {
      roast: "",
      answer: normalizeAnswerText(normalized)
    };
  }
};

const buildAutoTitle = (text = "", fallback = "New Chat") => {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/[^\w\s?-]/g, "")
    .trim();

  if (!cleaned) {
    return fallback;
  }

  const words = cleaned.split(" ").slice(0, 8).join(" ");
  return words.slice(0, 60);
};

const buildHistoryPayload = (messages = []) => messages.map((message) => ({
  role: message.role === "assistant" ? "model" : "user",
  parts: [{ text: message.content }]
}));

const generateTutorResponse = async (messages) => {
  const prompt = `
You are a helpful AI tutor.

Rules:
1. Only answer questions related to study, programming, science, or technology.
2. If unrelated, politely refuse.
3. Keep answers short and clear.
4. Roast the user only once at the start of the conversation in a light humorous way.
5. After first message do NOT roast again.
6. If the user asks for code, put the full code inside fenced markdown code blocks using triple backticks and the language name.
7. Do not inline code as plain paragraphs when full code is requested.

Respond JSON:

{
"roast":"optional roast",
"answer":"short answer"
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      { role: "user", parts: [{ text: prompt }] },
      ...buildHistoryPayload(messages)
    ]
  });

  return parseTutorPayload(response.text || "");
};

const getOwnedChatOr404 = async (chatId, userId, res) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    res.status(400).json({ error: "Invalid chatId" });
    return null;
  }

  const chat = await Chat.findOne(buildChatAccessQuery(chatId, userId));

  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return null;
  }

  return chat;
};

const buildChatSearchResults = (chat, searchTerm) => {
  if (!searchTerm) {
    return [];
  }

  const normalized = searchTerm.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return chat.messages
    .filter((message) => message.content.toLowerCase().includes(normalized))
    .map((message) => ({
      messageId: message._id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt
    }));
};

const claimLegacyChatsIfNeeded = async (userId) => {
  const ownedChatCount = await Chat.countDocuments({ user: userId });

  if (ownedChatCount > 0) {
    return;
  }

  await Chat.updateMany(
    {
      $or: [
        { user: null },
        { user: { $exists: false } }
      ]
    },
    {
      $set: { user: userId }
    }
  );
};

const uploadBufferToCloudinary = (file) => new Promise((resolve, reject) => {
  const resourceType = file.mimetype.startsWith("image/") ? "image" : "raw";

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: env.cloudinaryFolder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true
    },
    (error, result) => {
      if (error) {
        return reject(error);
      }

      return resolve(result);
    }
  );

  Readable.from(file.buffer).pipe(uploadStream);
});

const cleanupCloudinaryAsset = async (publicId, resourceType = "raw") => {
  if (!publicId || !isCloudinaryConfigured()) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
  } catch (error) {
    console.log("Cloudinary cleanup failed:", error.message);
  }
};

const isTextLikeFile = (file) => {
  const mimeType = file.mimetype || "";
  const fileName = (file.originalname || "").toLowerCase();
  const extension = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";

  return mimeType.startsWith("text/")
    || mimeType.includes("json")
    || mimeType.includes("javascript")
    || mimeType.includes("typescript")
    || mimeType.includes("xml")
    || textLikeExtensions.has(extension);
};

const buildFileAnalysisContents = (file, questionText) => {
  const normalizedQuestion = questionText?.trim() || "Explain this file briefly for study.";

  if (isTextLikeFile(file)) {
    const extractedText = file.buffer.toString("utf8").slice(0, 30000);

    return [
      {
        role: "user",
        parts: [
          {
            text: [
              "You are analyzing a study or coding file.",
              `File name: ${file.originalname}`,
              `Mime type: ${file.mimetype}`,
              `User question: ${normalizedQuestion}`,
              "",
              "File content:",
              extractedText || "[No readable text content found]"
            ].join("\n")
          }
        ]
      }
    ];
  }

  return [
    {
      role: "user",
      parts: [
        { text: normalizedQuestion },
        {
          inlineData: {
            mimeType: file.mimetype,
            data: file.buffer.toString("base64")
          }
        }
      ]
    }
  ];
};

const createShareToken = () => crypto.randomBytes(18).toString("hex");

module.exports = {
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
};
