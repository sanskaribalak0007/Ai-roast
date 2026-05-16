const User = require("../models/User");
const { consumeToolCredit } = require("../services/usageService");

const decodeHtmlEntities = (text = "") => {
  const entityMap = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&#39;": "'",
    "&apos;": "'"
  };

  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (entity) => entityMap[entity] || entity);
};

const normalizeText = (text = "") => decodeHtmlEntities(
  text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
).replace(/\r/g, "")
  .replace(/[ \t]+/g, " ")
  .replace(/\n{2,}/g, "\n")
  .trim();

const collectTagText = (html = "", tagName, limit = 20) => {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  const matches = [];
  let match;

  while ((match = regex.exec(html)) && matches.length < limit) {
    const value = normalizeText(match[1]);

    if (value) {
      matches.push(value);
    }
  }

  return matches;
};

const extractTitle = (html = "") => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeText(titleMatch?.[1] || "") || "Untitled Page";
};

const extractMetaDescription = (html = "") => {
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i);

  return normalizeText(metaMatch?.[1] || "");
};

const extractMetaImage = (html = "") => {
  const metaMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+property=["']og:image["'][^>]*>/i)
    || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i);

  return normalizeText(metaMatch?.[1] || "");
};

const stripUnwantedHtml = (html = "") => html
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
  .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
  .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
  .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
  .replace(/<(nav|header|footer|aside|form)[^>]*>[\s\S]*?<\/\1>/gi, "");

const isolateMainHtml = (html = "") => {
  const cleaned = stripUnwantedHtml(html);
  const preferredMatch = cleaned.match(/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i);

  if (preferredMatch?.[2]) {
    return preferredMatch[2];
  }

  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] || cleaned;
};

const dedupe = (items = []) => [...new Set(items.filter(Boolean))];

const resolveImageUrl = (sourceUrl, imageUrl = "") => {
  try {
    return new URL(imageUrl, sourceUrl).toString();
  } catch {
    return "";
  }
};

const collectImages = (html = "", sourceUrl, limit = 6) => {
  const regex = /<img[^>]+src=["']([\s\S]*?)["'][^>]*>/gi;
  const images = [];
  let match;

  while ((match = regex.exec(html)) && images.length < limit) {
    const tag = match[0];
    const src = resolveImageUrl(sourceUrl, match[1]);
    const altMatch = tag.match(/alt=["']([\s\S]*?)["']/i);
    const alt = normalizeText(altMatch?.[1] || "");

    if (!src || src.startsWith("data:")) {
      continue;
    }

    if (images.some((item) => item.src === src)) {
      continue;
    }

    images.push({
      src,
      alt: alt || "Scraped image"
    });
  }

  return images;
};

const collectImageStats = (html = "", sourceUrl) => {
  const regex = /<img[^>]+src=["']([\s\S]*?)["'][^>]*>/gi;
  let total = 0;
  let missingAlt = 0;
  let largeCandidateCount = 0;
  let match;

  while ((match = regex.exec(html))) {
    total += 1;

    const tag = match[0];
    const src = resolveImageUrl(sourceUrl, match[1]);
    const altMatch = tag.match(/alt=["']([\s\S]*?)["']/i);
    const widthMatch = tag.match(/width=["']?(\d+)/i);
    const heightMatch = tag.match(/height=["']?(\d+)/i);

    if (!normalizeText(altMatch?.[1] || "")) {
      missingAlt += 1;
    }

    if ((Number(widthMatch?.[1] || 0) >= 1200 || Number(heightMatch?.[1] || 0) >= 1200) && src) {
      largeCandidateCount += 1;
    }
  }

  return {
    total,
    missingAlt,
    largeCandidateCount
  };
};

const collectAssetUrls = (html = "", sourceUrl, tagName, attributeName) => {
  const regex = new RegExp(`<${tagName}[^>]+${attributeName}=["']([\\s\\S]*?)["'][^>]*>`, "gi");
  const items = [];
  let match;

  while ((match = regex.exec(html))) {
    const resolved = resolveImageUrl(sourceUrl, match[1]);
    if (resolved && !items.includes(resolved)) {
      items.push(resolved);
    }
  }

  return items;
};

const buildAuditRecommendations = (metrics) => {
  const recommendations = [];

  if (metrics.responseTimeMs > 1500) {
    recommendations.push("Server response is slow. Consider caching, CDN delivery, or backend query optimization.");
  }

  if (metrics.htmlSizeKb > 250) {
    recommendations.push("HTML document is heavy. Reduce unused markup and defer non-critical content.");
  }

  if (metrics.imageStats.largeCandidateCount > 0) {
    recommendations.push("Some images look oversized. Compress or resize large images before delivery.");
  }

  if (metrics.imageStats.missingAlt > 0) {
    recommendations.push("Some images are missing alt text. Add descriptive alt text for accessibility and SEO.");
  }

  if (!metrics.hasViewportMeta) {
    recommendations.push("Viewport meta tag is missing. Add it for better mobile rendering.");
  }

  if (!metrics.hasMetaDescription) {
    recommendations.push("Meta description is missing. Add it to improve search previews.");
  }

  if (metrics.scriptCount > 10) {
    recommendations.push("The page loads many scripts. Audit third-party scripts and defer non-critical JavaScript.");
  }

  if (metrics.stylesheetCount > 5) {
    recommendations.push("The page uses many stylesheets. Combine or trim CSS where possible.");
  }

  if (!recommendations.length) {
    recommendations.push("Baseline checks look healthy. Next step would be a Lighthouse-style audit for deeper performance profiling.");
  }

  return recommendations;
};

const buildMarkdown = ({ title, sourceUrl, extractedAt, description, headings, paragraphs, listItems, images }) => {
  const sections = [
    `# ${title}`,
    "",
    `Source URL: ${sourceUrl}`,
    `Extracted At: ${extractedAt}`,
    ""
  ];

  if (description) {
    sections.push("## Summary", "", description, "");
  }

  if (headings.length) {
    sections.push("## Headings", "", ...headings.map((item) => `- ${item}`), "");
  }

  if (paragraphs.length) {
    sections.push("## Main Content", "", ...paragraphs.map((item, index) => `${index + 1}. ${item}`), "");
  }

  if (listItems.length) {
    sections.push("## Key Points", "", ...listItems.map((item) => `- ${item}`), "");
  }

  if (images.length) {
    sections.push("## Images", "", ...images.map((item) => `- ${item.src}`), "");
  }

  return sections.join("\n").trim();
};

const buildDocHtml = ({ title, sourceUrl, extractedAt, description, headings, paragraphs, listItems, images }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; padding: 32px; color: #1f2937; line-height: 1.6; }
    h1 { color: #0f172a; margin-bottom: 8px; }
    h2 { color: #1d4ed8; margin-top: 28px; }
    p, li { font-size: 12pt; }
    .meta { color: #475569; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta"><strong>Source URL:</strong> ${sourceUrl}<br /><strong>Extracted At:</strong> ${extractedAt}</p>
  ${description ? `<h2>Summary</h2><p>${description}</p>` : ""}
  ${headings.length ? `<h2>Headings</h2><ul>${headings.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
  ${paragraphs.length ? `<h2>Main Content</h2><ol>${paragraphs.map((item) => `<li>${item}</li>`).join("")}</ol>` : ""}
  ${listItems.length ? `<h2>Key Points</h2><ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
  ${images.length ? `<h2>Images</h2>${images.map((item) => `<p><img src="${item.src}" alt="${item.alt}" style="max-width: 100%; height: auto; border-radius: 8px;" /></p>`).join("")}` : ""}
</body>
</html>
`;

const sanitizeFileName = (value = "") => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 60) || "scraped-page";

exports.scrapeWebsite = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    const sourceUrl = req.body?.url?.trim();

    if (!sourceUrl) {
      return res.status(400).json({
        error: "Website URL is required"
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return res.status(400).json({
        error: "Please enter a valid URL"
      });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        error: "Only HTTP and HTTPS links are supported"
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AI-Roast-Scraper/1.0)"
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(400).json({
        error: `Unable to fetch page content (${response.status})`
      });
    }

    const html = await response.text();
    const mainHtml = isolateMainHtml(html);
    const title = extractTitle(html);
    const description = extractMetaDescription(html);
    const metaImage = extractMetaImage(html);
    const headings = dedupe([
      ...collectTagText(mainHtml, "h1", 5),
      ...collectTagText(mainHtml, "h2", 10),
      ...collectTagText(mainHtml, "h3", 10)
    ]).slice(0, 12);
    const paragraphs = dedupe(collectTagText(mainHtml, "p", 20))
      .filter((item) => item.length > 40)
      .slice(0, 12);
    const listItems = dedupe(collectTagText(mainHtml, "li", 20))
      .filter((item) => item.length > 20)
      .slice(0, 12);
    const images = collectImages(mainHtml, parsedUrl.toString(), 6);

    if (metaImage && !images.some((item) => item.src === metaImage)) {
      images.unshift({
        src: resolveImageUrl(parsedUrl.toString(), metaImage),
        alt: `${title} preview image`
      });
    }

    const extractedAt = new Date().toISOString();

    const markdown = buildMarkdown({
      title,
      sourceUrl: parsedUrl.toString(),
      extractedAt,
      description,
      headings,
      paragraphs,
      listItems,
      images
    });

    const documentHtml = buildDocHtml({
      title,
      sourceUrl: parsedUrl.toString(),
      extractedAt,
      description,
      headings,
      paragraphs,
      listItems,
      images
    });

    await consumeToolCredit(user, "scraper");

    return res.json({
      title,
      sourceUrl: parsedUrl.toString(),
      extractedAt,
      description,
      headings,
      paragraphs,
      listItems,
      images,
      markdown,
      documentHtml,
      fileName: `${sanitizeFileName(title)}.doc`
    });
  } catch (error) {
    const isAbortError = error.name === "AbortError";

    return res.status(error.message?.includes("limit") ? 403 : 500).json({
      error: error.message?.includes("limit")
        ? error.message
        : isAbortError ? "Scraping timed out. Try again with another page." : "Unable to scrape this page"
    });
  }
};

exports.auditWebsite = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    const sourceUrl = req.body?.url?.trim();

    if (!sourceUrl) {
      return res.status(400).json({
        error: "Website URL is required"
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return res.status(400).json({
        error: "Please enter a valid URL"
      });
    }

    const startTime = Date.now();
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AI-Roast-Audit/1.0)"
      }
    });
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      return res.status(400).json({
        error: `Unable to audit page (${response.status})`
      });
    }

    const html = await response.text();
    const mainHtml = isolateMainHtml(html);
    const htmlSizeKb = Number((Buffer.byteLength(html, "utf8") / 1024).toFixed(1));
    const title = extractTitle(html);
    const hasMetaDescription = Boolean(extractMetaDescription(html));
    const hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(html);
    const scriptCount = (html.match(/<script\b/gi) || []).length;
    const stylesheetCount = (html.match(/<link[^>]+rel=["']stylesheet["']/gi) || []).length;
    const imageStats = collectImageStats(mainHtml, parsedUrl.toString());
    const scriptUrls = collectAssetUrls(html, parsedUrl.toString(), "script", "src");
    const stylesheetUrls = collectAssetUrls(html, parsedUrl.toString(), "link", "href")
      .filter((item) => item.endsWith(".css") || item.includes(".css?"));
    const metrics = {
      title,
      sourceUrl: parsedUrl.toString(),
      responseTimeMs,
      htmlSizeKb,
      hasMetaDescription,
      hasViewportMeta,
      scriptCount,
      stylesheetCount,
      imageStats,
      scriptUrls: scriptUrls.slice(0, 10),
      stylesheetUrls: stylesheetUrls.slice(0, 10)
    };

    await consumeToolCredit(user, "audit");

    return res.json({
      ...metrics,
      recommendations: buildAuditRecommendations(metrics)
    });
  } catch (error) {
    return res.status(error.message?.includes("limit") ? 403 : 500).json({
      error: error.message?.includes("limit") ? error.message : "Unable to audit this page"
    });
  }
};
