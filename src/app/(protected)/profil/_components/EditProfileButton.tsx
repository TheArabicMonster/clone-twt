"use client";

import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useMemo, useState } from "react";

type EditProfileButtonProps = {
  pseudo: string;
  bio: string | null;
  image: string | null;
};

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

export default function EditProfileButton({ pseudo, bio, image }: EditProfileButtonProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const [pseudoValue, setPseudoValue] = useState(pseudo);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(image ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingChars = useMemo(() => 350 - bioValue.length, [bioValue.length]);

  function resetForm() {
    setPseudoValue(pseudo);
    setBioValue(bio ?? "");
    setSelectedFile(null);
    setPreview(image ?? null);
    setError(null);
  }

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formats autorisés: JPG, PNG, WEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image trop lourde (max 4MB).");
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    setError(null);

    const trimmedPseudo = pseudoValue.trim();
    const trimmedBio = bioValue.trim();

    if (!trimmedPseudo) {
      setError("Le pseudo est requis.");
      return;
    }

    if (trimmedPseudo.length > 30) {
      setError("Le pseudo ne peut pas dépasser 30 caractères.");
      return;
    }

    if (trimmedBio.length > 350) {
      setError("La bio ne peut pas dépasser 350 caractères.");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageData: string | undefined;

      if (selectedFile) {
        imageData = await fileToDataUrl(selectedFile);
      }

      const response = await fetch("/api/users/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pseudo: trimmedPseudo,
          bio: trimmedBio,
          imageData,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "Erreur lors de la mise à jour du profil.");
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setError("Erreur lors de la mise à jour du profil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        color="primary"
        variant="flat"
        onPress={onOpen}
        className="font-semibold"
      >
        Modifier le profil
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} size="2xl" placement="center">
        <ModalContent>
          <>
            <ModalHeader>Modifier le profil</ModalHeader>
            <ModalBody className="gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Avatar src={preview ?? undefined} className="w-22 h-19" />
                <div className="w-full">
                  <label htmlFor="profile-image" className="text-sm text-gray-300 block mb-1">
                    Photo de profil
                  </label>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-blue-500 file:px-3 file:py-2 file:text-white hover:file:bg-blue-600"
                  />
                </div>
              </div>

              <Input
                label="Pseudo"
                value={pseudoValue}
                onChange={(event) => setPseudoValue(event.target.value)}
                maxLength={30}
              />

              <Textarea
                label="Bio"
                value={bioValue}
                onChange={(event) => setBioValue(event.target.value)}
                minRows={3}
                maxRows={8}
                maxLength={350}
              />

              <div className="text-xs text-gray-400 text-right">{remainingChars} caractères restants</div>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={handleClose} isDisabled={isSubmitting}>
                Annuler
              </Button>
              <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting}>
                Enregistrer
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
}
