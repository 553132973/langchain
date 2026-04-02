"use client";

import { useState, useRef, useEffect } from "react";

type Mode = "chat" | "image";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  imageUrl?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const sessionId = useRef(
    "session_" + Math.random().toString(36).substr(2, 9),
  );

  useEffect(() => {
    chatInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const escapeHtml = (text: string) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, "<br>");
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), content: message, isUser: true },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId: sessionId.current }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), content: data.reply, isUser: false },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: "抱歉，出现了一些问题。",
            isUser: false,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "网络错误，请稍后重试。",
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
      chatInputRef.current?.focus();
    }
  };

  const generateImage = async () => {
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), content: prompt, isUser: true },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: "图片生成完成：",
            isUser: false,
            imageUrl: data.imageUrl,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: "图片生成失败: " + (data.error || "未知错误"),
            isUser: false,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "网络错误，请稍后重试。",
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
      chatInputRef.current?.focus();
    }
  };

  const clearChat = async () => {
    try {
      await fetch("/api/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.current }),
      });
      setMessages([]);
    } catch (error) {
      console.error("清空聊天失败:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (mode === "chat") {
        sendMessage();
      } else {
        generateImage();
      }
    }
  };

  return (
    <div style={styles.body}>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .loading span {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #764ba2;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .loading span:nth-child(1) { animation-delay: -0.32s; }
        .loading span:nth-child(2) { animation-delay: -0.16s; }
      `}</style>
      <div style={styles.chatContainer}>
        <div style={styles.chatHeader}>
          <h1>🤖 LangChain Pro 智能问答</h1>
          <div style={styles.modeToggle}>
            <button
              style={{
                ...styles.modeBtn,
                ...(mode === "chat" ? styles.modeBtnActive : {}),
              }}
              onClick={() => setMode("chat")}
            >
              💬 聊天
            </button>
            <button
              style={{
                ...styles.modeBtn,
                ...(mode === "image" ? styles.modeBtnActive : {}),
              }}
              onClick={() => setMode("image")}
            >
              🎨 图片生成
            </button>
          </div>
          <p id="modeDescription">
            {mode === "chat"
              ? "基于通义千问大模型"
              : "基于通义万相图片生成模型"}
          </p>
        </div>

        <div style={styles.chatMessages} ref={chatMessagesRef}>
          {messages.length === 0 && (
            <div style={styles.welcomeMessage}>
              <h2>👋 你好！</h2>
              <p>我是通义千问AI助手，有什么可以帮助你的吗？</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.message,
                ...(msg.isUser ? styles.messageUser : styles.messageAi),
              }}
            >
              <div style={styles.avatar}>
                {msg.isUser ? "👤" : msg.imageUrl ? "🎨" : "🤖"}
              </div>
              <div style={styles.messageContent}>
                <span
                  dangerouslySetInnerHTML={{ __html: escapeHtml(msg.content) }}
                />
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="生成的图片"
                    style={styles.generatedImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        "图片加载失败";
                    }}
                  />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ ...styles.message, ...styles.messageAi }}>
              <div style={styles.avatar}>🤖</div>
              <div style={styles.loading}>
                <span style={loadingDotStyle}></span>
                <span
                  style={{ ...loadingDotStyle, animationDelay: "-0.16s" }}
                ></span>
                <span
                  style={{ ...loadingDotStyle, animationDelay: "0s" }}
                ></span>
              </div>
            </div>
          )}
        </div>

        <div style={styles.chatInputContainer}>
          <input
            type="text"
            style={styles.chatInput}
            ref={chatInputRef}
            placeholder={
              mode === "chat" ? "输入你的问题..." : "描述你想生成的图片..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            autoComplete="off"
          />
          {mode === "chat" ? (
            <button
              style={{
                ...styles.sendBtn,
                ...(isLoading ? styles.sendBtnDisabled : {}),
              }}
              onClick={sendMessage}
              disabled={isLoading}
            >
              发送
            </button>
          ) : (
            <button
              style={{
                ...styles.imageBtn,
                ...(isLoading ? styles.sendBtnDisabled : {}),
              }}
              onClick={generateImage}
              disabled={isLoading}
            >
              🎨 生成
            </button>
          )}
          <button style={styles.clearBtn} onClick={clearChat}>
            清空
          </button>
        </div>
      </div>
    </div>
  );
}

const loadingDotStyle: React.CSSProperties = {
  display: "inline-block",
  width: "8px",
  height: "8px",
  background: "#764ba2",
  borderRadius: "50%",
  animation: "bounce 1.4s infinite ease-in-out",
};

const styles: Record<string, React.CSSProperties> = {
  body: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    margin: 0,
  },
  chatContainer: {
    width: "100%",
    maxWidth: "800px",
    height: "90vh",
    background: "white",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatHeader: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "20px",
    textAlign: "center",
  },
  modeToggle: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  modeBtn: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.85rem",
    transition: "all 0.3s",
    background: "rgba(255, 255, 255, 0.2)",
    color: "white",
  },
  modeBtnActive: {
    background: "white",
    color: "#667eea",
  },
  chatMessages: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  welcomeMessage: {
    textAlign: "center",
    color: "#666",
    padding: "40px 20px",
  },
  message: {
    display: "flex",
    gap: "10px",
    maxWidth: "80%",
    animation: "fadeIn 0.3s ease",
  },
  messageUser: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  messageAi: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
    background: "#667eea",
  },
  messageContent: {
    padding: "12px 16px",
    borderRadius: "18px",
    lineHeight: 1.5,
    wordWrap: "break-word",
    background: "#f1f3f4",
    color: "#333",
    borderBottomLeftRadius: "4px",
  },
  generatedImage: {
    maxWidth: "100%",
    borderRadius: "12px",
    marginTop: "8px",
  },
  chatInputContainer: {
    padding: "20px",
    borderTop: "1px solid #e0e0e0",
    display: "flex",
    gap: "10px",
    background: "#fafafa",
  },
  chatInput: {
    flex: 1,
    padding: "14px 18px",
    border: "2px solid #e0e0e0",
    borderRadius: "25px",
    fontSize: "1rem",
    outline: "none",
    transition: "border-color 0.3s",
  },
  sendBtn: {
    padding: "14px 20px",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.3s",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
  },
  imageBtn: {
    padding: "14px 20px",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.3s",
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "white",
  },
  sendBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    transform: "none",
  },
  clearBtn: {
    padding: "14px 20px",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.3s",
    background: "#e0e0e0",
    color: "#666",
  },
  loading: {
    display: "flex",
    gap: "5px",
    padding: "12px 16px",
  },
};
