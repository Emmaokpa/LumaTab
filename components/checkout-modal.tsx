"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Loader2, Rocket } from "lucide-react"
import { paddleService } from "@/lib/paddle"

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckoutModal({ open, onOpenChange }: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const subscriptionPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID!;

  useEffect(() => {
    const handlePaymentSuccess = () => {
      setIsProcessing(false);
      onOpenChange(false);
      // Optionally, show a global success message here
      // For now, we rely on the webhook to update the user's status
    };

    const handleCheckoutClose = () => {
      setIsProcessing(false);
    };

    window.addEventListener("paddle:checkout:completed", handlePaymentSuccess);
    window.addEventListener("paddle:checkout:close", handleCheckoutClose);

    return () => {
      window.removeEventListener("paddle:checkout:completed", handlePaymentSuccess);
      window.removeEventListener("paddle:checkout:close", handleCheckoutClose);
    };
  }, [onOpenChange]);

  const handleSubscribe = async () => {
    if (!session?.user?.email) {
      setError("Please sign in to subscribe.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      await paddleService.openCheckout({
        items: [{ priceId: subscriptionPriceId, quantity: 1 }],
        customer: {
          email: session.user.email,
        },
        customData: {
            userId: session.user.id,
        }
      });
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : "Failed to open checkout.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Rocket className="w-5 h-5 text-purple-500" />
            <span>Go Pro</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
            <div className="text-center">
                <h3 className="text-xl font-bold">LumaTab Pro</h3>
                <p className="text-muted-foreground">Unlock all premium and AI-generated wallpapers.</p>
            </div>

          <Separator />

          <div className="text-center">
            <p className="text-4xl font-bold">$5<span className="text-lg font-normal text-muted-foreground">/month</span></p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSubscribe}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Subscribe Now
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Paddle.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
