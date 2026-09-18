import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devansh Mishra — Cloud, DevOps & Salesforce",
  description: "Personal portfolio of Devansh Mishra: cloud and DevOps explorer, Salesforce builder, and hackathon tinkerer."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
