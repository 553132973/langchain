import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

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

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
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

    return NextResponse.json({ reply: aiContent });
  } catch (error: any) {
    console.error("聊天错误:", error);
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}