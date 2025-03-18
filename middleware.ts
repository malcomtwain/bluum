import { NextRequest, NextResponse } from "next/server";

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
  // Get the pathname of the request
  const { pathname } = req.nextUrl;
  
  // Toujours laisser passer les routes publiques
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Pour toutes les autres routes, on laisse l'authentification être gérée par
  // les composants React avec les hooks de Clerk, pas dans le middleware
  // Cela permet d'éviter l'utilisation de modules Clerk incompatibles avec Edge Functions
  return NextResponse.next();
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