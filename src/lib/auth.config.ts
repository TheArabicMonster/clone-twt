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
        token.bio = (user.bio as string | null) ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.pseudo = token.pseudo as string;
        session.user.bio = token.bio as string | null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      console.log(auth?.user);
        const isLoggedIn = !!auth?.user;
        const isOnAuth =
          nextUrl.pathname.startsWith("/login") ||
          nextUrl.pathname.startsWith("/signup");
        //Liste Des routes ou il faut etre logged in pour y acceder
        const protectedRoutes = ["/profil", "/timeline", "/messages"];
        const isOnLandingPage = nextUrl.pathname==="/";
        const isOnNormalProfil = nextUrl.pathname === "/profil";
        const isOnProcectedRoute = protectedRoutes.some((route) =>
          nextUrl.pathname.startsWith(route)
        ); 
        if(isOnProcectedRoute&&!isLoggedIn) {
          return Response.redirect(new URL("/login", nextUrl));
        }
        const baseUrl = `${nextUrl.protocol}//${nextUrl.host}`;
        if(isOnLandingPage&&isLoggedIn) {
          return Response.redirect(new URL(`/profil/${auth?.user?.username}`, baseUrl));
        }
        if (isOnAuth) {
          if (isLoggedIn) return Response.redirect(new URL(`/profil/${auth?.user?.username}`, baseUrl));
          return true;
        }
        if(isOnNormalProfil&&isLoggedIn) {
          return Response.redirect(new URL(`/profil/${auth?.user?.username}`, baseUrl));
        }

        return true; // Permet l'accès à toutes les autres routes
      },
  },
};
