import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Özel Ders Pro",
  description:
    "Hoca ve öğrenciler için tek panelden ders, ödev ve kaynak yönetim platformu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "white",
              color: "rgb(15 23 42)",
              border: "1px solid rgb(226 232 240)",
              fontSize: "14px",
              boxShadow:
                "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
            },
            success: {
              iconTheme: { primary: "rgb(22 163 74)", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "rgb(220 38 38)", secondary: "white" },
              duration: 5000,
            },
          }}
        />
      </body>
    </html>
  );
}
