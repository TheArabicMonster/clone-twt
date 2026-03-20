"use client";
import { useState, ChangeEvent } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, useDisclosure, Avatar } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type EditProfileButtonProps = {
  pseudo: string;
  bio: string | null;
  image: string | null;
};

export default function EditProfileButton({ pseudo, bio, image }: EditProfileButtonProps) {
    const { onOpen, isOpen, onOpenChange, onClose } = useDisclosure();
    const router = useRouter();
    
    const { data: session } = useSession();

    const [pseudoValue, setPseudoValue] = useState(pseudo);
    const [bioValue, setBioValue] = useState(bio ?? "");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(image ?? null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation taille et type
        if (!file.type.startsWith("image/")) {
            setError("Veuillez sélectionner une image valide");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("L'image ne doit pas dépasser 5MB");
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setError(null);
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let imageUrl = image;

            // Upload image si changée
            if (imageFile) {
                const formData = new FormData();
                formData.append("file", imageFile);
                
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error("Erreur lors de l'upload de l'image");
                }

                const uploadData = (await uploadRes.json()) as { secure_url?: string };
                imageUrl = uploadData.secure_url ?? image;
            }

            // Mettre à jour profil
            const res = await fetch(`/api/users/${session?.user.username}/profile`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pseudo: pseudoValue.trim(),
                    bio: bioValue.trim(),
                    image: imageUrl,
                }),
            });

            if (!res.ok) {
                const payload = (await res.json().catch(() => null)) as { error?: string } | null;
                setError(payload?.error ?? "Erreur lors de la mise à jour");
                return;
            }

            onClose();
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setPseudoValue(pseudo);
        setBioValue(bio ?? "");
        setImageFile(null);
        setImagePreview(image ?? null);
        setError(null);
        onClose();
    };

    return (
    <>
        <Button color="primary" size="md" onPress={onOpen}>
            Editer le profil
        </Button>

        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Modifier le profil</ModalHeader>
                <ModalBody className="gap-4">
                    {/* Section Avatar */}
                    <div className="flex flex-col gap-3 items-center">
                        <Avatar 
                            src={imagePreview ?? undefined} 
                            className="w-24 h-24"
                            alt="Avatar profil"
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <Button 
                                size="sm" 
                                variant="bordered"
                                as="span"
                            >
                                Changer l'image
                            </Button>
                        </label>
                    </div>

                    {/* Section Infos */}
                    <div className="flex flex-col gap-4">
                        <Input
                            label="Pseudo"
                            value={pseudoValue}
                            onChange={(e) => setPseudoValue(e.target.value)}
                            maxLength={30}
                            description="Max 30 caractères"
                        />
                        <Textarea
                            label="Bio"
                            value={bioValue}
                            onChange={(e) => setBioValue(e.target.value)}
                            maxLength={350}
                            minRows={3}
                            maxRows={6}
                            description={`${bioValue.length}/350 caractères`}
                        />
                    </div>

                    {/* Message erreur */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                            {error}
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button 
                        color="danger" 
                        variant="light" 
                        onPress={handleClose}
                        isDisabled={isLoading}
                    >
                        Annuler
                    </Button>
                    <Button 
                        color="primary" 
                        onPress={handleSave}
                        isLoading={isLoading}
                    >
                        Enregistrer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>        
    </>
    );
}