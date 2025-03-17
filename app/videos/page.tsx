"use client";

import { Button } from "@/components/ui/button";
import { Video, Download, Trash2, Check, CheckSquare, Square, DownloadCloud, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserVideosStore } from "@/store/userVideosStore";
import { useEffect, useState } from "react";
import { downloadVideosAsZip } from "@/utils/zipDownloader";
import toast from "react-hot-toast";

export default function VideosPage() {
  const router = useRouter();
  const { 
    videos, 
    removeVideo, 
    clearExpiredVideos,
    selectedVideos,
    toggleVideoSelection,
    selectAllVideos,
    deselectAllVideos,
    removeSelectedVideos,
    getSelectedVideoPaths
  } = useUserVideosStore();
  const [mounted, setMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Nettoyer les vidéos expirées au chargement de la page
  useEffect(() => {
    clearExpiredVideos();
    setMounted(true);
  }, [clearExpiredVideos]);

  // Fonction pour télécharger une vidéo
  const handleDownloadVideo = async (path: string) => {
    try {
      // Vérifier si c'est une URL Supabase ou un chemin local
      const videoUrl = path.includes('supabase.co') || path.includes('supabase.in') || path.startsWith('http')
        ? path
        : path.startsWith('/') ? path : `/${path}`;

      // Récupérer le contenu de la vidéo
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error('Failed to download video');
      }

      // Créer un blob à partir de la réponse
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Créer le lien de téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      const fileName = path.split('/').pop() || 'video.mp4';
      link.download = fileName;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading video:', error);
      toast.error('Échec du téléchargement. Veuillez réessayer.');
    }
  };

  // Fonction pour télécharger les vidéos sélectionnées en ZIP
  const handleDownloadSelected = async () => {
    try {
      if (selectedVideos.length === 0) {
        toast.error('Veuillez sélectionner au moins une vidéo');
        return;
      }

      setIsDownloading(true);
      toast.loading('Préparation du téléchargement...');
      
      const videosToDownload = getSelectedVideoPaths();
      console.log('Lancement du téléchargement ZIP pour', videosToDownload.length, 'vidéos');
      
      if (videosToDownload.length === 0) {
        throw new Error('Aucune vidéo sélectionnée à télécharger');
      }

      // Vérifier que toutes les vidéos ont des chemins valides
      let hasInvalidPaths = false;
      videosToDownload.forEach((video, index) => {
        if (!video.path) {
          console.error(`Vidéo ${index} a un chemin invalide:`, video);
          hasInvalidPaths = true;
        }
      });

      if (hasInvalidPaths) {
        throw new Error('Certaines vidéos ont des chemins invalides');
      }

      // Procéder au téléchargement
      await downloadVideosAsZip(videosToDownload, 'bluum_videos.zip');
      
      toast.dismiss();
      toast.success(`${videosToDownload.length} vidéos téléchargées avec succès`);
    } catch (error) {
      console.error('Erreur détaillée lors du téléchargement des vidéos:', error);
      toast.dismiss();
      // Vérification de type pour error
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Échec du téléchargement: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Fonction pour supprimer les vidéos sélectionnées
  const handleRemoveSelected = () => {
    if (selectedVideos.length === 0) {
      toast.error('Veuillez sélectionner au moins une vidéo');
      return;
    }

    const count = selectedVideos.length;
    removeSelectedVideos();
    toast.success(`${count} vidéos supprimées`);
  };

  // Fonction pour basculer entre Sélectionner tout et Désélectionner tout
  const handleToggleSelectAll = () => {
    if (selectedVideos.length === videos.length) {
      deselectAllVideos();
    } else {
      selectAllVideos();
    }
  };

  // Fonction pour formater le temps restant
  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const timeRemaining = expiresAt - now;
    
    if (timeRemaining <= 0) {
      return "Expiré";
    }
    
    // Pour les durées courtes (moins de 1h), afficher minutes et secondes
    if (timeRemaining < 60 * 60 * 1000) {
      const minutes = Math.floor(timeRemaining / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      if (minutes === 0) {
        return `${seconds}s`;
      }
      
      return `${minutes}m ${seconds}s`;
    }
    
    // Pour les durées plus longues, afficher heures et minutes
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Si le composant n'est pas encore monté, on ne rend rien pour éviter les erreurs d'hydratation
  if (!mounted) {
    return null;
  }

  return (
    <div className="p-6 xl:p-8 w-full h-[calc(100vh-65px)]">
      {videos.length > 0 ? (
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-center mb-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#fafafa] dark:bg-[#0a0a0c] dark:text-white border dark:border-[#0a0a0c] rounded-lg hover:bg-gray-50 dark:hover:bg-[#0a0a0c]/80"
              >
                {selectedVideos.length === videos.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    Select All
                  </>
                )}
              </button>

              {selectedVideos.length > 0 && (
                <>
                  <button
                    onClick={handleDownloadSelected}
                    disabled={isDownloading}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm bg-[#fafafa] dark:bg-[#0a0a0c] dark:text-white border dark:border-[#0a0a0c] rounded-lg hover:bg-gray-50 dark:hover:bg-[#0a0a0c]/80 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isDownloading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Télécharger ({selectedVideos.length})
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRemoveSelected}
                    disabled={isDownloading}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm bg-[#fafafa] dark:bg-[#0a0a0c] text-red-500 border dark:border-[#0a0a0c] rounded-lg hover:bg-gray-50 dark:hover:bg-[#0a0a0c]/80 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer ({selectedVideos.length})
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="relative bg-white dark:bg-[#0a0a0c] rounded-3xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video relative bg-gray-100 dark:bg-[#18181A]">
                  <video
                    src={video.path}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedVideos.includes(video.id)}
                      onChange={() => toggleVideoSelection(video.id)}
                      className="absolute top-2 left-2 h-4 w-4 rounded border-gray-300 text-[#5564ff] focus:ring-[#5564ff]"
                    />
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium mb-1 truncate dark:text-white">Vidéo {video.id}</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-300 mb-2">
                        Expire dans {formatTimeRemaining(video.expiresAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleDownloadVideo(video.path)}
                        className="p-1 text-[#5564ff] hover:bg-[#5564ff]/10 rounded-md transition-colors"
                        title="Télécharger la vidéo"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => removeVideo(video.id)}
                        className="p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Supprimer la vidéo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full w-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6">
                <Video className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-2xl font-semibold mb-4 dark:text-white">You have no videos</h2>
              <p className="text-muted-foreground dark:text-gray-300">
                Visit the Create page to make your first video.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 