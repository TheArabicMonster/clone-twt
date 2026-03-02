import { auth } from "@/lib/auth";
import { use } from "react";
export default async function Profil() {
    const session = await auth();
    return (
        <div>
            <h1 className="text-4xl font-bold">Profil</h1>
            <p className="text-lg text-default-500">{session?.user?.pseudo}</p>
            <p className="text-lg text-default-500">{session?.user?.email}</p>
            <p className="text-lg text-default-500">{session?.user?.username}</p>
        </div>
    );
}