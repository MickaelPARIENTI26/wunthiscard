import type { Metadata } from 'next';
import { HomeScreen } from '@/components/home/home-screen';

// Ungated copy of the homepage, used to keep testing the real site while the
// coming-soon gate is up on `/`. Never indexed.
export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

export const revalidate = 60;

export default function TestHomePage() {
  return <HomeScreen />;
}
