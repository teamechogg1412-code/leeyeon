import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nickname: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    nickname?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    nickname?: string;
    role?: string;
  }
}
