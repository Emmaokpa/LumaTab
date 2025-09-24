'use client'

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Upload, User, Play, LogOut, Settings, Star, Sparkles } from "lucide-react"
import { WallpaperGrid } from "@/components/wallpaper-grid"
import { AuthModal } from "@/components/auth-modal"
import { UploadModal } from "@/components/upload-modal"
import { CheckoutModal } from "@/components/checkout-modal"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { appwriteService, User as AppwriteUser } from "@/lib/appwrite"

export default function LumaTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<AppwriteUser | null>(null)

  const { data: session, status } = useSession()
  const isLoggedIn = !!session?.user
  const isSubscribed = currentUser?.subscriptionStatus === 'active'

  useEffect(() => {
    const fetchUser = async () => {
      if (session?.user?.id) {
        try {
          const user = await appwriteService.getUser(session.user.id)
          setCurrentUser(user as unknown as AppwriteUser)
        } catch (err) {
          console.error('Failed to fetch user data:', err)
          setCurrentUser(null)
        }
      } else {
        setCurrentUser(null)
      }
    }

    fetchUser()
  }, [session])

  const handleSubscribe = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true)
    } else {
      setShowCheckoutModal(true)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-md opacity-90"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  LumaTab
                </h1>
                <p className="text-xs text-muted-foreground">Live Wallpapers</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search wallpapers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-border focus:border-primary rounded-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <DarkModeToggle />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadModal(true)}
                className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>

              {!isSubscribed && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSubscribe}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Go Pro
                </Button>
              )}

              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8" suppressHydrationWarning>
                        <AvatarImage src={session.user.image || "/placeholder.svg"} alt={session.user.name || ""} />
                        <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{session.user.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                      </div>
                    </div>
                    {isSubscribed && (
                      <DropdownMenuItem disabled>
                        <Star className="mr-2 h-4 w-4 text-yellow-500" />
                        <span>Pro Member</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full"
                  disabled={status === "loading"}
                >
                  <User className="w-4 h-4 mr-2" />
                  {status === "loading" ? "Loading..." : "Sign In"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: "all", name: "All", count: 1247 },
            { id: "nature", name: "Nature", count: 324 },
            { id: "abstract", name: "Abstract", count: 189 },
            { id: "minimal", name: "Minimal", count: 156 },
            { id: "space", name: "Space", count: 98 },
            { id: "city", name: "City", count: 234 },
            { id: "anime", name: "Anime", count: 167 },
          ].map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 rounded-full"
                  : "border-border text-foreground hover:bg-muted rounded-full"
              }
            >
              {category.name}
              <Badge variant="secondary" className="ml-2 text-xs rounded-full">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Featured Section */}
        {!isSubscribed && (
          <div className="mb-8">
            <Card className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 border-0 rounded-3xl">
              <CardContent className="p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Unlock LumaTab Pro</h2>
                    <p className="text-purple-100 mb-4">Access all premium and AI-generated wallpapers instantly.</p>
                    <Button onClick={handleSubscribe} className="bg-white text-purple-600 hover:bg-purple-50 rounded-full">
                      <Star className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-32 h-32 bg-white/20 rounded-3xl backdrop-blur-sm"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Wallpaper Grid */}
        <WallpaperGrid searchQuery={searchQuery} selectedCategory={selectedCategory} onSubscribe={handleSubscribe} />
      </div>

      {/* Modals */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        isLoggedIn={isLoggedIn}
        onLoginRequired={() => setShowAuthModal(true)}
      />
      <CheckoutModal open={showCheckoutModal} onOpenChange={setShowCheckoutModal} />
    </div>
  )
}
