"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { CldUploadWidget } from "next-cloudinary";

interface EditProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  currentBio: string;
  currentImage: string | null;
  onSaved: (data: {
    bio: string;
    image: string | null;
  }) => void;
}

export function EditProfileModal({
  isOpen,
  onOpenChange,
  username,
  currentBio,
  currentImage,
  onSaved,
}: EditProfileModalProps) {
  const [bio, setBio] = useState(currentBio);
  const [image, setImage] = useState(currentImage);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, image }),
      });

      if (res.ok) {
        const data = await res.json();
        onSaved({
          bio: data.bio ?? "",
          image: data.image,
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        <ModalHeader>Modifier le profil</ModalHeader>
        <ModalBody className="gap-4">
          {/* Photo de profil */}
          <div className="flex flex-col items-center gap-2">
            <Avatar
              src={image ?? undefined}
              name={username}
              className="h-24 w-24 text-large"
            />
            <CldUploadWidget
              uploadPreset="ml_default"
              options={{ maxFiles: 1, cropping: true, croppingAspectRatio: 1 }}
              onSuccess={(result) => {
                if (
                  typeof result.info === "object" &&
                  result.info !== null &&
                  "secure_url" in result.info
                ) {
                  setImage(result.info.secure_url as string);
                }
              }}
            >
              {({ open }) => (
                <Button size="sm" variant="bordered" onPress={() => open()}>
                  Changer la photo
                </Button>
              )}
            </CldUploadWidget>
          </div>

          {/* Bio */}
          <Textarea
            label="Bio"
            placeholder="Parlez de vous..."
            value={bio}
            onValueChange={setBio}
            maxLength={255}
            variant="bordered"
            classNames={{
              inputWrapper:
                "!border-white data-[hover=true]:!border-white group-data-[focus=true]:!border-white",
              input: "text-white placeholder:text-gray-400",
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button color="primary" isLoading={isSaving} onPress={handleSave}>
            Sauvegarder
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
