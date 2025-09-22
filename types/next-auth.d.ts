declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image: string
      isCreator: boolean
      totalEarnings: number
      totalSales: number
    }
  }

  interface User {
    id: string
    name: string
    email: string
    image: string
    isCreator?: boolean
    totalEarnings?: number
    totalSales?: number
  }
}
