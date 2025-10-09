import { Inter } from "next/font/google";
import "./styles/dark-mode.css";
import { AuthProvider } from "@/contexts/AuthContext";
import HeaderClient from "./components/HeaderClient";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "E-Commerce Platform",
  description: "Modern e-commerce platform for customers and vendors",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <div className="app-container">
            <HeaderClient />
            <main>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
