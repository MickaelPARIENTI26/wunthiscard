export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8 sm:py-12"
      style={{
        background: 'linear-gradient(180deg, oklch(0.06 0.02 270) 0%, oklch(0.08 0.02 270) 50%, oklch(0.06 0.02 270) 100%)',
      }}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
