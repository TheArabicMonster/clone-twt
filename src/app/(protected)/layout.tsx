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

  return <div className="flex">
        <SideBar />
        {children}
    </div>;
}
