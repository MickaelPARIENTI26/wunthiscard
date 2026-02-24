import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8 sm:py-12"
      style={{
        background: '#F7F7FA',
      }}
    >
      {/* Subtle golden blob */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 30%, rgba(240, 185, 11, 0.06), transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            {/* Gold square with W */}
            <div
              className="flex items-center justify-center"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #F0B90B 0%, #E8A000 100%)',
                boxShadow: '0 4px 12px rgba(240, 185, 11, 0.3)',
              }}
            >
              <span
                style={{
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-outfit)',
                }}
              >
                W
              </span>
            </div>
            {/* Text */}
            <span
              className="font-[family-name:var(--font-outfit)]"
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: '#1a1a2e',
              }}
            >
              WinUCard
            </span>
          </Link>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
