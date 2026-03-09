import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SideBar from "@/components/SideBar";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <div className="flex h-screen">
        <SideBar />
        <div className="flex-1 min-w-0 overflow-y-auto">
            {children}
        </div>
    </div>;
}
