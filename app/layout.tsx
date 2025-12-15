import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Cpu, Sparkles } from "lucide-react";
import Link from "next/link";
import "./globals.css";
import LogoutButton from "@/components/LogoutButton";
import { Providers } from "@/components/Providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BetAI Predictor",
  description: "Interface de IA futurista para análise de futebol",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.isAdmin === true;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetBrainsMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <Providers>
          <header className="glow sticky top-0 z-50 border-b border-electric-purple/40 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80">
                <Cpu className="h-5 w-5 text-neon-cyan" />
                <span className="text-sm font-medium tracking-wider uppercase">BetAI Predictor</span>
              </Link>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-neon-cyan/40 px-3 py-1 text-xs text-neon-cyan/90">ATIVO</span>
                {isAdmin ? (
                  <a
                    href="/admin"
                    className="rounded-full border border-electric-purple/40 px-3 py-1 text-xs text-electric-purple hover:bg-black/50"
                  >
                    ADMIN
                  </a>
                ) : null}
                <Sparkles className="h-4 w-4 text-electric-purple" />
                <LogoutButton />
              </div>
            </div>
          </header>
          <main className="min-h-[calc(100vh-56px)]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
