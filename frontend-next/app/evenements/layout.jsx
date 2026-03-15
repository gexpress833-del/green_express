'use client';

import RequireAuth from '@/components/RequireAuth';

export default function EvenementsLayout({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}
