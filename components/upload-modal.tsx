"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Upload, ImageIcon, DollarSign, Tag, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useUpload } from "@/hooks/use-upload"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoggedIn: boolean
  onLoginRequired: () => void
}

export function UploadModal({ open, onOpenChange, isLoggedIn, onLoginRequired }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [price, setPrice] = useState("")
  const [isLive, setIsLive] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: session } = useSession()

  const { uploadWallpaper, uploading, error } = useUpload()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn) {
      onLoginRequired()
      return
    }

    if (!selectedFile) {
      alert("Please select a file to upload")
      return
    }

    if (!title || !category) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
      const priceInCents = isPremium ? Math.round(Number.parseFloat(price || "0") * 100) : 0

      await uploadWallpaper(selectedFile, title, description, category, tagsArray, priceInCents, isPremium, isLive)

      setUploadSuccess(true)

      // Reset form
      setTimeout(() => {
        setSelectedFile(null)
        setTitle("")
        setDescription("")
        setCategory("")
        setTags("")
        setPrice("")
        setIsLive(false)
        setIsPremium(false)
        setUploadSuccess(false)
        onOpenChange(false)
      }, 2000)
    } catch (err) {
      console.error("Upload failed:", err)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setTitle("")
    setDescription("")
    setCategory("")
    setTags("")
    setPrice("")
    setIsLive(false)
    setIsPremium(false)
    setUploadSuccess(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetForm()
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-purple-500" />
            <span>Upload Wallpaper</span>
          </DialogTitle>
        </DialogHeader>

        {uploadSuccess ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Successful!</h3>
            <p className="text-muted-foreground">Your wallpaper has been uploaded and is now available.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Wallpaper File *</Label>
              <div
                className="border-2 border-dashed border-purple-200 dark:border-purple-700 rounded-lg p-8 text-center hover:border-purple-300 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium mb-1">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop your wallpaper here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">Supports: JPG, PNG, GIF, MP4 (for live wallpapers)</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button type="button" variant="outline" className="mt-4 bg-transparent">
                  Choose File
                </Button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter wallpaper title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your wallpaper..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Category and Tags */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nature">Nature</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="space">Space</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="anime">Anime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="tags"
                    placeholder="sunset, tropical, beach"
                    className="pl-10"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Live Wallpaper</Label>
                  <p className="text-sm text-muted-foreground">This wallpaper has animation or video</p>
                </div>
                <Switch checked={isLive} onCheckedChange={setIsLive} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Premium Content</Label>
                  <p className="text-sm text-muted-foreground">Charge users for this wallpaper</p>
                </div>
                <Switch checked={isPremium} onCheckedChange={setIsPremium} />
              </div>

              {isPremium && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.99"
                      placeholder="2.99"
                      className="pl-10"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Wallpaper"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
