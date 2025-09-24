'use client'

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Upload, ImageIcon, Tag, Loader2, CheckCircle, AlertCircle, Wand2, Sparkles } from "lucide-react"
import { useUpload } from "@/hooks/use-upload"
import { appwriteService, User } from "@/lib/appwrite"

// ... (keep existing interfaces and utility functions)
interface UploadModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    isLoggedIn: boolean
    onLoginRequired: () => void
}

// A new component for the AI Generation Tab
const AiGenerator = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
    const [prompt, setPrompt] = useState("");
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state for when an image is generated
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");

    const { uploadWallpaper, uploading } = useUpload(); // We'll use this hook to save the generated image

    const handleGenerate = async () => {
        if (!prompt) {
            setError("Please enter a prompt.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedImageUrl(null);

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to generate image.");
            }

            const { imageUrl } = await response.json();
            setGeneratedImageUrl(imageUrl);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!generatedImageUrl || !title || !category) {
            setError("Please fill in all required fields to save the wallpaper.");
            return;
        }

        try {
            // We need to fetch the image and convert it to a File object
            const response = await fetch(generatedImageUrl);
            const blob = await response.blob();
            const file = new File([blob], `${title.replace(/\s+/g, '-')}.jpg`, { type: blob.type });

            const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);

            // All AI images are premium, so we set price and isPremium accordingly
            await uploadWallpaper(file, title, description, category, tagsArray, 0, true, false, true); // isAiGenerated = true
            
            onUploadComplete();

        } catch (err) {
            console.error("Failed to save AI wallpaper:", err);
            setError(err instanceof Error ? err.message : "Failed to save wallpaper.");
        }
    };

    return (
        <div className="space-y-6">
            {!generatedImageUrl ? (
                // Prompt input section
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="prompt">Describe the wallpaper you want to create</Label>
                        <Textarea
                            id="prompt"
                            placeholder="e.g., A neon-drenched cyberpunk city street at night, rain reflecting the glowing signs, cinematic, 8k"
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600">
                        {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><Wand2 className="mr-2 h-4 w-4" />Generate Image</>}
                    </Button>
                    {isGenerating && <p className="text-xs text-center text-muted-foreground">AI generation can take up to a minute. Please be patient.</p>}
                </div>
            ) : (
                // Save form section
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                         <img src={generatedImageUrl} alt="AI Generated Wallpaper" className="w-full h-auto object-cover"/>
                    </div>
                    
                    <h3 className="text-lg font-semibold pt-2">Save Your AI Wallpaper</h3>
                    
                    <div className="space-y-2">
                        <Label htmlFor="ai-title">Title *</Label>
                        <Input id="ai-title" placeholder="e.g., Cyberpunk Dreams" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ai-description">Description</Label>
                        <Textarea id="ai-description" placeholder="A stunning image of..." value={description} onChange={e => setDescription(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nature">Nature</SelectItem>
                                    <SelectItem value="abstract">Abstract</SelectItem>
                                    <SelectItem value="minimal">Minimal</SelectItem>
                                    <SelectItem value="space">Space</SelectItem>
                                    <SelectItem value="city">City</SelectItem>
                                    <SelectItem value="anime">Anime</SelectItem>
                                    <SelectItem value="ai-generated">AI Generated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ai-tags">Tags</Label>
                            <Input id="ai-tags" placeholder="cyberpunk, neon, rain" value={tags} onChange={e => setTags(e.target.value)} />
                        </div>
                    </div>

                    <Button type="submit" disabled={uploading} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Wallpaper"}
                    </Button>
                </form>
            )}
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>
    );
};

// The main Upload Modal component
export function UploadModal({ open, onOpenChange, isLoggedIn, onLoginRequired }: UploadModalProps) {
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { data: session } = useSession();

    useEffect(() => {
        const fetchUser = async () => {
            if (session?.user?.id) {
                const user = await appwriteService.getUser(session.user.id) as unknown as User;
                setCurrentUser(user);
            }
        };
        if (open) fetchUser();
    }, [session, open]);

    const isSubscribed = currentUser?.subscriptionStatus === 'active';

    const handleUploadComplete = () => {
        setUploadSuccess(true);
        setTimeout(() => {
            setUploadSuccess(false);
            onOpenChange(false);
        }, 2000);
    };

    const resetAndClose = () => {
        // Add any state resets needed for the file upload tab here
        onOpenChange(false);
    }

    if (!isLoggedIn) {
         // This logic remains, if the modal is opened while logged out, it prompts to log in.
        if(open) onLoginRequired();
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <span>Create Wallpaper</span>
                    </DialogTitle>
                </DialogHeader>

                {uploadSuccess ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Success!</h3>
                        <p className="text-muted-foreground">Your new wallpaper is now live!</p>
                    </div>
                ) : (
                    <Tabs defaultValue="ai-generate" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="ai-generate" disabled={!isSubscribed}>
                                <Wand2 className="w-4 h-4 mr-2"/> Generate with AI { !isSubscribed && "(Pro)"}
                            </TabsTrigger>
                            <TabsTrigger value="upload-file">
                                <Upload className="w-4 h-4 mr-2"/> Upload File
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="ai-generate" className="pt-6">
                            {isSubscribed ? (
                                <AiGenerator onUploadComplete={handleUploadComplete} />
                            ) : (
                                <div className="text-center py-12">
                                    <h3 className="font-semibold text-lg">This is a Pro Feature</h3>
                                    <p className="text-muted-foreground text-sm mt-2">Please subscribe to LumaTab Pro to generate images with AI.</p>
                                    {/* Optionally, add a button here to trigger the subscription modal */}
                                </div>
                            )}
                        </TabsContent>
                        
                        <TabsContent value="upload-file" className="pt-6">
                            {/* The original file upload form can be refactored into its own component if needed */}
                            {/* For now, we'll keep it here */}
                            <FileUploadForm onUploadComplete={handleUploadComplete} />
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

// The original upload form, refactored into its own component for clarity.
const FileUploadForm = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [isLive, setIsLive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadWallpaper, uploading, error } = useUpload()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !title || !category) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      const tagsArray = tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      // For user uploads, they are not premium by default and not AI generated.
      await uploadWallpaper(selectedFile, title, description, category, tagsArray, 0, false, isLive, false);
      onUploadComplete();
    } catch (err) {
      console.error("Upload failed:", err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
                <p className="text-sm text-muted-foreground mb-2">Drag and drop or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports: JPG, PNG, GIF, MP4</p>
                </>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4"
                onChange={handleFileSelect}
                className="hidden"
            />
            <Button type="button" variant="outline" className="mt-4 bg-transparent">Choose File</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
            <Label htmlFor="upload-title">Title *</Label>
            <Input id="upload-title" placeholder="Enter wallpaper title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
            <Label htmlFor="upload-description">Description</Label>
            <Textarea id="upload-description" placeholder="Describe your wallpaper..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
            <Label htmlFor="upload-tags">Tags</Label>
            <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input id="upload-tags" placeholder="sunset, tropical, beach" className="pl-10" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            </div>
        </div>

        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <Label>Live Wallpaper</Label>
                <p className="text-sm text-muted-foreground">This wallpaper has animation or video</p>
            </div>
            <Switch checked={isLive} onCheckedChange={setIsLive} />
        </div>

        {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
            </div>
        )}

        <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" disabled={uploading}>
            {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : "Upload Wallpaper"}
        </Button>
    </form>
  )
}
