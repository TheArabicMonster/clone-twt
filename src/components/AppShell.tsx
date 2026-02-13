"use client";

import { Sidebar } from "@/components/Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  username?: string;
}

export function AppShell({ children, username }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar username={username} />
      <main className="ml-16 flex-1">{children}</main>
    </div>
  );
}
