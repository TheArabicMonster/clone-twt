import { auth } from "@/lib/auth";
import { HomeContent } from "@/components/HomeContent";

export default async function Home() {
  const session = await auth();

  return (
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
  );
}
