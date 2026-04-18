import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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
    <html lang="en" className={`${jakarta.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#131314] text-[#e3e3e3]">
        {children}
      </body>
    </html>
  );
}
