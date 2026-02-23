import { TimelineFeed } from "@/components/TimelineFeed";
import { auth } from "@/lib/auth";

export default async function TimelinePage() {
  const session = await auth();

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Timeline</h1>
      <TimelineFeed currentUserId={session?.user?.id} />
    </div>
  );
}
