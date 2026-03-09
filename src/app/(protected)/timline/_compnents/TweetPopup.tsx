"use client";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from "@heroui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const tweetSchema = z.object({
    content: z.string().min(1, "Le tweet ne peut pas être vide").max(350, "Le tweet ne peut pas dépasser 350 caractères"),
});
type TweetFormData = z.infer<typeof tweetSchema>;

export default function TweetPopup({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TweetFormData>({
        resolver: zodResolver(tweetSchema),
    });
    async function onSubmit(data: TweetFormData) {
        const res = await fetch("/api/tweets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: data.content }),
        });
        if (res.ok) {
            reset();
            onSuccess();
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ModalHeader>Rédiger un tweet</ModalHeader>
                    <ModalBody>
                        <Textarea
                            placeholder="Quoi de neuf?"
                            minRows={3}
                            variant="bordered"
                            isInvalid={!!errors.content}
                            errorMessage={errors.content?.message}
                            {...register("content")}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose}>Annuler</Button>
                        <Button color="primary" type="submit" isLoading={isSubmitting}>Poster</Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}