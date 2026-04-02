import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LangChain Pro - 智能问答",
  description: "基于通义千问大模型的智能问答系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
