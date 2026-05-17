import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { api } from "./api";
import {
  initialAuthForm,
  initialResetForm,
  initialContactForm,
  testimonials
} from "./constants/appData";
import { readRoute } from "./utils/route";
import { getLastAssistantMessage } from "./utils/formatters";
import PublicNav from "./components/public/PublicNav";
import Footer from "./components/public/Footer";
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";
import ResetPage from "./pages/ResetPage";
import SharedChatPage from "./pages/SharedChatPage";
import AuthPage from "./pages/AuthPage";
import ChatPage from "./pages/ChatPage";

function App() {
  const [route, setRoute] = useState(readRoute);
  const [session, setSession] = useState({ checked: false, user: null });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [resetForm, setResetForm] = useState(initialResetForm);
  const [contactForm, setContactForm] = useState(initialContactForm);
  const [authNotice, setAuthNotice] = useState("");
  const [authError, setAuthError] = useState("");
  const [contactNotice, setContactNotice] = useState("");
  const [contactError, setContactError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);

  const [history, setHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [isDraftChat, setIsDraftChat] = useState(true);
  const [chatSearch, setChatSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const deferredHistorySearch = useDeferredValue(historySearch);
  const deferredChatSearch = useDeferredValue(chatSearch);

  const [question, setQuestion] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appError, setAppError] = useState("");
  const [statusLine, setStatusLine] = useState("Ready when you are.");

  const [renamingChatId, setRenamingChatId] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [editingMessageId, setEditingMessageId] = useState("");
  const [editValue, setEditValue] = useState("");
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const [sharedChat, setSharedChat] = useState(null);
  const [sharedChatError, setSharedChatError] = useState("");

  const [typingSpeed, setTypingSpeed] = useState(22);
  const [typingTarget, setTypingTarget] = useState({ messageId: "", fullText: "" });
  const [typingVisible, setTypingVisible] = useState("");
  const [autoScrollPending, setAutoScrollPending] = useState(false);
  const messagePanelRef = useRef(null);

  useEffect(() => {
    const syncRoute = () => setRoute(readRoute());

    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);

    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        const data = await api.checkAuth();
        setSession({ checked: true, user: data.loggedIn ? data.user : null });
      } catch {
        setSession({ checked: true, user: null });
      }
    };

    boot();
  }, []);

  useEffect(() => {
    if (route.type !== "shared" || !route.token) {
      setSharedChat(null);
      setSharedChatError("");
      return;
    }

    const loadSharedChat = async () => {
      try {
        const data = await api.getSharedChat(route.token);
        setSharedChat(data.chat);
        setSharedChatError("");
      } catch (error) {
        setSharedChat(null);
        setSharedChatError(error.message);
      }
    };

    loadSharedChat();
  }, [route]);

  useEffect(() => {
    if (!session.user) {
      return;
    }

    const loadHistory = async () => {
      try {
        const items = await api.getHistory(deferredHistorySearch);
        startTransition(() => {
          setHistory(items);
          if (!activeChatId && !isDraftChat && items[0]?._id) {
            setActiveChatId(items[0]._id);
          }
        });
      } catch (error) {
        setAppError(error.message);
      }
    };

    loadHistory();
  }, [session.user, deferredHistorySearch, activeChatId, isDraftChat]);

  useEffect(() => {
    if (!session.user || !activeChatId) {
      return;
    }

    const loadChat = async () => {
      try {
        const data = await api.getChat(activeChatId, deferredChatSearch);
        setActiveChat(data);
        setIsDraftChat(false);
      } catch (error) {
        setAppError(error.message);
      }
    };

    loadChat();
  }, [session.user, activeChatId, deferredChatSearch]);

  useEffect(() => {
    const lastAssistantMessage = getLastAssistantMessage(activeChat);

    if (!lastAssistantMessage) {
      setTypingTarget({ messageId: "", fullText: "" });
      setTypingVisible("");
      return;
    }

    if (lastAssistantMessage._id !== typingTarget.messageId || lastAssistantMessage.content !== typingTarget.fullText) {
      setTypingTarget({
        messageId: lastAssistantMessage._id,
        fullText: lastAssistantMessage.content
      });
      setTypingVisible("");
    }
  }, [activeChat, typingTarget.fullText, typingTarget.messageId]);

  useEffect(() => {
    if (!typingTarget.messageId || typingVisible === typingTarget.fullText) {
      return;
    }

    const totalLength = [...typingTarget.fullText].length;
    const currentLength = [...typingVisible].length;
    const step = typingSpeed <= 12 ? 3 : typingSpeed <= 22 ? 2 : 1;
    const nextLength = Math.min(totalLength, currentLength + step);

    const timer = window.setTimeout(() => {
      setTypingVisible([...typingTarget.fullText].slice(0, nextLength).join(""));
    }, typingSpeed);

    return () => window.clearTimeout(timer);
  }, [typingTarget, typingVisible, typingSpeed]);

  useEffect(() => {
    if (!autoScrollPending || !typingTarget.messageId || !messagePanelRef.current) {
      return;
    }

    messagePanelRef.current.scrollTo({
      top: messagePanelRef.current.scrollHeight,
      behavior: "smooth"
    });
    setAutoScrollPending(false);
  }, [autoScrollPending, typingTarget.messageId]);

  const navigatePublic = (nextView) => {
    const href = nextView === "auth" ? "/" : `/#${nextView}`;
    window.history.pushState({}, "", href);
    setRoute({ type: nextView, token: "" });
  };

  const refreshHistory = async (preferredChatId = "") => {
    const items = await api.getHistory(deferredHistorySearch);
    setHistory(items);

    if (preferredChatId) {
      setActiveChatId(preferredChatId);
      setIsDraftChat(false);
      return;
    }

    if (!items.find((item) => item._id === activeChatId)) {
      if (items[0]?._id) {
        setActiveChatId(items[0]._id);
        setIsDraftChat(false);
      } else {
        setActiveChatId("");
        setActiveChat(null);
        setIsDraftChat(true);
      }
    }
  };

  const syncActiveChat = async (chatId) => {
    const data = await api.getChat(chatId);
    setActiveChat(data);
    setActiveChatId(chatId);
    setIsDraftChat(false);
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  };

  const handleSwitchAuthMode = (mode) => {
    setAuthMode(mode);
    setAuthError("");
    setAuthNotice("");
    setAuthForm(initialAuthForm);
  };

  const handleResetChange = (event) => {
    const { name, value } = event.target;
    setResetForm((current) => ({ ...current, [name]: value }));
  };

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContactForm((current) => ({ ...current, [name]: value }));
  };

  const handleRegisterOrLogin = async (event) => {
    event.preventDefault();
    setLoadingAuth(true);
    setAuthError("");
    setAuthNotice("");

    try {
      if (authMode === "register") {
        const response = await api.register({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password
        });

        setAuthNotice(response.message);
        setAuthMode("login");
        setAuthForm({
          ...initialAuthForm,
          email: authForm.email
        });
      } else {
        const response = await api.login({
          email: authForm.email,
          password: authForm.password
        });

        setSession({ checked: true, user: response.user });
        setStatusLine("Session secured. Let the roasting begin.");
      }
    } catch (error) {
      if (authMode === "register" && error.message === "User already exists") {
        setAuthMode("login");
        setAuthNotice("Account already exists. Please login with your email and password.");
        setAuthForm({
          ...initialAuthForm,
          email: authForm.email
        });
        return;
      }

      setAuthError(error.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoadingAuth(true);
    setAuthError("");
    setAuthNotice("");

    try {
      const response = await api.resetPassword(route.token, resetForm);
      setAuthNotice(response.message);
      setResetForm(initialResetForm);
      window.history.pushState({}, "", "/");
      setRoute({ type: "auth", token: "" });
      setAuthMode("login");
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setLoadingContact(true);
    setContactError("");
    setContactNotice("");

    try {
      const response = await api.sendContactMessage(contactForm);
      setContactNotice(response.message);
      setContactForm(initialContactForm);
    } catch (error) {
      setContactError(error.message);
    } finally {
      setLoadingContact(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setSession({ checked: true, user: null });
      setActiveChatId("");
      setActiveChat(null);
      setIsDraftChat(true);
      setHistory([]);
      setStatusLine("Signed out cleanly.");
    }
  };

  const handleNewChat = () => {
    setIsDraftChat(true);
    setActiveChatId("");
    setActiveChat(null);
    setQuestion("");
    setSelectedFile(null);
    setChatSearch("");
    setAppError("");
    setShareNotice("");
    setStatusLine("New study thread ready.");
  };

  const submitPrompt = async ({ promptOverride, fileOverride } = {}) => {
    const prompt = typeof promptOverride === "string" ? promptOverride.trim() : question.trim();
    const file = fileOverride !== undefined ? fileOverride : selectedFile;

    if (!prompt && !file) {
      return;
    }

    setIsSubmitting(true);
    setAppError("");
    setShareNotice("");
    setAutoScrollPending(true);
    setStatusLine(file ? "Uploading and analyzing file..." : "Generating response...");

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("question", prompt);
        if (activeChatId) {
          formData.append("chatId", activeChatId);
        }

        const response = await api.uploadFile(formData);
        await refreshHistory(response.chatId);
        await syncActiveChat(response.chatId);
        setSelectedFile(null);
      } else {
        const response = await api.sendMessage({
          question: prompt,
          chatId: activeChatId || undefined
        });

        await refreshHistory(response.chatId);
        await syncActiveChat(response.chatId);
      }

      setQuestion("");
      setStatusLine("Conversation updated.");
    } catch (error) {
      setAppError(error.message);
      setStatusLine("Action hit a wall. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    await submitPrompt();
  };

  const handleComposerKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isSubmitting) {
        await submitPrompt();
      }
    }
  };

  const handleExampleClick = async (example) => {
    setQuestion(example.prompt);
    await submitPrompt({ promptOverride: example.prompt, fileOverride: null });
  };

  const handleComposerPaste = (event) => {
    const clipboardItems = Array.from(event.clipboardData?.items || []);
    const imageItem = clipboardItems.find((item) => item.type.startsWith("image/"));

    if (!imageItem) {
      return;
    }

    const pastedImage = imageItem.getAsFile();

    if (!pastedImage) {
      return;
    }

    event.preventDefault();
    setSelectedFile(pastedImage);
    setStatusLine(`Image attached from clipboard: ${pastedImage.name || "pasted-image"}`);
  };

  const handleShareChat = async () => {
    if (!activeChatId || isDraftChat) {
      return;
    }

    try {
      const data = await api.createShareLink(activeChatId);
      const shareUrl = `${window.location.origin}/shared/${data.shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareNotice("Share link copied.");
    } catch (error) {
      setShareNotice(error.message || "Unable to create share link.");
    }
  };

  const beginRename = (chat) => {
    setRenamingChatId(chat._id);
    setRenameValue(chat.title);
  };

  const commitRename = async () => {
    if (!renamingChatId || !renameValue.trim()) {
      return;
    }

    try {
      await api.renameChat(renamingChatId, renameValue.trim());
      setRenamingChatId("");
      setRenameValue("");
      await refreshHistory(activeChatId || renamingChatId);
      if (activeChatId === renamingChatId) {
        await syncActiveChat(renamingChatId);
      }
    } catch (error) {
      setAppError(error.message);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await api.deleteChat(chatId);
      const nextId = activeChatId === chatId ? "" : activeChatId;
      setActiveChatId(nextId);
      if (activeChatId === chatId) {
        setActiveChat(null);
      }
      await refreshHistory(nextId);
      setStatusLine("Chat deleted.");
    } catch (error) {
      setAppError(error.message);
    }
  };

  const beginEdit = (message) => {
    setEditingMessageId(message._id);
    setEditValue(message.content);
  };

  const commitEdit = async () => {
    if (!activeChatId || !editingMessageId || !editValue.trim()) {
      return;
    }

    try {
      await api.editMessage(activeChatId, editingMessageId, editValue.trim());
      setEditingMessageId("");
      setEditValue("");
      await refreshHistory(activeChatId);
      await syncActiveChat(activeChatId);
      setStatusLine("Message updated and AI response regenerated.");
    } catch (error) {
      setAppError(error.message);
    }
  };

  const publicNav = <PublicNav onNavigate={navigatePublic} routeType={route.type} />;
  const footer = <Footer />;
  const refreshSession = async () => {
    try {
      const data = await api.checkAuth();
      if (data.loggedIn) {
        setSession({ checked: true, user: data.user });
      }
    } catch {
      // Keep existing session if refresh fails.
    }
  };

  if (!session.checked) {
    return <div className="screen-center">Booting studio...</div>;
  }

  if (route.type === "about") {
    return <AboutPage footer={footer} publicNav={publicNav} testimonials={testimonials} />;
  }

  if (route.type === "help") {
    return (
      <HelpPage
        contactError={contactError}
        contactForm={contactForm}
        contactNotice={contactNotice}
        footer={footer}
        loadingContact={loadingContact}
        onContactChange={handleContactChange}
        onContactSubmit={handleContactSubmit}
        publicNav={publicNav}
        testimonials={testimonials}
      />
    );
  }

  if (route.type === "reset") {
    return (
      <ResetPage
        authError={authError}
        authNotice={authNotice}
        footer={footer}
        loadingAuth={loadingAuth}
        onResetChange={handleResetChange}
        onResetPassword={handleResetPassword}
        publicNav={publicNav}
        resetForm={resetForm}
      />
    );
  }

  if (route.type === "shared") {
    return <SharedChatPage footer={footer} publicNav={publicNav} sharedChat={sharedChat} sharedChatError={sharedChatError} />;
  }

  if (!session.user) {
    return (
      <AuthPage
        authError={authError}
        authForm={authForm}
        authMode={authMode}
        authNotice={authNotice}
        footer={footer}
        loadingAuth={loadingAuth}
        onAuthChange={handleAuthChange}
        onRegisterOrLogin={handleRegisterOrLogin}
        onSwitchAuthMode={handleSwitchAuthMode}
        publicNav={publicNav}
      />
    );
  }

  return (
    <ChatPage
      activeChat={activeChat}
      activeChatId={activeChatId}
      api={api}
      appError={appError}
      editValue={editValue}
      editingMessageId={editingMessageId}
      history={history}
      historySearch={historySearch}
      isDraftChat={isDraftChat}
      isSubmitting={isSubmitting}
      messagePanelRef={messagePanelRef}
      onBeginEdit={beginEdit}
      onBeginRename={beginRename}
      onCommitEdit={commitEdit}
      onCommitRename={commitRename}
      onDeleteChat={handleDeleteChat}
      onExampleClick={handleExampleClick}
      onFileChange={setSelectedFile}
      onHistorySearchChange={setHistorySearch}
      onKeyDown={handleComposerKeyDown}
      onLogout={handleLogout}
      onNavigateTool={(nextView) => {
        const href = nextView === "auth" ? "/" : `/#${nextView}`;
        window.history.pushState({}, "", href);
        setRoute({ type: nextView, token: "" });
      }}
      onNewChat={handleNewChat}
      onOpenChat={(chatId) => {
        setIsDraftChat(false);
        setActiveChatId(chatId);
      }}
      onPaste={handleComposerPaste}
      onQuestionChange={setQuestion}
      onRefreshSession={refreshSession}
      onRenameValueChange={setRenameValue}
      onShareChat={handleShareChat}
      onSubmit={handleSend}
      onTogglePrompts={() => setPromptsOpen((current) => !current)}
      onEditValueChange={setEditValue}
      onScrape={api.scrapeWebsite}
      onAudit={api.auditWebsite}
      promptsOpen={promptsOpen}
      question={question}
      routeType={route.type}
      renameValue={renameValue}
      renamingChatId={renamingChatId}
      selectedFile={selectedFile}
      sessionUser={session.user}
      shareNotice={shareNotice}
      typingTarget={typingTarget}
      typingVisible={typingVisible}
    />
  );
}

export default App;
