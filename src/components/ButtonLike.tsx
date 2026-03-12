"use client";
import { Button } from "@heroui/react";
import { Heart } from "lucide-react";
import { useState } from "react";
export default function ButtonLike({ tweetId, initialLikes, initialIsLiked }: { tweetId: string, initialLikes: number, initialIsLiked: boolean }) {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likesCount, setLikesCount] = useState(initialLikes);
    async function handleLike() {
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
      await fetch(`/api/tweets/${tweetId}/like`, {
        method: isLiked ? "DELETE" : "POST",
      });
    }

    return (
      <Button
        variant="light"
        size="sm"
        startContent={
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
        }
        onPress={handleLike}
      >
        {likesCount}
      </Button>
    );
}
