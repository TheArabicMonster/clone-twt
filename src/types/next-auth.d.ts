import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      pseudo: string;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    pseudo: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    pseudo: string;
  }
}
