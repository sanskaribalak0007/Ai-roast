export const initialAuthForm = {
  name: "",
  email: "",
  password: "",
  otp: ""
};

export const initialForgotForm = {
  email: ""
};

export const initialResetForm = {
  password: ""
};

export const initialContactForm = {
  name: "",
  email: "",
  message: ""
};

export const aboutPhotoUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80";

export const typingSpeedOptions = [
  { label: "Slow", value: 38 },
  { label: "Normal", value: 22 },
  { label: "Fast", value: 10 }
];

export const projectExamples = [
  {
    title: "Portfolio Website",
    description: "Build a personal portfolio with hero, projects, skills, contact form and dark-light toggle.",
    files: ["src/App.jsx", "src/components/Hero.jsx", "src/components/Projects.jsx", "src/styles.css"],
    prompt:
      "Create a modern portfolio website for a frontend developer with hero section, featured projects, skills timeline, contact form, responsive layout, and clean React component structure."
  },
  {
    title: "E-commerce Store",
    description: "Create product listing, filters, cart, checkout UI and admin-ready code structure.",
    files: ["src/pages/Home.jsx", "src/components/ProductCard.jsx", "src/context/CartContext.jsx", "src/pages/Checkout.jsx"],
    prompt:
      "Build an e-commerce React app with product grid, category filters, cart drawer, checkout page, reusable components, and scalable folder structure."
  },
  {
    title: "Task Manager",
    description: "Organize personal and team tasks with priorities, deadlines and progress boards.",
    files: ["src/pages/Dashboard.jsx", "src/components/TaskBoard.jsx", "src/components/TaskCard.jsx", "src/hooks/useTasks.js"],
    prompt:
      "Generate a task manager app with Kanban board, priority tags, due dates, drag-and-drop-ready structure, and clean state management."
  },
  {
    title: "Chat Application",
    description: "Real-time style messaging layout with user list, message panel and typing hints.",
    files: ["src/pages/ChatPage.jsx", "src/components/SidebarUsers.jsx", "src/components/MessageComposer.jsx", "server/socket.js"],
    prompt:
      "Create a chat application UI and backend structure with conversation list, message bubbles, typing indicator, online status, and scalable MERN folder architecture."
  },
  {
    title: "Learning Platform",
    description: "Design a course dashboard with lessons, progress, notes and quiz sections.",
    files: ["src/pages/Courses.jsx", "src/components/CourseCard.jsx", "src/pages/LessonView.jsx", "src/components/QuizPanel.jsx"],
    prompt:
      "Build a learning platform with course cards, lesson reader, progress tracker, notes area, quiz module, and responsive dashboard layout."
  },
  {
    title: "Hospital System",
    description: "Manage doctors, patients, appointments and reports with admin-style screens.",
    files: ["src/pages/AdminDashboard.jsx", "src/components/AppointmentTable.jsx", "src/components/PatientForm.jsx", "models/Patient.js"],
    prompt:
      "Create a hospital management system with patient registration, doctor directory, appointment scheduler, report section, and MERN code structure."
  },
  {
    title: "Recipe Finder",
    description: "Search recipes by ingredients, preview details and save favorites.",
    files: ["src/pages/Recipes.jsx", "src/components/SearchBar.jsx", "src/components/RecipeCard.jsx", "src/context/FavoritesContext.jsx"],
    prompt:
      "Generate a recipe finder app with ingredient search, category chips, recipe detail modal, favorites, and polished responsive React UI."
  },
  {
    title: "Weather Dashboard",
    description: "Display live weather cards, forecasts, city search and air quality blocks.",
    files: ["src/pages/Weather.jsx", "src/components/ForecastStrip.jsx", "src/components/CitySearch.jsx", "src/utils/weatherApi.js"],
    prompt:
      "Build a weather dashboard with current weather, 5-day forecast, city search, condition icons, and clean API integration structure."
  },
  {
    title: "Blog CMS",
    description: "Create public blog pages and an editor/admin area for managing posts.",
    files: ["src/pages/BlogHome.jsx", "src/pages/PostEditor.jsx", "src/components/PostCard.jsx", "models/Post.js"],
    prompt:
      "Create a MERN blog CMS with post listing, article page, rich editor layout, tag filters, admin dashboard, and reusable file structure."
  },
  {
    title: "AI Image Prompt Tool",
    description: "Generate prompt templates, style presets and image history cards.",
    files: ["src/pages/PromptStudio.jsx", "src/components/StylePresetGrid.jsx", "src/components/PromptOutput.jsx", "src/data/presets.js"],
    prompt:
      "Build an AI image prompt generator with style presets, prompt builder, output history cards, export options, and polished React UI."
  }
];

export const comparisonRows = [
  {
    tool: "Our AI Roast",
    bestFor: "Students and project builders",
    difference: "Private session-based workspace, file analysis, editable chat history, prompt examples",
    howToUse: "Login, choose an example or ask directly, upload files, refine answers in one thread"
  },
  {
    tool: "ChatGPT",
    bestFor: "General conversation and broad writing help",
    difference: "Very flexible chat experience with strong everyday assistance",
    howToUse: "Start a prompt, ask follow-ups, iterate on the same thread"
  },
  {
    tool: "Gemini",
    bestFor: "Google ecosystem users and multimodal tasks",
    difference: "Good fit when working across docs, images and search-connected workflows",
    howToUse: "Ask for analysis, summaries and multimodal input handling"
  },
  {
    tool: "Claude",
    bestFor: "Long-form writing and careful explanations",
    difference: "Often preferred for structured reasoning and extended prose",
    howToUse: "Provide detailed context, then ask for step-by-step responses"
  },
  {
    tool: "Perplexity",
    bestFor: "Research-style answers",
    difference: "Focuses on finding information quickly with source-driven responses",
    howToUse: "Ask factual questions and compare cited summaries"
  },
  {
    tool: "GitHub Copilot",
    bestFor: "Inline coding support",
    difference: "Works inside editor workflows rather than as a chat-first product",
    howToUse: "Use while coding to autocomplete, generate snippets and refactor faster"
  }
];

export const testimonials = [
  {
    name: "Riya Sharma",
    role: "B.Tech Student",
    quote: "The project examples save a lot of time. I can click one idea and start a full build instantly."
  },
  {
    name: "Karan Mehta",
    role: "MERN Learner",
    quote: "The chat history and file upload flow make it feel like an actual study workspace, not just a bot."
  },
  {
    name: "Aditi Verma",
    role: "Freelance Designer",
    quote: "The public pages look polished and the response style feels more guided than random AI tools."
  }
];
