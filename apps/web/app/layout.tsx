import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "FoodMap",
  description: "Discover restaurants ahead of you.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e8580c",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
