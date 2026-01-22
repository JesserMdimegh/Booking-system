'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginPage from './authentication/login/page';
import ProvidersPage from './dashboard/providers/page';
import HomePage from './home/page';
import { SessionProvider } from 'next-auth/react';
import DashboardPage from './dashboard/page';

export default function Home() {
  return (
    <div>
      <SessionProvider>
        <DashboardPage />
      </SessionProvider>
    </div>
  );
}
