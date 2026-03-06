"use client";
import React from "react";
import { Button } from "@heroui/react";
export default function FollowButton({followingId, isFollowing}: {followingId: string, isFollowing: boolean}) {
    const [isFollowingState, setIsFollowingState] = React.useState(isFollowing);
    return (
        <Button color="primary" variant={isFollowingState ? "bordered" : "flat"} 
            className="w-full text-primary-600" 
            onClick={() => {
                setIsFollowingState(!isFollowingState);
                fetch(`/api/follow/${followingId}`, { 
                    method: isFollowingState ? "DELETE" : "POST"
                }).then(res => {
                    if (!res.ok) {
                        setIsFollowingState(isFollowingState);
                    }
                }).catch(() => {
                    setIsFollowingState(isFollowingState);
                });
            }}>
            {isFollowingState ? "Ne plus suivre" : "Suivre"}
        </Button>
    );
}