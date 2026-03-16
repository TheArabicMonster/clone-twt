import { Prisma } from "@prisma/client";
import { Card, CardBody, Avatar } from "@heroui/react";
import Link from "next/link";
import ButtonLike from "@/components/ButtonLike";
import CommentButton from "@/components/CommentButton";
type TweetWithUser = Prisma.TweetGetPayload<{
  //Type custom pour inclure les données relatif au tweet pas contenu directement dans la table tweet
  include: { user: true; likes: true; _count: { select: { likes: true; comments: true } } };
}>;
export default function TweetCard({tweet}: {tweet: TweetWithUser}) {
    
return (
    <Card className="w-full rounded-none border-b border-gray-700 bg-transparent shadow-none">
        <CardBody className="flex flex-row gap-3 p-4">
            <Link href={`/profil/${tweet.user.username}`} className="flex-shrink-0">
                <Avatar
                    src={tweet.user.image ?? undefined}
                    size="md"
                />
            </Link>

            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex gap-2 items-center">
                    <Link href={`/profil/${tweet.user.username}`} className="hover:underline cursor-pointer">
                        <span className="text-white font-semibold">{tweet.user.pseudo}</span>
                    </Link>
                    <Link href={`/profil/${tweet.user.username}`} className="hover:underline cursor-pointer">
                        <span className="text-gray-400 text-sm">@{tweet.user.username}</span>
                    </Link>
                    <span className="text-gray-500 text-sm">
                        · {new Date(tweet.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                </div>
                <p className="text-white mt-1 break-words">{tweet.content}</p>
                <div className="flex flex-row items-start gap-1 mt-2 w-full">
                    <ButtonLike tweetId={tweet.id} initialLikes={tweet._count.likes} initialIsLiked={tweet.likes.length > 0} />
                    <div className="flex-1 min-w-0">
                        <CommentButton tweetId={tweet.id} initialComments={tweet._count.comments} />
                    </div>
                </div>
            </div>
        </CardBody>
    </Card>
)}