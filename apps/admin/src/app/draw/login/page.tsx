import { Suspense } from 'react';
import { DrawLoginForm } from './draw-login-form';

export default function DrawLoginPage() {
  return (
    <Suspense fallback={<DrawLoginSkeleton />}>
      <DrawLoginForm />
    </Suspense>
  );
}

function DrawLoginSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#050508' }}>
      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl"
              style={{ backgroundColor: '#FFD700', color: '#050508' }}
            >
              W
            </div>
            <span className="text-2xl font-bold text-white">
              Win<span style={{ color: '#FFD700' }}>This</span>Card
            </span>
          </div>
        </div>
        <div
          className="rounded-2xl p-8 border animate-pulse"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 215, 0, 0.2)'
          }}
        >
          <div className="h-8 bg-white/10 rounded mb-4 w-3/4 mx-auto" />
          <div className="h-4 bg-white/10 rounded mb-8 w-1/2 mx-auto" />
          <div className="space-y-6">
            <div className="h-12 bg-white/10 rounded" />
            <div className="h-12 bg-white/10 rounded" />
            <div className="h-14 bg-yellow-500/20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
