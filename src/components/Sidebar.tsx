"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, MessageCircle, Home, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@heroui/button";

interface SidebarProps {
  username?: string;
}

const navItems = [
  { href: "/timeline", icon: Home, label: "Timeline" },
  { href: "/messages", icon: MessageCircle, label: "Messages" },
];

export function Sidebar({ username }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-16 flex-col items-center border-r border-default-200 bg-background py-6">
      {/* Navigation principale */}
      <nav className="flex flex-1 flex-col items-center justify-center gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              as={Link}
              href={item.href}
              isIconOnly
              variant={isActive ? "solid" : "light"}
              color={isActive ? "primary" : "default"}
              className={`h-12 w-12 ${isActive
                  ? ""
                  : "text-default-500 hover:bg-default-100 hover:text-foreground"
                }`}
              title={item.label}
            >
              <item.icon size={24} />
            </Button>
          );
        })}

        {/* Profil */}
        {username && (
          <Button
            as={Link}
            href={`/profile/${username}`}
            isIconOnly
            variant={pathname.startsWith("/profile") ? "solid" : "light"}
            color={pathname.startsWith("/profile") ? "primary" : "default"}
            className={`h-12 w-12 ${pathname.startsWith("/profile")
                ? ""
                : "text-default-500 hover:bg-default-100 hover:text-foreground"
              }`}
            title="Profil"
          >
            <User size={24} />
          </Button>
        )}
      </nav>

      {/* Déconnexion */}
      <Button
        isIconOnly
        variant="light"
        onPress={() => signOut({ callbackUrl: "/login" })}
        className="h-12 w-12 text-default-500 hover:bg-danger-50 hover:text-danger"
        title="Déconnexion"
      >
        <LogOut size={24} />
      </Button>
    </aside>
  );
}
