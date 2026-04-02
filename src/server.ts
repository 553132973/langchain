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
    model: process.env.DASHSCOPE_MODEL || "qwen3.5-plus",
    apiKey: process.env.DASHSCOPE_API_KEY,
    configuration: {
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    },
    temperature: 0.7,
    maxRetries: 2,
  });
}

// 通义万相图片生成
async function generateImage(prompt: string): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const model = process.env.WANX_MODEL || "wanx2.1-t2i-turbo";
  
  // 创建任务
  const createResponse = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify({
      model,
      input: {
        prompt,
      },
      parameters: {
        size: "1024*1024",
        n: 1,
      },
    }),
  });
  
  if (!createResponse.ok) {
    const error: any = await createResponse.json();
    throw new Error(`图片生成失败: ${error.message || createResponse.statusText}`);
  }
  
  const createData: any = await createResponse.json();
  const taskId = createData.output?.task_id;
  
  if (!taskId) {
    throw new Error("未获取到任务ID");
  }
  
  // 轮询任务状态
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const statusResponse = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    
    const statusData: any = await statusResponse.json();
    const status = statusData.output?.task_status;
    
    if (status === "SUCCEEDED") {
      const imageUrl = statusData.output?.results?.[0]?.url;
      if (imageUrl) {
        return imageUrl;
      }
      throw new Error("未获取到图片URL");
    } else if (status === "FAILED") {
      throw new Error(`图片生成失败: ${statusData.output?.message || "未知错误"}`);
    }
  }
  
  throw new Error("图片生成超时");
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

// 图片生成 API 端点
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "提示词不能为空" });
    }
    
    const imageUrl = await generateImage(prompt);
    res.json({ imageUrl });
  } catch (error: any) {
    console.error("图片生成错误:", error);
    res.status(500).json({ error: error.message || "图片生成失败" });
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