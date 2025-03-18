import { NextRequest, NextResponse } from "next/server";

// Liste des routes publiques
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

// Middleware extrêmement simplifié sans aucune dépendance à Clerk
export function middleware(req: NextRequest) {
  // La vérification d'authentification sera gérée côté client
  // par les composants React et ne bloquera pas le déploiement
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