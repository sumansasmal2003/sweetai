// src/app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Sweet AI",
  description: "Ask anything with unlimited AI usage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Add suppressHydrationWarning to HTML tag to prevent next-themes hydration mismatch
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white dark:bg-[#131314] text-gray-900 dark:text-[#e3e3e3] transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
