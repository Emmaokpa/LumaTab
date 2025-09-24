import { Client, Account, Databases, Storage, Query } from "appwrite"

const client = new Client()

client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

// Database and Collection IDs
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
export const WALLPAPERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_WALLPAPERS_COLLECTION_ID!
export const USERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!
export const ORDERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!
export const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!

// Types
export interface Wallpaper {
  $id: string
  title: string
  description: string
  imageUrl: string
  thumbnailUrl: string
  category: string
  tags: string[]
  price: number
  isPremium: boolean
  isLive: boolean
  creatorId: string
  creatorName: string
  creatorAvatar: string
  downloads: number
  likes: number
  createdAt: string
}

export interface User {
  aiImagesGenerated: number
  $id: string
  email: string
  name: string
  avatar: string
  isCreator: boolean
  totalEarnings: number
  totalSales: number
  createdAt: string
  subscriptionStatus?: string
  subscriptionId?: string
  subscriptionEndDate?: string
}

export interface Order {
  $id: string
  userId: string
  wallpaperId: string
  amount: number
  status: "pending" | "completed" | "failed"
  paddleOrderId: string
  createdAt: string
}

// Appwrite service functions
export const appwriteService = {
  // Wallpapers
  async getWallpapers(limit = 20, offset = 0, category?: string) {
    const queries = [Query.limit(limit), Query.offset(offset), Query.orderDesc("createdAt")]
    if (category && category !== "all") {
      queries.push(Query.equal("category", category))
    }

    return await databases.listDocuments(DATABASE_ID, WALLPAPERS_COLLECTION_ID, queries)
  },

  async getWallpaper(id: string) {
    return await databases.getDocument(DATABASE_ID, WALLPAPERS_COLLECTION_ID, id)
  },

  async createWallpaper(data: Omit<Wallpaper, "$id" | "createdAt" | "downloads" | "likes">) {
    return await databases.createDocument(DATABASE_ID, WALLPAPERS_COLLECTION_ID, "unique()", {
      ...data,
      downloads: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
    })
  },

  async updateWallpaper(id: string, data: Partial<Wallpaper>) {
    return await databases.updateDocument(DATABASE_ID, WALLPAPERS_COLLECTION_ID, id, data)
  },

  async deleteWallpaper(id: string) {
    return await databases.deleteDocument(DATABASE_ID, WALLPAPERS_COLLECTION_ID, id)
  },

  // Users
  async getUser(id: string) {
    return await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, id)
  },

  async getUserByEmail(email: string) {
    const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal("email", email),
    ]);
    return response.documents[0];
  },

  async createUser(id: string, data: Omit<User, "$id" | "createdAt">) {
    return await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, id, {
      ...data,
      createdAt: new Date().toISOString(),
    });
  },

  async updateUser(id: string, data: Partial<User>) {
    return await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, id, data)
  },

  // Orders
  async createOrder(data: Omit<Order, "$id" | "createdAt">) {
    return await databases.createDocument(DATABASE_ID, ORDERS_COLLECTION_ID, "unique()", {
      ...data,
      createdAt: new Date().toISOString(),
    })
  },

  async getOrdersByUser(userId: string) {
    return await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("createdAt"),
    ])
  },

  async updateOrder(id: string, data: Partial<Order>) {
    return await databases.updateDocument(DATABASE_ID, ORDERS_COLLECTION_ID, id, data)
  },

  // File Storage
  async uploadFile(file: File) {
    return await storage.createFile(STORAGE_BUCKET_ID, "unique()", file)
  },

  async deleteFile(fileId: string) {
    return await storage.deleteFile(STORAGE_BUCKET_ID, fileId)
  },

  getFilePreview(fileId: string, width = 400, height = 300) {
    return storage.getFilePreview(STORAGE_BUCKET_ID, fileId, width, height)
  },

  getFileView(fileId: string) {
    return storage.getFileView(STORAGE_BUCKET_ID, fileId)
  },
}
