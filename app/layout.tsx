import type { Metadata } from 'next';
import { Lora, Inter } from 'next/font/google';
import { TRPCProvider } from '@/lib/trpc/Provider';
import { Layout } from '@/components/Layout';
import '@/styles/globals.css';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'dive',
  description: 'a personal reading tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${lora.variable} ${inter.variable}`}>
      <body>
        <TRPCProvider>
          <Layout>{children}</Layout>
        </TRPCProvider>
      </body>
    </html>
  );
}
