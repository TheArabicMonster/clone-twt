import { auth } from "@/lib/auth";
import ProfilTabs from "./_components/ProfilTabs";

export default async function Profil() {
    const session = await auth();
    return (
        <div className="flex flex-col bg-gray-900 w-full h-[calc(100vh-1rem)] rounded-lg p-4 mt-2 mb-2">
            <div className="basis-1/3 flex flex-col items-center bg-gray-800 rounded-lg p-4">

            </div>
            <div className="basis-2/3 flex flex-col items-center bg-gray-800 rounded-lg p-4 mt-4 w-full">
                <ProfilTabs />
            </div>
        </div>
    );
}