import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { appwriteService } from "@/lib/appwrite"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists in Appwrite
          let appwriteUser
          try {
            appwriteUser = await appwriteService.getUser(user.id)
          } catch (error) {
            // User doesn't exist, create new user
            appwriteUser = await appwriteService.createUser({
              email: user.email!,
              name: user.name!,
              avatar: user.image!,
              isCreator: false,
              totalEarnings: 0,
              totalSales: 0,
            })
          }
          return true
        } catch (error) {
          console.error("Error handling user sign in:", error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        try {
          // Get additional user data from Appwrite
          const appwriteUser = await appwriteService.getUser(token.sub!)
          session.user.isCreator = appwriteUser.isCreator
          session.user.totalEarnings = appwriteUser.totalEarnings
          session.user.totalSales = appwriteUser.totalSales
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }
