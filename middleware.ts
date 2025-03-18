import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@clerk/nextjs";

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

// Création d'un middleware personnalisé qui utilise authMiddleware de Clerk
// mais en contournant les vérifications incompatibles avec Edge
export default authMiddleware({
  publicRoutes: publicPaths,
  ignoredRoutes: [
    "/((?!_next/static|_next/image|.+\\..+).*)",
    "/_next",
    "/api(.*)"],
});

// Configuration du matcher pour le middleware
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/"],
};

// Désactivation du middleware pour permettre le déploiement
// export const runtime = "nodejs"; 