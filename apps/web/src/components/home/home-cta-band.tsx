import Link from 'next/link';
import { Chip } from '@/components/ui/chip';

export function HomeCTABand() {
  return (
    <section
      style={{
        background: 'var(--ink)',
        color: 'var(--bg)',
        padding: '90px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <h2
          style={{
            fontFamily: 'var(--display)',
            fontSize: 'clamp(28px, 6.5vw, 82px)',
            letterSpacing: '-0.04em',
            fontWeight: 700,
            lineHeight: 0.95,
            margin: '0 0 20px',
            color: '#fff',
          }}
        >
          Ready to <Chip color="accent" className="!bg-[var(--accent)] !text-[var(--ink)] !rotate-[-1.5deg]">Enter</Chip>?
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '17px', margin: '0 0 32px', lineHeight: 1.5 }}>
          Create your free account and enter our live competitions.
        </p>

        <div className="flex flex-wrap justify-center gap-3" style={{ marginBottom: '20px' }}>
          <Link
            href="/register"
            className="inline-flex items-center justify-center font-semibold transition-all duration-150"
            style={{
              padding: '14px 22px', fontSize: '14px', borderRadius: '10px',
              background: 'var(--accent)', color: 'var(--ink)',
              border: '1.5px solid var(--ink)', boxShadow: 'var(--shadow-sm)',
            }}
          >
            Sign Up Free →
          </Link>
          <Link
            href="/competitions"
            className="inline-flex items-center justify-center font-semibold transition-all duration-150"
            style={{
              padding: '14px 22px', fontSize: '14px', borderRadius: '10px',
              background: 'transparent', color: '#fff',
              border: '1.5px solid #fff', boxShadow: '3px 3px 0 var(--accent)',
            }}
          >
            View Competitions
          </Link>
        </div>

        <p style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          18+ only · Free postal entry available · T&Cs apply
        </p>
      </div>
    </section>
  );
}
