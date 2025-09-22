"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Upload, User, ShoppingCart, Play, LogOut, Settings } from "lucide-react"
import { WallpaperGrid } from "@/components/wallpaper-grid"
import { AuthModal } from "@/components/auth-modal"
import { UploadModal } from "@/components/upload-modal"
import { CheckoutModal } from "@/components/checkout-modal"
import { DarkModeToggle } from "@/components/dark-mode-toggle"

export default function LumaTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [cartItems, setCartItems] = useState<string[]>([])

  const { data: session, status } = useSession()
  const isLoggedIn = !!session?.user

  const addToCart = (wallpaperId: string) => {
    setCartItems((prev) => [...prev, wallpaperId])
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

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCheckoutModal(true)}
                className="relative rounded-full"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartItems.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-pink-500 text-white text-xs rounded-full">
                    {cartItems.length}
                  </Badge>
                )}
              </Button>

              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image || "/placeholder.svg"} alt={session.user.name} />
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
        <div className="mb-8">
          <Card className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 border-0 rounded-3xl">
            <CardContent className="p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Premium Live Wallpapers</h2>
                  <p className="text-purple-100 mb-4">Discover stunning animated wallpapers from top creators</p>
                  <Button className="bg-white text-purple-600 hover:bg-purple-50 rounded-full">
                    <Play className="w-4 h-4 mr-2" />
                    Explore Premium
                  </Button>
                </div>
                <div className="hidden md:block">
                  <div className="w-32 h-32 bg-white/20 rounded-3xl backdrop-blur-sm"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallpaper Grid */}
        <WallpaperGrid searchQuery={searchQuery} selectedCategory={selectedCategory} onAddToCart={addToCart} />
      </div>

      {/* Modals */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        isLoggedIn={isLoggedIn}
        onLoginRequired={() => setShowAuthModal(true)}
      />
      <CheckoutModal
        open={showCheckoutModal}
        onOpenChange={setShowCheckoutModal}
        cartItems={cartItems}
        onClearCart={() => setCartItems([])}
      />
    </div>
  )
}
