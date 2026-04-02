import { NextRequest, NextResponse } from "next/server";
import { SystemMessage } from "@langchain/core/messages";

// 存储会话
const sessions: Record<string, any[]> = {};

export async function POST(request: NextRequest) {
  const { sessionId } = await request.json();
  if (sessionId && sessions[sessionId]) {
    sessions[sessionId] = [
      new SystemMessage("你是一个有帮助的AI助手。请用简洁的语言回答用户的问题。"),
    ];
  }
  return NextResponse.json({ success: true });
}