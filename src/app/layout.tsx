import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Import Inter
import "./globals.css";
// Configure Inter font
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: "--font-inter", // Optional: if you want to use CSS variables
  preload: true,
  // Add weights if needed, e.g., weight: ["400", "500", "700"]
});


export const metadata: Metadata = {
  title: "Speed Test | Ka-Chow! Let's Check Your Speed",
  description: "Analyze your internet connection's latency, download, and upload speed with this modern performance tool.",
  icons: {
    icon: '/favicon.ico',
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}