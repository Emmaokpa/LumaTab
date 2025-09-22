import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { paddleOrderId, transactionId } = await request.json()

    if (!paddleOrderId) {
      return NextResponse.json({ error: "Missing paddle order ID" }, { status: 400 })
    }

    // Find the order by paddle order ID (you might need to implement this search)
    // For now, we'll update based on the paddle order ID

    // In a real implementation, you'd:
    // 1. Verify the webhook signature from Paddle
    // 2. Update the order status to 'completed'
    // 3. Grant access to the wallpapers
    // 4. Send confirmation email

    console.log("[v0] Order completed:", { paddleOrderId, transactionId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error completing order:", error)
    return NextResponse.json({ error: "Failed to complete order" }, { status: 500 })
  }
}
