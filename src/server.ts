import express from "express";
import cors from "cors";
import path from "path";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { config } from "dotenv";

config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// 存储会话
const sessions: Record<string, any[]> = {};

// 创建 LLM 实例
function createLLM() {
  return new ChatOpenAI({
    model: process.env.DASHSCOPE_MODEL || "qwen-turbo",
    apiKey: process.env.DASHSCOPE_API_KEY,
    configuration: {
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    },
    temperature: 0.7,
    maxRetries: 2,
  });
}

// 聊天 API 端点
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "消息不能为空" });
    }
    
    // 初始化会话
    if (!sessions[sessionId]) {
      sessions[sessionId] = [
        new SystemMessage("你是一个有帮助的AI助手。请用简洁的语言回答用户的问题。"),
      ];
    }
    
    const conversationHistory = sessions[sessionId];
    conversationHistory.push(new HumanMessage(message));
    
    const llm = createLLM();
    const response = await llm.invoke(conversationHistory);
    const aiContent = response.content;
    
    conversationHistory.push(new AIMessage(aiContent));
    
    res.json({ reply: aiContent });
  } catch (error: any) {
    console.error("聊天错误:", error);
    res.status(500).json({ error: error.message || "服务器错误" });
  }
});

// 清空会话
app.post("/api/clear", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && sessions[sessionId]) {
    sessions[sessionId] = [
      new SystemMessage("你是一个有帮助的AI助手。请用简洁的语言回答用户的问题。"),
    ];
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`🤖 使用模型: 通义千问 (DashScope)`);
});