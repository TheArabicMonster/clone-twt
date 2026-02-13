import { auth } from "@/lib/auth";
import { HomeContent } from "@/components/HomeContent";
import { AppShell } from "@/components/AppShell";

export default async function Home() {
  const session = await auth();

  return (
    <AppShell username={session?.user?.username}>
      <HomeContent
        user={
          session?.user
            ? {
                pseudo: session.user.pseudo,
                email: session.user.email,
                username: session.user.username,
              }
            : null
        }
      />
    </AppShell>
  );
}
