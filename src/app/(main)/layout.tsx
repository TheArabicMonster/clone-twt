import { auth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return <AppShell username={session?.user?.username}>{children}</AppShell>;
}
