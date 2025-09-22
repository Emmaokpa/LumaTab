"use client"

import { useState } from "react"
import { appwriteService } from "@/lib/appwrite"
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
  ) => {
    if (!session?.user) {
      throw new Error("You must be logged in to upload wallpapers")
    }

    try {
      setUploading(true)
      setError(null)

      // Upload the image file
      const uploadedFile = await appwriteService.uploadFile(file)

      // Get URLs for the uploaded file
      const imageUrl = appwriteService.getFileView(uploadedFile.$id)
      const thumbnailUrl = appwriteService.getFilePreview(uploadedFile.$id, 400, 300)

      // Create wallpaper document
      const wallpaper = await appwriteService.createWallpaper({
        title,
        description,
        imageUrl: imageUrl.toString(),
        thumbnailUrl: thumbnailUrl.toString(),
        category,
        tags,
        price,
        isPremium,
        isLive,
        creatorId: session.user.id!,
        creatorName: session.user.name!,
        creatorAvatar: session.user.image!,
      })

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
