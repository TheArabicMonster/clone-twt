"use client";
import { useEffect, useState } from "react";
import { User, House, Mail, LogOut } from "lucide-react";
import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Pusher from "pusher-js";

export default function SideBar() {
    const pathname = usePathname();
    const session = useSession().data;
    const username = session?.user.username;
    const userId = session?.user?.id;

    const [hasUnread, setHasUnread] = useState(false);

    // Subscribe to Pusher user channel when outside /messages
    useEffect(() => {
        if (!userId || pathname === "/messages") return;

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        const channel = pusher.subscribe(`user-${userId}`);
        channel.bind("new-message", () => {
            setHasUnread(true);
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`user-${userId}`);
            pusher.disconnect();
        };
    }, [userId, pathname]);

    // Clear badge when user navigates to /messages
    useEffect(() => {
        if (pathname === "/messages") {
            setHasUnread(false);
        }
    }, [pathname]);

    const isActive = (href: string) => pathname === href;

    const navBtnClass = (href: string) =>
        `transition-all duration-200 rounded-lg ${
            isActive(href)
                ? "bg-primary/20"
                : "bg-transparent hover:bg-white/10"
        }`;

    return (
        <aside
            aria-label="Navigation principale"
            className="ml-2 mt-2 mb-2 mr-4 w-14 h-[calc(100vh-1rem)] bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg p-2 flex flex-col"
        >
            {/* Top spacer — pushes nav to vertical center */}
            <div className="flex-1" />

            {/* Main navigation */}
            <nav className="flex flex-col items-center gap-2" aria-label="Menu principal">
                <Button
                    as={Link}
                    href="/timline"
                    isIconOnly
                    variant="light"
                    title="Accueil"
                    aria-label="Accueil"
                    aria-current={isActive("/timline") ? "page" : undefined}
                    className={navBtnClass("/timline")}
                >
                    <House
                        className={isActive("/timline") ? "text-primary" : "text-white"}
                        size={22}
                        strokeWidth={1.6}
                    />
                </Button>

                <Button
                    as={Link}
                    href={`/profil/${username}`}
                    isIconOnly
                    variant="light"
                    title="Mon profil"
                    aria-label="Mon profil"
                    aria-current={isActive(`/profil/${username}`) ? "page" : undefined}
                    className={navBtnClass(`/profil/${username}`)}
                >
                    <User
                        className={isActive(`/profil/${username}`) ? "text-primary" : "text-white"}
                        size={22}
                        strokeWidth={1.6}
                    />
                </Button>

                <Button
                    as={Link}
                    href="/messages"
                    isIconOnly
                    variant="light"
                    title="Messages"
                    aria-label="Messages"
                    aria-current={isActive("/messages") ? "page" : undefined}
                    className={navBtnClass("/messages")}
                >
                    <div className="relative">
                        <Mail
                            className={isActive("/messages") ? "text-primary" : "text-white"}
                            size={22}
                            strokeWidth={1.6}
                        />
                        {hasUnread && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900" />
                        )}
                    </div>
                </Button>
            </nav>

            {/* Bottom spacer — keeps nav centered */}
            <div className="flex-1" />

            {/* Logout — truly pinned to the bottom of the sidebar */}
            <div className="flex justify-center pb-1">
                <Button
                    isIconOnly
                    variant="light"
                    title="Se déconnecter"
                    aria-label="Se déconnecter"
                    onPress={() => signOut({ callbackUrl: "/login" })}
                    className="transition-all duration-200 rounded-lg bg-transparent hover:bg-danger/20"
                >
                    <LogOut className="text-danger" size={22} strokeWidth={1.6} />
                </Button>
            </div>
        </aside>
    );
}
