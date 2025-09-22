"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Trash2, Loader2 } from "lucide-react"
import { paddleService } from "@/lib/paddle"

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cartItems: string[]
  onClearCart: () => void
}

export function CheckoutModal({ open, onOpenChange, cartItems, onClearCart }: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  // Mock cart data - in real app, fetch from Appwrite
  const cartWallpapers = [
    { id: "1", title: "Sunset Paradise", price: 2.99, image: "/sunset-wallpaper.jpg" },
    { id: "4", title: "Space Nebula", price: 3.99, image: "/space-nebula.png" },
  ]

  const subtotal = cartWallpapers.reduce((sum, item) => sum + item.price, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  useEffect(() => {
    // Listen for Paddle events
    const handlePaymentSuccess = (event: any) => {
      console.log("[v0] Payment successful:", event.detail)
      setIsProcessing(false)
      onClearCart()
      onOpenChange(false)
      // Show success message or redirect
    }

    const handlePaymentError = (event: any) => {
      console.log("[v0] Payment error:", event.detail)
      setIsProcessing(false)
      setError("Payment failed. Please try again.")
    }

    const handleCheckoutClose = () => {
      setIsProcessing(false)
    }

    window.addEventListener("paddle:payment:success", handlePaymentSuccess)
    window.addEventListener("paddle:payment:error", handlePaymentError)
    window.addEventListener("paddle:checkout:close", handleCheckoutClose)

    return () => {
      window.removeEventListener("paddle:payment:success", handlePaymentSuccess)
      window.removeEventListener("paddle:payment:error", handlePaymentError)
      window.removeEventListener("paddle:checkout:close", handleCheckoutClose)
    }
  }, [onClearCart, onOpenChange])

  const handleCheckout = async () => {
    if (!session?.user) {
      setError("Please sign in to complete your purchase")
      return
    }

    try {
      setIsProcessing(true)
      setError(null)

      const orderResponse = await paddleService.createOrder(cartItems, session.user.email!)

      await paddleService.openCheckout({
        items: orderResponse.items,
        customer: {
          email: session.user.email!,
        },
        customData: {
          orderId: orderResponse.orderId,
          userId: session.user.id,
        },
      })
    } catch (err) {
      setIsProcessing(false)
      setError(err instanceof Error ? err.message : "Failed to process checkout")
    }
  }

  if (cartItems.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => onOpenChange(false)}>Continue Shopping</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-purple-500" />
            <span>Checkout</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cart Items */}
          <div className="space-y-4">
            <h3 className="font-semibold">Order Summary</h3>
            {cartWallpapers.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.title}
                  className="w-16 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-sm text-muted-foreground">${item.price}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handleCheckout}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${total.toFixed(2)} with Paddle`
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Paddle. Your payment information is encrypted and secure.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
