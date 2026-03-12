import { Prisma } from "@prisma/client";
import { Card, CardBody, Avatar } from "@heroui/react";
import ButtonLike from "@/components/ButtonLike";
import ButtonComment from "@/components/ButtonComment";
type TweetWithUser = Prisma.TweetGetPayload<{
  //Type custom pour inclure les données relatif au tweet pas contenu directement dans la table tweet
  include: { user: true; likes: true; _count: { select: { likes: true; comments: true } } };
}>;
export default function TweetCard({tweet}: {tweet: TweetWithUser}) {
    
return (
    <Card className="w-full rounded-none border-b border-gray-700 bg-transparent shadow-none">
        <CardBody className="flex flex-row gap-3 p-4">
            <Avatar
                src={tweet.user.image ?? undefined}
                size="md"
            />

            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex gap-2 items-center">
                    <span className="text-white font-semibold">{tweet.user.pseudo}</span>
                    <span className="text-gray-400 text-sm">@{tweet.user.username}</span>
                    <span className="text-gray-500 text-sm">
                        · {new Date(tweet.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                </div>
                <p className="text-white mt-1 break-words">{tweet.content}</p>
                <div className="flex gap-2 mt-2">
                    <ButtonLike tweetId={tweet.id} initialLikes={tweet._count.likes} initialIsLiked={tweet.likes.length > 0} />
                    <ButtonComment tweetId={tweet.id} initialComments={tweet._count.comments} />
                </div>
            </div>
        </CardBody>
    </Card>
)}