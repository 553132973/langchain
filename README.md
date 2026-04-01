# LangChain Pro

基于 TypeScript 的 LangChain 项目模板，支持多种 AI 模型（包括本地 Ollama）。

## 🤖 支持的 AI 模型

| 模型 | 免费 | 速度 | 说明 |
|------|------|------|------|
| **Ollama (本地)** | ✅ 完全免费 | 快 | 本地运行，无需网络，推荐 |
| **模拟模式** | ✅ 完全免费 | 快 | 无需API Key，本地测试 |
| **Google Gemini** | ✅ 免费 | 快 | 15次/分钟免费额度 |
| **Groq** | ✅ 免费 | 超快 | 开源模型，推理速度极快 |
| **OpenAI** | ⚠️ 有限 | 中 | 新用户$5免费额度 |

## 📁 项目结构

```
langchain-pro/
├── src/
│   └── index.ts          # 主入口文件
├── .env                   # 环境变量配置
├── .gitignore             # Git 忽略文件
├── package.json           # 项目依赖和脚本
├── tsconfig.json          # TypeScript 配置
└── README.md              # 项目说明
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置模型

编辑 `.env` 文件，修改 `MODEL_PROVIDER` 的值：

#### 选项 A: Ollama 本地模型 (推荐，完全免费)
```env
MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
```

可用模型查看：`ollama list`

#### 选项 B: 模拟模式 (无需配置)
```env
MODEL_PROVIDER=mock
```

#### 选项 C: Google Gemini (免费)
1. 访问 https://aistudio.google.com/apikey 获取 API Key
```env
MODEL_PROVIDER=gemini
GOOGLE_API_KEY=你的google-api-key
```

#### 选项 D: Groq (免费)
1. 访问 https://console.groq.com/keys 获取 API Key
```env
MODEL_PROVIDER=groq
GROQ_API_KEY=你的groq-api-key
```

#### 选项 E: OpenAI
```env
MODEL_PROVIDER=openai
OPENAI_API_KEY=你的openai-api-key
```

### 3. 运行项目

开发模式：
```bash
npm run dev
```

构建 TypeScript：
```bash
npm run build
```

运行编译后的代码：
```bash
npm start
```

## 📊 模型对比

| 特性 | Ollama | 模拟模式 | Gemini | Groq | OpenAI |
|------|--------|---------|--------|------|--------|
| 需要API Key | ❌ | ❌ | ✅ | ✅ | ✅ |
| 需要网络 | ❌ | ❌ | ✅ | ✅ | ✅ |
| 免费额度 | 无限 | 无限 | 15次/分钟 | 有限 | $5 |
| 响应速度 | 快 | 快 | 快 | 超快 | 中 |

## 🔧 可用命令

- `npm run dev` - 开发模式运行
- `npm run build` - 编译 TypeScript
- `npm start` - 运行编译后的代码

## 📝 注意事项

1. `.env` 文件已添加到 `.gitignore` 中，不会提交到 Git 仓库
2. 请妥善保管你的 API Key
3. 使用 Ollama 前请确保已安装并运行: `ollama serve`
4. 模拟模式仅用于测试项目结构