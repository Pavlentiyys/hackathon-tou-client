import type { Metadata } from "next";
import { 
  Comfortaa 
} from "next/font/google";
import "./globals.css";
import Header from "@/components/Header/Header";

const ComfortaaFont = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "WindTone AI",
  description: "WindTone AI is a chatbot that can help you with your questions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ComfortaaFont.className}`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
