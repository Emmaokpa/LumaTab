"use client"

import { useState, useEffect } from "react"
import { appwriteService, type Wallpaper } from "@/lib/appwrite"

export function useWallpapers(category = "all", limit = 20) {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchWallpapers = async (offset = 0, reset = false) => {
    try {
      setLoading(true)
      const response = await appwriteService.getWallpapers(limit, offset, category)
      const newWallpapers = response.documents as Wallpaper[]

      if (reset) {
        setWallpapers(newWallpapers)
      } else {
        setWallpapers((prev) => [...prev, ...newWallpapers])
      }

      setHasMore(newWallpapers.length === limit)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch wallpapers")
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchWallpapers(wallpapers.length)
    }
  }

  const refresh = () => {
    fetchWallpapers(0, true)
  }

  useEffect(() => {
    fetchWallpapers(0, true)
  }, [category])

  return {
    wallpapers,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  }
}
