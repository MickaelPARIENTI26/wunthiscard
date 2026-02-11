export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-muted/30 px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
