"use client";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  useDisclosure,
  Avatar,
  Spinner,
} from "@heroui/react";
import { MessageCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(350, "Le commentaire ne peut pas dépasser 350 caractères"),
});
type CommentFormData = z.infer<typeof commentSchema>;

type CommentAuthor = {
  id: string;
  name: string | null;
  pseudo: string;
  username: string;
  image: string | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: CommentAuthor;
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}s`;
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}j`;
  return date.toLocaleDateString("fr-FR");
}

export default function CommentButton({
  tweetId,
  initialComments,
}: {
  tweetId: string;
  initialComments: number;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [commentsCount, setCommentsCount] = useState(initialComments);
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const hasFetched = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const charCount = watch("content", "").length;

  async function fetchComments() {
    if (hasFetched.current) return;
    setIsFetching(true);
    setFetchError(false);
    try {
      const res = await fetch(`/api/tweets/${tweetId}/comment`);
      if (res.ok) {
        const data: Comment[] = await res.json();
        setComments(data);
        hasFetched.current = true;
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setIsFetching(false);
    }
  }

  function handleToggle() {
    if (!isExpanded && !hasFetched.current) {
      fetchComments();
    }
    setIsExpanded((prev) => !prev);
  }

  async function onSubmit(data: CommentFormData) {
    const res = await fetch(`/api/tweets/${tweetId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: data.content }),
    });
    if (res.ok) {
      setCommentsCount((prev) => prev + 1);
      hasFetched.current = false;
      if (isExpanded) {
        await fetchComments();
      }
      reset();
      onClose();
    }
  }

  return (
    <div className="flex flex-col w-full">
      {/* Action row */}
      <div className="flex items-center gap-1">
        <Button
          variant="light"
          size="sm"
          startContent={
            <MessageCircle
              size={16}
              className={isExpanded ? "text-blue-400" : "text-gray-400"}
            />
          }
          onPress={handleToggle}
          aria-expanded={isExpanded}
          aria-label={`${commentsCount} commentaires, cliquer pour ${isExpanded ? "masquer" : "afficher"}`}
          className={isExpanded ? "text-blue-400" : "text-gray-400"}
        >
          {commentsCount}
        </Button>

        <Button
          variant="light"
          size="sm"
          className="text-gray-400 text-xs px-2 min-w-0"
          startContent={<MessageCircle size={14} />}
          onPress={onOpen}
          aria-label="Rédiger une réponse"
        >
          Répondre
        </Button>
      </div>

      {/* Inline comments panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="mt-2 ml-10 border-l-2 border-gray-700 pl-3 flex flex-col gap-3 pb-2">
          {isFetching && (
            <div className="flex justify-center py-3">
              <Spinner size="sm" color="default" />
            </div>
          )}

          {!isFetching && fetchError && (
            <p className="text-red-400 text-sm py-2">
              Impossible de charger les réponses.
            </p>
          )}

          {!isFetching && !fetchError && comments.length === 0 && hasFetched.current && (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
              <MessageCircle size={14} />
              <span>Aucune réponse pour le moment.</span>
            </div>
          )}

          {!isFetching &&
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 py-1">
                <Avatar
                  src={comment.user.image ?? undefined}
                  size="sm"
                  className="flex-shrink-0 mt-0.5"
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-white text-sm font-semibold leading-none">
                      {comment.user.pseudo}
                    </span>
                    <span className="text-gray-400 text-xs leading-none">
                      @{comment.user.username}
                    </span>
                    <span className="text-gray-600 text-xs leading-none">
                      · {formatRelativeDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1 break-words leading-snug">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Reply modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>Répondre au tweet</ModalHeader>
            <ModalBody>
              <Textarea
                placeholder="Votre réponse..."
                minRows={3}
                maxRows={8}
                variant="bordered"
                isInvalid={!!errors.content}
                errorMessage={errors.content?.message}
                {...register("content")}
              />
              <div className="flex justify-end mt-1">
                <span
                  className={`text-xs tabular-nums ${
                    charCount > 320 ? "text-orange-400" : "text-gray-500"
                  }`}
                >
                  {charCount}/350
                </span>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Annuler
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                Répondre
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
