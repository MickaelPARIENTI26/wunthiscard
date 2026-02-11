import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          WinThisCard <span className="text-primary">Admin</span>
        </h1>
        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          Administration panel for managing competitions, users, and orders.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Sign In
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-4">
        <div className="rounded-lg border p-6 text-center">
          <div className="mb-4 text-4xl">📊</div>
          <h2 className="mb-2 text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            View analytics and KPIs
          </p>
        </div>
        <div className="rounded-lg border p-6 text-center">
          <div className="mb-4 text-4xl">🎴</div>
          <h2 className="mb-2 text-xl font-semibold">Competitions</h2>
          <p className="text-sm text-muted-foreground">
            Manage competitions and draws
          </p>
        </div>
        <div className="rounded-lg border p-6 text-center">
          <div className="mb-4 text-4xl">👥</div>
          <h2 className="mb-2 text-xl font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">
            User management and moderation
          </p>
        </div>
        <div className="rounded-lg border p-6 text-center">
          <div className="mb-4 text-4xl">📦</div>
          <h2 className="mb-2 text-xl font-semibold">Orders</h2>
          <p className="text-sm text-muted-foreground">
            Track orders and payments
          </p>
        </div>
      </div>

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>WinThisCard Admin Panel v1.0.0</p>
      </footer>
    </main>
  );
}
