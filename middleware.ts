import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

// Définir les routes publiques 
const publicPaths = [
  "/auth",
  "/sign-in",
  "/sign-up",
  "/api/webhook",
  "/favicon.ico",
  "/BluumLogo.png",
  "/BluumFavicon.png"
];

// Fonction pour vérifier si un chemin est public
function isPublicPath(path: string): boolean {
  return publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith(`${publicPath}/`)
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Si la route est publique, on laisse passer
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  try {
    // Vérifier si l'utilisateur est authentifié
    const { userId } = getAuth(req);
    
    // Si l'utilisateur n'est pas authentifié et tente d'accéder à une route protégée
    // le rediriger vers la page de connexion
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", pathname);
      return NextResponse.redirect(signInUrl);
    }
    
    // Si l'utilisateur est authentifié et essaie d'accéder aux pages d'auth,
    // on le redirige vers la page d'accueil
    if (userId && 
        (pathname.startsWith('/auth') || 
         pathname === '/sign-in' || 
         pathname === '/sign-up')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Utilisateur authentifié, continuer
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // En cas d'erreur, laisser passer mais logger l'erreur
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.+\\..+).*)",
    "/"
  ]
};

// Définir explicitement le runtime pour ce middleware
// Next.js 13.5+ a changé la manière de spécifier le runtime
export const runtime = "nodejs"; 