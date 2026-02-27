import type {Metadata} from 'next';
import { Inter, JetBrains_Mono, Montserrat } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'CANVASM TTS STUDIO',
  description: 'Professional Text-to-Speech System',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${montserrat.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
