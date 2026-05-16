export const PLAYGROUND_EDITOR_TABS = [
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "javascript", label: "JavaScript" }
];

export const DEFAULT_PLAYGROUND_SNIPPETS = {
  html: `<main class="card">
  <p class="eyebrow">Live preview</p>
  <h1>Hello, builder</h1>
  <p>Edit HTML, CSS, and JavaScript — changes appear instantly.</p>
  <button id="action-btn" type="button">Click me</button>
</main>`,
  css: `:root {
  --accent: #4f46e5;
  --ink: #0f172a;
  --muted: #64748b;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: linear-gradient(145deg, #eef2ff, #f8fafc);
  color: var(--ink);
}

.card {
  width: min(420px, 92vw);
  padding: 28px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}

h1 {
  margin: 0 0 10px;
}

p {
  margin: 0 0 18px;
  color: var(--muted);
  line-height: 1.6;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}`,
  javascript: `const button = document.getElementById("action-btn");

button?.addEventListener("click", () => {
  button.textContent = "Nice — JS is running!";
});`
};
