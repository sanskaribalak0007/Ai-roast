const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { scrapeWebsite, auditWebsite } = require("../controllers/scrapeController");

const router = express.Router();

router.post("/scrape", authMiddleware, scrapeWebsite);
router.post("/audit", authMiddleware, auditWebsite);

module.exports = router;
