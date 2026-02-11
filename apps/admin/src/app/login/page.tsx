import { Suspense } from 'react';
import { LoginForm } from './login-form';
import { Loader2 } from 'lucide-react';

function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
