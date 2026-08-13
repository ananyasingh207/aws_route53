import type { Metadata } from "next";
import "@cloudscape-design/global-styles/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amazon Route 53 Console",
  description: "AWS Route 53 Console Clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
