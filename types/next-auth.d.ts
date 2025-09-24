import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session.user type to include properties
   * from your Appwrite user document.
   */
  interface Session {
    user: {
      id: string;
      isCreator: boolean;
      subscriptionStatus?: string;
    } & DefaultSession["user"];
  }

  /**
   * Extends the built-in user type.
   */
  interface User {
    isCreator: boolean;
    subscriptionStatus?: string;
  }
}

declare module "next-auth/jwt" {
  /** Extends the JWT token to make sub required. */
  interface JWT {
    sub: string;
  }
}