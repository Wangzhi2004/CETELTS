import NextAuth from "next-auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const { auth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "cetelts-dev-secret-change-in-production",
});

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const publicPaths = ["/sign-in", "/sign-up", "/api/auth"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  if (isPublic || isStatic) return;

  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(signInUrl);
  }
});