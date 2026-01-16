import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auth0 Next.js Integration",
  description: "A Next.js app integrated with Auth0 authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
