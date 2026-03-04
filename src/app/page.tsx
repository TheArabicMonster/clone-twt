import { auth } from "@/lib/auth";
import HomeButtons from "@/components/HomeButtons";
import { redirect } from "next/navigation";
export default async function Home() {
  const session = await auth();
  if (session) {
    redirect(`/profil/${session.user.username}`);
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Twitter Clone</h1>
          <p className="mt-2 text-lg text-default-500">
            Bienvenue sur votre réseau social
          </p>
        </div>
        <HomeButtons />
      </div>
    </div>
  );
}
