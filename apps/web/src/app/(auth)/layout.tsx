export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8 sm:py-12"
      style={{
        background: 'linear-gradient(180deg, #12151e 0%, #161a28 50%, #12151e 100%)',
      }}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
