import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = String(credentials.email || "").toLowerCase().trim();
        const password = String(credentials.password || "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          nickname: user.nickname,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id!;
        token.nickname = (user as { nickname?: string }).nickname;
        token.role = (user as { role?: string }).role;
        token.picture = user.image;
        token.name = user.name;
        token.profileCheckedAt = Date.now();
      }

      const checkedAt = Number(token.profileCheckedAt || 0);
      const shouldRefresh =
        Boolean(token.id) &&
        (trigger === "update" ||
          !checkedAt ||
          Date.now() - checkedAt > 30_000);

      if (shouldRefresh) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { nickname: true, role: true, image: true, name: true },
        });
        if (dbUser) {
          token.nickname = dbUser.nickname;
          token.role = dbUser.role;
          token.picture = dbUser.image;
          token.name = dbUser.name;
        }
        token.profileCheckedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.nickname = token.nickname as string;
        session.user.role = token.role as string;
        session.user.image = (token.picture as string) || null;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
});
