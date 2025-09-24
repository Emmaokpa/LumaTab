import NextAuth, { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { appwriteService, User } from "@/lib/appwrite"

// Export AuthOptions so it can be used in other files
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // When a user signs in, check if they exist in Appwrite.
          // If not, create a new user document for them.
          let appwriteUser;
          try {
            appwriteUser = await appwriteService.getUser(user.id);
          } catch (error: any) {
             if (error.code === 404) { // Appwrite throws a 404 if the document is not found
                appwriteUser = await appwriteService.createUser(user.id, {
                  email: user.email || '', // Provide a default empty string if email is undefined
                  name: user.name || user.email?.split('@')[0] || 'New User', // Provide a fallback for the name
                  avatar: user.image || '', // Provide a fallback for the avatar
                  isCreator: false,
                  totalEarnings: 0,
                  totalSales: 0,
                  subscriptionStatus: 'inactive', // Default to inactive
                  aiImagesGenerated: 0,
                });
             } else {
                 throw error; // Re-throw other errors
             }
          }
          return true;
        } catch (error) {
          console.error("Error during sign-in user sync with Appwrite:", error);
          return false; // Prevent sign-in if there's an error
        }
      }
      return true;
    },
    async session({ session, token }) {
      // Add custom data from Appwrite to the session object
      if (session.user) {
        session.user.id = token.sub;
        try {
          const appwriteUser = await appwriteService.getUser(token.sub) as unknown as User
          session.user.isCreator = appwriteUser.isCreator;
          session.user.subscriptionStatus = appwriteUser.subscriptionStatus;
        } catch (error) {
          console.error("Error fetching user data for session:", error);
          // Gracefully fail without extra data if user is not in DB for some reason
          session.user.isCreator = false;
          session.user.subscriptionStatus = 'inactive';
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      // The 'sub' (subject) claim is the user's unique ID from the provider (Google)
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/", // Redirect users to the homepage for sign-in
    error: "/",   // Redirect users to the homepage on error
  },
  session: {
    strategy: "jwt",
  },
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
