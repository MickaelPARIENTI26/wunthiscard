import { HomeScreen } from '@/components/home/home-screen';
import { ComingSoonOverlay } from '@/components/home/coming-soon-overlay';

export const revalidate = 60;

export default function HomePage() {
  // Pre-launch gate: set COMING_SOON_MODE=on (Vercel env) to layer the
  // non-dismissable waiting-list overlay over the homepage. Flip it off (or
  // remove it) at launch — no code change needed. /test always renders the
  // ungated homepage for parallel testing while the gate is up.
  const comingSoon = process.env.COMING_SOON_MODE === 'on';

  return (
    <>
      {comingSoon && <ComingSoonOverlay />}
      <HomeScreen />
    </>
  );
}
