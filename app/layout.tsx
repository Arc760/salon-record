import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salon Record",
  description: "美甲店经营记账本",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
