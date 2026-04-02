import { NextRequest, NextResponse } from "next/server";

// 通义万相图片生成
async function generateImage(prompt: string): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const model = process.env.WANX_MODEL || "wanx2.1-t2i-turbo";

  // 创建任务
  const createResponse = await fetch(
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
    },
  );

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
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const statusResponse = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

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

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "提示词不能为空" }, { status: 400 });
    }

    const imageUrl = await generateImage(prompt);
    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error("图片生成错误:", error);
    return NextResponse.json({ error: error.message || "图片生成失败" }, { status: 500 });
  }
}