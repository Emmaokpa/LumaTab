"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Download, ShoppingCart, Play, Star, Loader2 } from "lucide-react"
import { useWallpapers } from "@/hooks/use-wallpapers"
import { appwriteService } from "@/lib/appwrite"

interface WallpaperGridProps {
  searchQuery: string
  selectedCategory: string
  onAddToCart: (wallpaperId: string) => void
}

export function WallpaperGrid({ searchQuery, selectedCategory, onAddToCart }: WallpaperGridProps) {
  const [likedWallpapers, setLikedWallpapers] = useState<string[]>([])
  const { data: session } = useSession()

  const { wallpapers, loading, error, hasMore, loadMore } = useWallpapers(selectedCategory)

  // Filter wallpapers based on search query
  const filteredWallpapers = wallpapers.filter(
    (wallpaper) =>
      wallpaper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallpaper.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallpaper.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const toggleLike = async (wallpaperId: string) => {
    if (!session?.user) return

    try {
      const isLiked = likedWallpapers.includes(wallpaperId)

      if (isLiked) {
        setLikedWallpapers((prev) => prev.filter((id) => id !== wallpaperId))
        // Update likes count in Appwrite
        const wallpaper = wallpapers.find((w) => w.$id === wallpaperId)
        if (wallpaper) {
          await appwriteService.updateWallpaper(wallpaperId, {
            likes: Math.max(0, wallpaper.likes - 1),
          })
        }
      } else {
        setLikedWallpapers((prev) => [...prev, wallpaperId])
        // Update likes count in Appwrite
        const wallpaper = wallpapers.find((w) => w.$id === wallpaperId)
        if (wallpaper) {
          await appwriteService.updateWallpaper(wallpaperId, {
            likes: wallpaper.likes + 1,
          })
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleDownload = async (wallpaperId: string) => {
    try {
      const wallpaper = wallpapers.find((w) => w.$id === wallpaperId)
      if (wallpaper) {
        // Update download count
        await appwriteService.updateWallpaper(wallpaperId, {
          downloads: wallpaper.downloads + 1,
        })

        // Trigger download
        const link = document.createElement("a")
        link.href = wallpaper.imageUrl
        link.download = `${wallpaper.title}.jpg`
        link.click()
      }
    } catch (error) {
      console.error("Error downloading wallpaper:", error)
    }
  }

  if (loading && wallpapers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading wallpapers...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error loading wallpapers: {error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (filteredWallpapers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {searchQuery ? `No wallpapers found for "${searchQuery}"` : "No wallpapers found"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {filteredWallpapers.map((wallpaper, index) => {
          const heights = ["h-48", "h-56", "h-64", "h-72", "h-80"]
          const height = heights[index % heights.length]

          return (
            <div key={wallpaper.$id} className="break-inside-avoid mb-4 group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-card">
                <img
                  src={wallpaper.thumbnailUrl || wallpaper.imageUrl || "/placeholder.svg"}
                  alt={wallpaper.title}
                  className={`w-full ${height} object-cover transition-transform duration-300 group-hover:scale-105`}
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      onClick={() => toggleLike(wallpaper.$id)}
                      className={`${
                        likedWallpapers.includes(wallpaper.$id)
                          ? "bg-pink-500 hover:bg-pink-600"
                          : "bg-white/20 hover:bg-white/30"
                      } backdrop-blur-sm border-0 rounded-full w-10 h-10 p-0`}
                    >
                      <Heart className={`w-4 h-4 ${likedWallpapers.includes(wallpaper.$id) ? "fill-current" : ""}`} />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleDownload(wallpaper.$id)}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 rounded-full w-10 h-10 p-0"
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    {wallpaper.price > 0 && (
                      <Button
                        size="sm"
                        onClick={() => onAddToCart(wallpaper.$id)}
                        className="bg-primary hover:bg-primary/90 backdrop-blur-sm border-0 rounded-full w-10 h-10 p-0"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="absolute top-3 left-3 flex space-x-2">
                  {wallpaper.isLive && (
                    <Badge className="bg-primary text-primary-foreground border-0 rounded-full px-2 py-1 text-xs">
                      <Play className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  )}
                  {wallpaper.isPremium && (
                    <Badge className="bg-yellow-500 text-white border-0 rounded-full px-2 py-1 text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  <Badge
                    className={`${
                      wallpaper.price === 0 ? "bg-green-500 text-white" : "bg-white/90 text-gray-900"
                    } border-0 rounded-full px-2 py-1 text-xs font-medium`}
                  >
                    {wallpaper.price === 0 ? "Free" : `$${(wallpaper.price / 100).toFixed(2)}`}
                  </Badge>
                </div>
              </div>

              <div className="pt-3 px-1">
                <h3 className="font-medium text-sm text-foreground mb-1 text-balance">{wallpaper.title}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{wallpaper.creatorName}</span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>{wallpaper.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="w-3 h-3" />
                      <span>{wallpaper.downloads}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <Button onClick={loadMore} variant="outline" disabled={loading} className="rounded-full bg-transparent">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
