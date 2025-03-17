import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Définir les routes publiques à l'aide de createRouteMatcher
const isPublicRoute = createRouteMatcher([
  "/auth",
  "/auth/(.*)",
  "/sign-in",
  "/sign-up",
  "/api/webhook/(.*)",
  "/favicon.ico",
  "/BluumLogo.png",
  "/BluumFavicon.png"
]);

export default clerkMiddleware((auth, req) => {
  // Si la route est publique, on laisse passer
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Vérifier si l'utilisateur est sur la route racine (/)
  const isHomePage = req.nextUrl.pathname === '/';
  
  // Protéger les routes non-publiques
  auth().protect();
  
  // Si l'utilisateur est authentifié et essaie d'accéder aux pages d'auth,
  // on le redirige vers la page d'accueil
  const userId = auth().userId;
  if (userId && 
      (req.nextUrl.pathname.startsWith('/auth') || 
       req.nextUrl.pathname === '/sign-in' || 
       req.nextUrl.pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)"
  ]
}; 