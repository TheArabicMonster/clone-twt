import type { NextAuthConfig } from "next-auth";


export const authConfig: NextAuthConfig = {
  providers: [
    
  ],
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username as string;
        token.pseudo = user.pseudo as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.pseudo = token.pseudo as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      console.log(auth?.user);
        const isLoggedIn = !!auth?.user;
        const isOnAuth =
          nextUrl.pathname.startsWith("/login") ||
          nextUrl.pathname.startsWith("/signup");

        const isOnLandingPage = nextUrl.pathname==="/";
        if(isOnLandingPage&&isLoggedIn) {
          return Response.redirect(new URL("/profil", nextUrl));
        }
        if (isOnAuth) {
          if (isLoggedIn) return Response.redirect(new URL("/profil", nextUrl));
          return true;
        }

        return true; // Permet l'accès à toutes les autres routes
      },
  },
};
