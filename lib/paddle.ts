// Paddle SDK integration
declare global {
  interface Window {
    Paddle: any
  }
}

export interface PaddleProduct {
  id: string
  name: string
  price: number
  currency: string
}

export interface PaddleCheckoutOptions {
  items: Array<{
    priceId: string
    quantity: number
  }>
  customer?: {
    email?: string
  }
  customData?: Record<string, any>
  successUrl?: string
  closeUrl?: string
}

export class PaddleService {
  private static instance: PaddleService
  private initialized = false

  static getInstance(): PaddleService {
    if (!PaddleService.instance) {
      PaddleService.instance = new PaddleService()
    }
    return PaddleService.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    return new Promise((resolve, reject) => {
      // Load Paddle.js script
      const script = document.createElement("script")
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js"
      script.async = true

      script.onload = () => {
        if (window.Paddle) {
          window.Paddle.Environment.set(process.env.NODE_ENV === "production" ? "production" : "sandbox")
          window.Paddle.Setup({
            vendor: process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID,
            eventCallback: this.handlePaddleEvent.bind(this),
          })
          this.initialized = true
          resolve()
        } else {
          reject(new Error("Failed to load Paddle"))
        }
      }

      script.onerror = () => {
        reject(new Error("Failed to load Paddle script"))
      }

      document.head.appendChild(script)
    })
  }

  private handlePaddleEvent(data: any) {
    console.log("[v0] Paddle event:", data)

    switch (data.event) {
      case "Checkout.Complete":
        // Handle successful payment
        this.handlePaymentSuccess(data)
        break
      case "Checkout.Close":
        // Handle checkout close
        this.handleCheckoutClose(data)
        break
      case "Checkout.Error":
        // Handle payment error
        this.handlePaymentError(data)
        break
    }
  }

  private async handlePaymentSuccess(data: any) {
    try {
      // Update order status in Appwrite
      const response = await fetch("/api/orders/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paddleOrderId: data.checkout.id,
          transactionId: data.checkout.transaction_id,
        }),
      })

      if (response.ok) {
        // Trigger success callback or redirect
        window.dispatchEvent(
          new CustomEvent("paddle:payment:success", {
            detail: data,
          }),
        )
      }
    } catch (error) {
      console.error("Error handling payment success:", error)
    }
  }

  private handleCheckoutClose(data: any) {
    window.dispatchEvent(
      new CustomEvent("paddle:checkout:close", {
        detail: data,
      }),
    )
  }

  private handlePaymentError(data: any) {
    window.dispatchEvent(
      new CustomEvent("paddle:payment:error", {
        detail: data,
      }),
    )
  }

  async openCheckout(options: PaddleCheckoutOptions): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      try {
        window.Paddle.Checkout.open({
          items: options.items,
          customer: options.customer,
          customData: options.customData,
          successUrl: options.successUrl || `${window.location.origin}/success`,
          closeUrl: options.closeUrl || window.location.href,
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  async createOrder(wallpaperIds: string[], userEmail: string): Promise<any> {
    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallpaperIds,
        userEmail,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to create order")
    }

    return response.json()
  }
}

export const paddleService = PaddleService.getInstance()
