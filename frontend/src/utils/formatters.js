export const getLastAssistantMessage = (chat) => {
  const messages = chat?.chat?.messages || [];
  return [...messages].reverse().find((message) => message.role === "assistant") || null;
};

export const formatConversationDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short"
  });
};
