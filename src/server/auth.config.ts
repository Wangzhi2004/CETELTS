import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;
      const publicPaths = ["/sign-in", "/sign-up", "/api/auth"];
      const isPublic = publicPaths.some((p) => pathname.startsWith(p));
      const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/favicon");

      if (isPublic || isStatic) return true;

      return !!auth;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.preferredExam = (user as unknown as { preferredExam: string }).preferredExam;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as { role: string }).role = token.role as string;
        (session.user as unknown as { preferredExam: string }).preferredExam = token.preferredExam as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET ?? "cetelts-dev-secret-change-in-production",
} satisfies NextAuthConfig;