import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { config } from "dotenv";
import * as readline from "readline";

// 加载环境变量
config();

// 模拟LLM响应（用于测试，无需API Key和网络连接）
class MockChatModel {
  async invoke(messages: any[]) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const lastMessage = messages[messages.length - 1];
    const userQuestion = typeof lastMessage.content === 'string' ? lastMessage.content : '你好';
    
    return {
      content: `这是一个模拟回复。

你问: "${userQuestion}"

📌 当前运行在模拟模式，无需API Key和网络连接。
如需真实AI回复，请配置其他模型。`,
      response_metadata: { model: "mock-mode" }
    };
  }
}

// 模型提供商信息
const providers: Record<string, { name: string; url: string; free: boolean }> = {
  mock: { name: "模拟模式", url: "", free: true },
  ollama: { name: "Ollama (本地)", url: "http://localhost:11434", free: true },
  gemini: { name: "Google Gemini", url: "https://aistudio.google.com/apikey", free: true },
  groq: { name: "Groq (超快推理)", url: "https://console.groq.com/keys", free: true },
  openai: { name: "OpenAI", url: "https://platform.openai.com", free: false },
};

async function createLLM(provider: string): Promise<any> {
  switch (provider) {
    case "ollama":
      return new ChatOllama({
        model: process.env.OLLAMA_MODEL || "qwen2.5:0.5b",
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        temperature: 0.7,
      });
    
    case "gemini":
      return new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        temperature: 0.7,
        apiKey: process.env.GOOGLE_API_KEY,
      });
    
    case "groq":
      return new ChatGroq({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        apiKey: process.env.GROQ_API_KEY,
      });
    
    case "openai":
      return new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxRetries: 2,
      });
    
    default:
      return new MockChatModel();
  }
}

// 创建命令行交互
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║       LangChain Pro 智能问答             ║");
  console.log("╚══════════════════════════════════════════╝\n");
  
  // 获取模型提供商
  const provider = (process.env.MODEL_PROVIDER || "mock").toLowerCase();
  const providerInfo = providers[provider] || providers.mock;
  
  console.log(`📌 当前模型: ${providerInfo.name}`);
  
  if (provider === "ollama") {
    console.log(`🔗 Ollama地址: ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`);
    console.log(`🤖 使用模型: ${process.env.OLLAMA_MODEL || "qwen2.5:0.5b"}`);
  }
  console.log("");
  
  // 创建LLM实例
  let llm: any;
  try {
    llm = await createLLM(provider);
  } catch (error: any) {
    console.error("❌ 模型初始化失败:", error.message);
    console.log("🔄 切换到模拟模式\n");
    llm = new MockChatModel();
  }
  
  // 对话历史
  const conversationHistory: any[] = [
    new SystemMessage("你是一个有帮助的AI助手。请用简洁的语言回答用户的问题。"),
  ];
  
  // 创建命令行交互
  const rl = createReadlineInterface();
  
  console.log("💬 开始对话 (输入 'quit' 或 'exit' 退出, 'clear' 清空历史)\n");
  
  const askQuestion = () => {
    rl.question("你: ", async (userInput) => {
      const input = userInput.trim();
      
      // 处理特殊命令
      if (input.toLowerCase() === "quit" || input.toLowerCase() === "exit") {
        console.log("\n👋 再见！感谢使用 LangChain Pro！");
        rl.close();
        return;
      }
      
      if (input.toLowerCase() === "clear") {
        conversationHistory.length = 1; // 保留SystemMessage
        console.log("\n🗑️ 对话历史已清空\n");
        askQuestion();
        return;
      }
      
      if (!input) {
        askQuestion();
        return;
      }
      
      // 添加用户消息到历史
      conversationHistory.push(new HumanMessage(input));
      
      try {
        console.log("\n🤖 思考中...");
        
        // 调用模型
        const response = await llm.invoke(conversationHistory);
        const aiContent = response.content;
        
        // 添加AI回复到历史
        conversationHistory.push(new AIMessage(aiContent));
        
        console.log(`\n🤖 AI: ${aiContent}\n`);
        console.log("─".repeat(50));
        console.log("");
        
      } catch (error: any) {
        console.error("\n❌ 调用出错:", error.message);
        
        if (error.message?.includes("ECONNREFUSED") || error.message?.includes("fetch")) {
          console.error("\n💡 无法连接到模型服务");
          if (provider === "ollama") {
            console.error("   请确保 Ollama 正在运行: ollama serve");
            console.error("   可用模型: ollama list");
          }
        } else if (error.message?.includes("429")) {
          console.error("\n💡 配额不足，请检查API Key的计费情况");
        } else if (error.message?.includes("401")) {
          console.error("\n💡 API Key无效，请检查.env文件中的配置");
        }
        console.log("");
      }
      
      // 继续下一轮对话
      askQuestion();
    });
  };
  
  // 开始对话
  askQuestion();
}

main();