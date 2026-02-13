"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Pen } from "lucide-react";

interface ComposeTweetProps {
  onTweetCreated?: () => void;
}

export function ComposeTweet({ onTweetCreated }: ComposeTweetProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const charCount = content.length;
  const maxChars = 280;

  const handleSubmit = async (onClose: () => void) => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setContent("");
      onClose();
      onTweetCreated?.();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant rond en bas à droite */}
      <Button
        isIconOnly
        color="primary"
        size="lg"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        onPress={onOpen}
        title="Rédiger un tweet"
      >
        <Pen size={24} />
      </Button>

      {/* Modal de rédaction */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Nouveau tweet</ModalHeader>
              <ModalBody>
                {error && (
                  <p className="text-sm text-danger">{error}</p>
                )}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Quoi de neuf ?"
                  maxLength={maxChars}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-default-200 bg-transparent p-3 text-foreground placeholder:text-default-400 focus:border-primary focus:outline-none"
                />
                <p
                  className={`text-right text-sm ${
                    charCount > maxChars - 20
                      ? "text-danger"
                      : "text-default-400"
                  }`}
                >
                  {charCount}/{maxChars}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button
                  color="primary"
                  onPress={() => handleSubmit(onClose)}
                  isLoading={isLoading}
                  isDisabled={!content.trim() || charCount > maxChars}
                >
                  Tweeter
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
