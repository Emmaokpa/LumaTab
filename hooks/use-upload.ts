'use client'

import { useState } from "react"
import { appwriteService, User } from "@/lib/appwrite"
import { useSession } from "next-auth/react"

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const uploadWallpaper = async (
    file: File,
    title: string,
    description: string,
    category: string,
    tags: string[],
    price: number, 
    isPremium: boolean,
    isLive: boolean,
    isAiGenerated: boolean = false
  ) => {
    if (!session?.user) {
      throw new Error("You must be logged in to upload wallpapers")
    }

    try {
      setUploading(true)
      setError(null)

      const uploadedFile = await appwriteService.uploadFile(file)
      const imageUrl = appwriteService.getFileView(uploadedFile.$id)
      const thumbnailUrl = appwriteService.getFilePreview(uploadedFile.$id, 400, 300)

      let finalIsPremium = isPremium;

      if (isAiGenerated) {
        const currentUser = await appwriteService.getUser(session.user.id) as unknown as User;
        const currentAiCount = currentUser.aiImagesGenerated || 0;

        // Your rule: 10 paid, then 4 free. This is a cycle of 14.
        // If the position in the cycle is 0-9, it's premium.
        // If the position is 10, 11, 12, 13, it's free.
        if (currentAiCount % 14 < 10) {
            finalIsPremium = true;
        } else {
            finalIsPremium = false;
        }

        // IMPORTANT: We increment the user's count *after* creating the wallpaper
        // This prevents a race condition if the user generates images very quickly.
        // We will do this after the wallpaper is successfully created.
      }

      const wallpaper = await appwriteService.createWallpaper({
        title,
        description,
        imageUrl: imageUrl.toString(),
        thumbnailUrl: thumbnailUrl.toString(),
        category,
        tags,
        price: finalIsPremium ? 500 : 0, // Example price for premium
        isPremium: finalIsPremium,
        isLive, 
        creatorId: session.user.id!,
        creatorName: session.user.name!,
        creatorAvatar: session.user.image!,
      });

      // Now, update the user's count since the wallpaper was created successfully
      if (isAiGenerated) {
          const currentUser = await appwriteService.getUser(session.user.id) as unknown as User;
          const currentAiCount = currentUser.aiImagesGenerated || 0;
          await appwriteService.updateUser(session.user.id, {
            aiImagesGenerated: currentAiCount + 1,
          });
      }

      return wallpaper
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload wallpaper"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  return {
    uploadWallpaper,
    uploading,
    error,
  }
}
