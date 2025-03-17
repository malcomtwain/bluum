import { clerkMiddleware, redirectToSignIn } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default clerkMiddleware({
  publicRoutes: [
    "/auth",
    "/auth/(.*)",
    "/sign-in",
    "/sign-up",
    "/api/webhook/(.*)",
    "/favicon.ico",
    "/BluumLogo.png",
    "/BluumFavicon.png"
  ],
  afterAuth(auth, req) {
    // Vérifier si l'utilisateur est sur la route racine (/)
    const isHomePage = req.nextUrl.pathname === '/';
    
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // If the user is logged in and trying to access the auth page,
    // redirect them to the home page
    if (auth.userId && 
        (req.nextUrl.pathname.startsWith('/auth') || 
         req.nextUrl.pathname === '/sign-in' || 
         req.nextUrl.pathname === '/sign-up')) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
}; 