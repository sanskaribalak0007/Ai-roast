/**
 * Builds a self-contained HTML document for sandboxed iframe preview.
 */
export const buildPreviewDocument = ({ html = "", css = "", javascript = "" }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css}</style>
</head>
<body>
${html}
<script>
try {
${javascript}
} catch (error) {
  console.error(error);
  const banner = document.createElement("pre");
  banner.textContent = "JavaScript error: " + error.message;
  banner.style.cssText = "margin:16px;padding:12px;border-radius:8px;background:#fef2f2;color:#991b1b;font:14px/1.5 monospace;";
  document.body.prepend(banner);
}
</script>
</body>
</html>`;
