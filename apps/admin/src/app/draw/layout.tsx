import { Orbitron, Outfit } from 'next/font/google';

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export default function DrawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${orbitron.variable} ${outfit.variable}`}>
      {children}
    </div>
  );
}
