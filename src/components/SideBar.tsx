"use client";
import { User, House, Mail } from "lucide-react";
import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SideBar() {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href;
    const session = useSession().data;

    return (
        <div className="ml-2 mt-2 mb-2 mr-4 w-14 h-[calc(100vh-1rem)] bg-gray-1000 p-2 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg outline-offset-2 flex flex-col">
            <div className="flex-1" />
            <div className="flex-1 flex flex-col justify-evenly items-center">
                <Button as={Link} href="/timline" isIconOnly variant="light"
                    className={`transition-all duration-300 rounded-md ${isActive("/timline") ? "bg-primary/60" : "bg-transparent"}`}>
                    <House className="text-white w-auto h-auto" size={40} strokeWidth={1.4} />
                </Button>                
                <Button as={Link} href={`/profil/${session?.user.username}`} isIconOnly variant="light"
                    className={`transition-all duration-300 rounded-md ${isActive(`/profil/${session?.user.username}`) ? "bg-primary/60" : "bg-transparent"}`}>
                    <User className="text-white w-auto h-auto" size={40} strokeWidth={1.4} />
                </Button>
                <Button as={Link} href="/messages" isIconOnly variant="light"
                    className={`transition-all duration-300 rounded-md ${isActive("/messages") ? "bg-primary/60" : "bg-transparent"}`}>
                    <Mail className="text-white w-auto h-auto" size={40} strokeWidth={1.4} />
                </Button>
            </div>
            <div className="flex-1" />
        </div>
    )
}