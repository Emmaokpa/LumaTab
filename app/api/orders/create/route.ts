import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { appwriteService } from "@/lib/appwrite"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { wallpaperIds, userEmail } = await request.json()

    if (!wallpaperIds || !Array.isArray(wallpaperIds) || wallpaperIds.length === 0) {
      return NextResponse.json({ error: "Invalid wallpaper IDs" }, { status: 400 })
    }

    // Get wallpaper details
    const wallpapers = await Promise.all(wallpaperIds.map((id) => appwriteService.getWallpaper(id)))

    // Calculate total amount
    const totalAmount = wallpapers.reduce((sum, wallpaper) => sum + wallpaper.price, 0)

    // Create order in Appwrite
    const order = await appwriteService.createOrder({
      userId: session.user.id!,
      wallpaperId: wallpaperIds.join(","), // Store multiple IDs as comma-separated
      amount: totalAmount * 100, // Convert to cents
      status: "pending",
      paddleOrderId: "", // Will be updated after Paddle checkout
    })

    // Prepare Paddle checkout items
    const paddleItems = wallpapers.map((wallpaper) => ({
      priceId: process.env.PADDLE_PRICE_ID!, // You'll need to create price IDs in Paddle
      quantity: 1,
      name: wallpaper.title,
      description: wallpaper.description,
    }))

    return NextResponse.json({
      orderId: order.$id,
      items: paddleItems,
      totalAmount,
      wallpapers,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
