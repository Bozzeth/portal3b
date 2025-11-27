import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AmplifyProvider from "../components/AmplifyProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sevis Portal - PNG Digital Government Services",
  description: "Papua New Guinea's comprehensive digital government services providing citizens with seamless access to essential government services, identity verification, and credential issuance.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}
