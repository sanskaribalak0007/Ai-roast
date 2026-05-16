const router = require("express").Router();
const multer = require("multer");

const authMiddleware = require("../middleware/authMiddleware");

const {
  askAI,
  getHistory,
  askFileAI,
  getChatById,
  getSharedChat,
  createShareLink,
  renameChat,
  deleteChat,
  editMessage
} = require("../controllers/chatController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const uploadSingleFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File size should be 10MB or less"
        });
      }

      return res.status(400).json({
        error: "File upload failed"
      });
    }

    next();
  });
};


// AI CHAT (Protected)
router.post("/", authMiddleware, askAI);


// CHAT HISTORY (Protected)
router.get("/history", authMiddleware, getHistory);


// PUBLIC SHARED CHAT
router.get("/share/:shareToken", getSharedChat);


// OPEN SINGLE CHAT (Protected)
router.get("/:chatId", authMiddleware, getChatById);


// CREATE SHARE LINK (Protected)
router.post("/:chatId/share", authMiddleware, createShareLink);


// RENAME CHAT (Protected)
router.patch("/:chatId/title", authMiddleware, renameChat);


// EDIT MESSAGE (Protected)
router.patch("/:chatId/messages/:messageId", authMiddleware, editMessage);


// DELETE CHAT (Protected)
router.delete("/:chatId", authMiddleware, deleteChat);


// FILE UPLOAD + AI ANALYSIS (Protected)
router.post("/upload", authMiddleware, uploadSingleFile, askFileAI);


module.exports = router;
