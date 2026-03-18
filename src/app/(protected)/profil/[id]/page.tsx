import { auth } from "@/lib/auth";
import ProfilTabs from "../_components/ProfilTabs";
import FollowButton from "../_components/FollowButton";
import MessageButton from "../_components/MessageButton";
import EditProfileButton from "../_components/EditProfileButton";
import { prisma } from "@/lib/prisma";

export default async function Profil({params}: {params: Promise<{id: string}>}) {
    const session = await auth();
    const {id} = await params;
    const dataUser = await prisma.user.findUnique({
        where: { username: id }
    })
    const isOwner = !!session?.user && !!dataUser && session.user.id === dataUser.id;
    const followersCount = await prisma.follow.count({
        where: { followingId: dataUser?.id },
    });
    const followingCount = await prisma.follow.count({
        where: { followerId: dataUser?.id },
    })
    if(!session?.user || !dataUser){
        return <div>User not found</div>;
    }
    const isFollowing = await prisma.follow.findUnique({
        where:{
            followerId_followingId:{
                followerId: session?.user?.id,
                followingId: dataUser?.id
            }
        }
    })

    return (
        <div className="flex flex-col bg-gray-900 w-full h-[calc(100vh-1rem)] rounded-lg p-4 mt-2 mb-2 overflow-hidden">
            <div className="basis-1/3 flex flex-col items-center bg-gray-800 rounded-lg p-4">
                <div className="flex flex-row w-full h-full">
                    <div className="w-1/2 flex flex-row items-center">
                        <img src={dataUser?.image ?? "/default-profile.png"} className="w-32 h-32 rounded-full mr-4 self-center" />
                        <div className="self-center">
                            <h2 className="text-2xl font-bold text-white">{dataUser?.pseudo}</h2>
                            <p className="text-gray-400">@{dataUser?.username}</p>
                        </div>
                    </div>
                    <div className="w-1/2 flex items-center justify-center">
                        <div className="flex flex-col justify-start space-y-2">
                            <p className="text-white text-lg">{followersCount} abonnés</p>
                            <p className="text-white text-lg">{followingCount} abonnements</p>
                            {isOwner ? null : (
                                dataUser?.id &&(
                                    <>
                                        <FollowButton followingId={dataUser.id} isFollowing={!!isFollowing}/>
                                        <MessageButton userId={dataUser.id} />
                                    </>
                                )
                            )}
                            {isOwner ? (
                                <EditProfileButton
                                    pseudo={dataUser.pseudo}
                                    bio={dataUser.bio}
                                    image={dataUser.image}
                                />
                            ) : null}
                        </div>
                    </div>
                </div> 
               <div className="text-white text-md pb-2">{dataUser?.bio}</div> 
            </div>
            <div className="basis-2/3 flex flex-col items-center bg-gray-800 rounded-lg p-4 mt-4 w-full overflow-y-auto min-h-0">
                <ProfilTabs userId={dataUser.id} />
            </div>
            
        </div>
    );
}