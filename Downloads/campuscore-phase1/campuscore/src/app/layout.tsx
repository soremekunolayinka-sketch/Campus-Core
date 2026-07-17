import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusCore",
  description: "The digital workspace for university students.",
  authors: [{ name: "Soremekun Olayinka (Structyinks)" }]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <footer className="py-4 text-center text-xs text-slate-400">
          CampusCore — built by Structyinks for CESS, BOUESTI
        </footer>
      </body>
    </html>
  );
}
