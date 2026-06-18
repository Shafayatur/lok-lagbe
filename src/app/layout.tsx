import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lok Lagbe? | লোক লাগবে?",
  description: "Bangladesh's trusted home service marketplace. Find plumbers, electricians, cleaners and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
