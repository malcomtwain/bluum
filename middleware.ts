import { NextRequest, NextResponse } from "next/server";

// Liste des routes publiques
const publicPaths = [
  "/auth",
  "/auth/",
  "/sign-in",
  "/sign-up",
  "/api/webhook",
  "/favicon.ico",
  "/BluumLogo.png",
  "/BluumFavicon.png",
  "/_next",
  "/api"
];

// Fonction pour vérifier si un chemin est public
function isPublicPath(path: string): boolean {
  return publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith(`${publicPath}/`)
  );
}

// Middleware pour vérifier si l'utilisateur est authentifié
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Si la route est publique, laisser passer sans vérification
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Vérifier si l'utilisateur a un cookie d'authentification
  // (on cherche le cookie __session qui est généralement utilisé par Clerk)
  const hasAuthCookie = req.cookies.has('__session');
  
  // Si l'utilisateur n'est pas authentifié, le rediriger vers la page de connexion
  if (!hasAuthCookie) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // Si l'utilisateur est authentifié, le laisser passer
  return NextResponse.next();
}

// Configuration pour spécifier quels chemins doivent passer par le middleware
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.+\\..+).*)",
    "/"
  ]
};

// Désactivation du middleware pour permettre le déploiement
// export const runtime = "nodejs"; 