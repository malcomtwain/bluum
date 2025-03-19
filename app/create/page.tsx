"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDropzone } from "react-dropzone";
import { ChevronLeft, ChevronRight, Play as PlayIcon, Pause as PauseIcon, Music as MusicIcon, LucideProps } from "lucide-react";
import { useUser as ActualUseUser } from "@clerk/nextjs";
import { useUser as MockUseUser } from "@/lib/auth-mock";
import { getUserSongs, type UserSong } from "@/lib/supabase";
import { useVideoStore } from "@/store/videoStore";
import type { LucideIcon } from "lucide-react";
import { drawHookText } from "@/lib/utils";
import { useSupabase } from "@/hooks/useSupabase";
import { getFileUrl, initializeStorage, getFileUrlWithFallback } from "@/lib/supabase";
import Image from "next/legacy/image";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useUserVideosStore } from "@/store/userVideosStore";
import { downloadVideosAsZip } from "@/utils/zipDownloader";
import { useRouter } from "next/navigation";

// Importation conditionnelle basée sur l'environnement
const isNetlify = process.env.NEXT_PUBLIC_NETLIFY_DEPLOYMENT === 'true';

// Sélectionner la bonne version
const useUser = isNetlify ? MockUseUser : ActualUseUser;

// Remplacer par notre système d'authentification
import { getCurrentUser, User } from "@/lib/auth";

type MediaFile = {
  id: string;
  type: "image" | "video";
  url: string;
  duration: number;
  size?: number;
};

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

type SelectedMedia = {
  file: File;
  type: "image" | "video";
  duration: number;
  url?: string; // URL for preview
  aspectRatio?: number; // Store the aspect ratio
  isCorrectRatio?: boolean; // Flag for correct 9:16 ratio
};

// Fonction utilitaire pour déterminer si une URL est une data URL
function isDataUrl(url: string): boolean {
  return url?.startsWith('data:');
}

// Fonction pour obtenir l'URL d'affichage correcte pour un template
function getTemplateDisplayUrl(template: any): string {
  console.log("getTemplateDisplayUrl called with template:", template);
  
  // Si l'URL est undefined ou null, retourner une chaîne vide
  if (!template?.url) {
    console.log("Template URL is undefined or null");
    return '';
  }
  
  // Si l'ID du template commence par "local_", c'est un template stocké localement
  if (template.id?.startsWith('local_')) {
    console.log("Template ID starts with 'local_', checking localStorage for key:", template.url);
    try {
      // Récupérer l'URL depuis localStorage
      const dataUrl = localStorage.getItem(template.url);
      console.log("Retrieved from localStorage:", template.url, dataUrl ? "found" : "not found");
      if (dataUrl) {
        return dataUrl;
      } else {
        // Si la clé n'est pas trouvée, vérifier si l'URL elle-même est une data URL
        if (isDataUrl(template.url)) {
          console.log("URL is a data URL, using it directly");
          return template.url;
        }
        console.log("Data URL not found in localStorage, using original URL");
        return template.url;
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return template.url;
    }
  }
  
  // Si l'URL commence par "local_storage_", c'est une clé localStorage
  if (template.url.startsWith('local_storage_')) {
    console.log("URL starts with 'local_storage_', retrieving from localStorage");
    try {
      // Récupérer l'URL depuis localStorage
      const dataUrl = localStorage.getItem(template.url);
      console.log("Retrieved from localStorage:", template.url, dataUrl ? "found" : "not found");
      if (dataUrl) {
        return dataUrl;
      } else {
        // Si la clé n'est pas trouvée, vérifier si l'URL elle-même est une data URL
        if (isDataUrl(template.url)) {
          console.log("URL is a data URL, using it directly");
          return template.url;
        }
        console.log("Data URL not found in localStorage, using original URL");
        return template.url;
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return template.url;
    }
  }
  
  // Si c'est déjà une data URL, la retourner telle quelle
  if (isDataUrl(template.url)) {
    console.log("URL is already a data URL");
    return template.url;
  }
  
  // Sinon, c'est une URL normale
  console.log("Using normal URL:", template.url);
  return template.url;
}

// Composant pour afficher un template avec gestion du stockage local
function TemplateImage({ template, alt, position = 'center' }: { template: any, alt: string, position?: 'top' | 'center' | 'bottom' }) {
  console.log("TemplateImage rendering with template:", template, "alt:", alt, "position:", position);
  const [mediaError, setMediaError] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Récupérer l'URL d'affichage
  const displayUrl = useMemo(() => {
    if (!template?.url) {
      console.log("No template URL provided");
      return '';
    }

    // Si l'URL commence par 'local_storage_', récupérer depuis localStorage
    if (template.url.startsWith('local_storage_')) {
      try {
        const dataUrl = localStorage.getItem(template.url);
        if (dataUrl) {
          console.log("Retrieved from localStorage:", template.url);
          return dataUrl;
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
      }
    }

    // Sinon retourner l'URL telle quelle
    return template.url;
  }, [template?.url]);

  console.log("Display URL after processing:", displayUrl);
  
  // Détecter si c'est une vidéo basée sur le type ou l'extension
  useEffect(() => {
    setIsLoading(true);
    setMediaError(false);
    
    console.log("Template type check:", template?.type);
    
    // First check the explicit type property
    if (template?.type === 'video') {
      console.log("Template type is explicitly set to video");
      setIsVideo(true);
      setIsLoading(false);
      return;
    }
    
    // If no explicit type or type is not 'video', check the URL
    if (displayUrl) {
      // Check if the URL has video extensions or MIME types
      const isVideoUrl = displayUrl.match(/\.(mp4|webm|ogg|mov|avi|wmv)($|\?)/i) || 
                        displayUrl.includes('video/mp4') || 
                        displayUrl.includes('video/webm') || 
                        displayUrl.includes('video/ogg') ||
                        displayUrl.includes('video/quicktime') ||
                        displayUrl.includes('video/avi');
      
      // For object URLs or data URLs, make an extra check
      const isBlobOrDataVideo = displayUrl.startsWith('blob:') || 
                               displayUrl.startsWith('data:video');
      
      const isVideoType = isVideoUrl || isBlobOrDataVideo;
      
      console.log("URL video detection:", isVideoType ? "Is video" : "Is image", 
                 "URL:", displayUrl, 
                 "Matches:", {isVideoUrl, isBlobOrDataVideo});
      
      setIsVideo(isVideoType);
      setIsLoading(false);
    }
  }, [displayUrl, template]);
  
  if (!displayUrl || mediaError) {
    console.log("No display URL available or media error, showing placeholder");
    return (
      <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center">
        <span className="text-sm text-gray-500">No media</span>
        {mediaError && <span className="text-xs text-red-400 mt-1">Error loading media</span>}
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }
  
  // Déterminer le style de positionnement en fonction de la position
  const getObjectPositionStyle = () => {
    const style = { objectFit: 'cover' as const };
    switch(position) {
      case 'top':
        return { ...style, transform: 'translateY(0%)' } as const;
      case 'bottom':
        return { ...style, transform: 'translateY(-50%)' } as const;
      default:
        return { ...style, transform: 'translateY(-25%)' } as const;
    }
  };
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {isVideo ? (
        <video 
          key={`video-${displayUrl}`}
          src={displayUrl}
          className={`absolute inset-0 w-full h-full object-cover ${position === 'top' ? 'object-top' : position === 'bottom' ? 'object-bottom' : 'object-center'}`}
          muted
          loop
          playsInline
          autoPlay
          controls={false}
          onLoadStart={() => console.log("Video load started for:", displayUrl)}
          onLoadedMetadata={() => console.log("Video metadata loaded for:", displayUrl)}
          onLoadedData={() => console.log("Video data loaded successfully for:", displayUrl)}
          onCanPlay={() => console.log("Video can play now for:", displayUrl)}
          onPlay={() => console.log("Video started playing for:", displayUrl)}
          onError={(e) => {
            const videoElement = e.currentTarget;
            const errorDetail = {
              mediaError: videoElement.error ? {
                code: videoElement.error.code,
                message: videoElement.error.message,
                MEDIA_ERR_DECODE: videoElement.error.MEDIA_ERR_DECODE,
                MEDIA_ERR_NETWORK: videoElement.error.MEDIA_ERR_NETWORK,
                MEDIA_ERR_SRC_NOT_SUPPORTED: videoElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED,
                MEDIA_ERR_ABORTED: videoElement.error.MEDIA_ERR_ABORTED,
              } : 'No specific error details',
              src: displayUrl,
              videoElementInfo: {
                networkState: videoElement.networkState,
                readyState: videoElement.readyState,
              }
            };
            console.error("Error loading video:", errorDetail);
            setMediaError(true);
            videoElement.classList.add('video-error');
          }}
        />
      ) : (
        <Image 
          key={`img-${displayUrl}`}
          src={displayUrl} 
          alt={alt}
          layout="fill"
          className={`absolute inset-0 w-full h-full object-cover ${position === 'top' ? 'object-top' : position === 'bottom' ? 'object-bottom' : 'object-center'}`}
          onLoad={() => console.log("Image loaded successfully")}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            // Improve error reporting
            const errorInfo = {
              src: displayUrl,
              target: e.currentTarget ? "HTMLImageElement" : "unknown",
              error: "Failed to load image"
            };
            console.error("Error loading image:", errorInfo);
            setMediaError(true);
            if (e.currentTarget) {
              e.currentTarget.classList.add('image-error');
              e.currentTarget.setAttribute('title', `Failed to load: ${displayUrl}`);
            }
          }}
        />
      )}
    </div>
  );
}

// Fonction pour sauvegarder l'état de génération dans localStorage
const saveGenerationState = (state: {
  isGenerating: boolean;
  progress: number;
  generatedVideos: string[];
  generatedCount: number;
  totalToGenerate: number;
  currentHookIndex: number;
  currentMediaIndex: number;
}) => {
  localStorage.setItem('bluum-generation-state', JSON.stringify(state));
};

// Fonction pour charger l'état de génération depuis localStorage
const loadGenerationState = () => {
  const savedState = localStorage.getItem('bluum-generation-state');
  return savedState ? JSON.parse(savedState) : null;
};

// Fonction pour effacer l'état de génération dans localStorage
const clearGenerationState = () => {
  localStorage.removeItem('bluum-generation-state');
};

// Ajouter ces constantes en haut du fichier, après les imports
const ESTIMATED_TIME_PER_VIDEO = 15; // Estimation de 15 secondes par vidéo
const PROGRESS_STEPS = {
  INIT: 5,
  TEMPLATE_PREP: 5,
  MEDIA_PREP: 5,
  VIDEO_START: 5,
  COMPLETION: 100
};

// Ajouter des constantes pour l'estimation du temps
const BASE_PROCESSING_TIME = 10; // Temps de base en secondes
const SIZE_FACTOR = 0.5; // Facteur multiplicateur par MB

// Fonction pour estimer le temps de traitement
const estimateProcessingTime = (file1Size: number, file2Size: number) => {
  const totalSizeMB = (file1Size + file2Size) / (1024 * 1024); // Convertir en MB
  return BASE_PROCESSING_TIME + (totalSizeMB * SIZE_FACTOR);
};

export default function CreatePage() {
  // Ajouter une vérification pour éviter les erreurs d'hydratation
  const isClient = typeof window !== 'undefined';
  
  const [showSidebar, setShowSidebar] = useState(true);
  const [hooks, setHooks] = useState<string>("");
  const [selectedSong, setSelectedSong] = useState<UserSong | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [currentStyle, setCurrentStyle] = useState<1 | 2>(1);
  const router = useRouter();
  
  // Remplacer Clerk par notre système d'auth
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Récupérer l'utilisateur avec notre système
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const { mediaFiles } = useVideoStore();
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([]);
  const [songs, setSongs] = useState<UserSong[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<Set<number>>(new Set([2]));
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [templateDurationRange, setTemplateDurationRange] = useState<{min: number, max: number}>({min: 4, max: 6});
  const [videoDurationRange, setVideoDurationRange] = useState<{min: number, max: number}>({min: 4, max: 6});
  const [selectedMedias, setSelectedMedias] = useState<SelectedMedia[]>([]);
  const [selectedMediaIndexes, setSelectedMediaIndexes] = useState<Set<number>>(new Set());
  const [textPosition, setTextPosition] = useState<'top' | 'middle' | 'bottom'>('top');
  const [textOffset, setTextOffset] = useState<number>(0);
  const [style1Position, setStyle1Position] = useState<{position: 'top' | 'middle' | 'bottom', offset: number}>({
    position: 'top',
    offset: 0
  });
  const [style2Position, setStyle2Position] = useState<{position: 'top' | 'middle' | 'bottom', offset: number}>({
    position: 'top',
    offset: 0
  });
  const [templateImagePosition, setTemplateImagePosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [isGenerating, setIsGenerating] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { uploadTemplate } = useSupabase();
  
  // Variables d'état pour le suivi de la progression entre les onglets
  const [currentHookIndex, setCurrentHookIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Initialiser sans template par défaut
  const [defaultTemplate, setDefaultTemplate] = useState<{id: string, url: string, type: string} | null>(null);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const { addVideo } = useUserVideosStore();

  // Ajouter une nouvelle variable d'état pour l'animation de fin
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);

  const templates = useMemo(() => {
    return mediaFiles.filter(f => 
      (f.type === "image" || f.type === "video")
    );
  }, [mediaFiles]);

  // Calculate lastUploadedTemplate based on templates length
  const lastUploadedTemplate = useMemo(() => {
    console.log('[CREATE PAGE] Calculating lastUploadedTemplate, templates length:', templates.length);
    // S'assurer que lastUploadedTemplate est vide si templates est vide
    if (templates.length === 0) {
      return [];
    }
    return [templates[templates.length - 1]];
  }, [templates]);

  // Supprimer l'effet qui définit le template par défaut
  useEffect(() => {
    if (defaultTemplate && !selectedTemplate) {
      setSelectedTemplate(null);
    }
  }, [defaultTemplate, selectedTemplate]);

  // Load fonts for canvas
  useEffect(() => {
    const loadFonts = async () => {
      try {
        // Précharger les polices
        const tikTokFont = new FontFace('TikTok Display Medium', `url(/fonts/TikTokDisplayMedium.otf)`, {
          weight: '400',
          style: 'normal'
        });
        
        // Charger la police
        await tikTokFont.load();
        
        // Ajouter la police au document
        document.fonts.add(tikTokFont);
        
        // Vérifier que la police est bien chargée
        if (document.fonts.check('1em "TikTok Display Medium"')) {
          console.log('TikTok Display Medium font loaded successfully');
        } else {
          console.warn('TikTok Display Medium font not loaded correctly');
        }
        
        // Appliquer la police au document
        document.body.style.setProperty('--font-tiktok', '"TikTok Display Medium", sans-serif');
        
        // Attendre un peu pour s'assurer que la police est bien appliquée
        setTimeout(() => {
          setFontsLoaded(true);
        }, 200);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Set to true even on error to prevent blocking
      }
    };
    loadFonts();
  }, []);

  // Fonction pour obtenir le premier hook
  const getFirstHook = () => {
    // Ne retourner que le premier hook s'il existe, sinon retourner une chaîne vide
    return hooks.split('\n')[0] || "";
  };

  // Force redraw when fonts are loaded
  useEffect(() => {
    if (fontsLoaded && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match video dimensions (1080x1920)
      canvas.width = 1080;
      canvas.height = 1920;
      
      // Clear previous content
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Ne dessiner le hook que s'il y a du texte
      const hookText = getFirstHook();
      if (hookText.trim() !== "") {
        // Force font loading before drawing
        ctx.font = `${Math.floor(canvas.width * 0.07)}px "TikTok Display Medium", sans-serif`;
        
        // Draw hook text using shared function
        drawHookText(ctx, hookText, {
          type: currentStyle,
          position: currentStyle === 1 ? style1Position.position : style2Position.position,
          offset: currentStyle === 1 ? style1Position.offset : style2Position.offset
        });
      }
    }
  }, [fontsLoaded, currentStyle, style1Position, style2Position, hooks, selectedTemplate]);

  // Update canvas when hook properties change
  useEffect(() => {
    if (!canvasRef.current || !fontsLoaded || !hooks) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    document.fonts.ready.then(() => {
      // Vérifier si le hook est vide
      const hookText = getFirstHook();
      if (hookText.trim() === "") return;
      
      // Ensure the font is applied to the canvas context
      ctx.font = `${Math.floor(canvas.width * 0.07)}px "TikTok Display Medium", sans-serif`;
      
      // Draw hook text using shared function
      drawHookText(ctx, hookText, {
        type: currentStyle,
        position: currentStyle === 1 ? style1Position.position : style2Position.position,
        offset: currentStyle === 1 ? style1Position.offset : style2Position.offset
      });
    });
  }, [hooks, currentStyle, style1Position, style2Position, fontsLoaded, selectedTemplate]);

  // Charger les musiques de l'utilisateur
  useEffect(() => {
    const loadUserSongs = async () => {
      if (!user) return;
      try {
        setIsLoadingSongs(true);
        // Utiliser le cache s'il existe
        const cachedSongs = useVideoStore.getState().cachedSongs;
        if (cachedSongs.length > 0) {
          setSongs(cachedSongs);
          setIsLoadingSongs(false);
          return;
        }

        // Sinon charger depuis Supabase
        const userSongs = await getUserSongs(user.id);
        setSongs(userSongs);
        // Mettre en cache
        useVideoStore.getState().setCachedSongs(userSongs);
      } catch (error) {
        console.error('Error loading songs:', error);
      } finally {
        setIsLoadingSongs(false);
      }
    };

    loadUserSongs();
  }, [user]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    },
    maxFiles: 50,
    onDrop: (acceptedFiles) => {
      // Process each media file to get its duration/dimensions and create a preview URL
      const processMedias = async () => {
        const newMedias: SelectedMedia[] = [];
        
        for (const file of acceptedFiles) {
          const url = URL.createObjectURL(file);
          
          if (file.type.startsWith('video/')) {
            // Process video
            const video = document.createElement('video');
            video.src = url;
            
            const videoData = await new Promise<{duration: number, width: number, height: number}>((resolve) => {
              video.onloadedmetadata = () => {
                resolve({
                  duration: video.duration,
                  width: video.videoWidth,
                  height: video.videoHeight
                });
              };
              setTimeout(() => resolve({
                duration: 5,
                width: 1080,
                height: 1920
              }), 1000);
            });
            
            const aspectRatio = videoData.width / videoData.height;
            const isCorrectRatio = Math.abs(aspectRatio - 0.5625) < 0.05;
            
            newMedias.push({
              file,
              type: 'video',
              duration: videoData.duration,
              url,
              aspectRatio,
              isCorrectRatio
            });
          } else if (file.type.startsWith('image/')) {
            // Process image
            const imageData = await new Promise<{width: number, height: number}>((resolve) => {
              const img = document.createElement('img');
              img.onload = () => {
                resolve({
                  width: img.width,
                  height: img.height
                });
              };
              img.src = url;
            });
            
            const aspectRatio = imageData.width / imageData.height;
            const isCorrectRatio = Math.abs(aspectRatio - 0.5625) < 0.05;
            
            newMedias.push({
              file,
              type: 'image',
              duration: 5,
              url,
              aspectRatio,
              isCorrectRatio
            });
          }
        }
        
        setSelectedMedias(prev => [...prev, ...newMedias].slice(0, 50));
        
        setTimeout(() => {
          newMedias.forEach((media, index) => {
            if (media.type === 'video') {
              const videoIndex = index + selectedMedias.length;
              const videoElement = document.getElementById(`video-${videoIndex}`) as HTMLVideoElement;
              if (videoElement) {
                videoElement.play().catch(err => {
                  console.log('Auto-play prevented:', err);
                });
              }
            }
          });
        }, 500);
      };
      
      processMedias();
    }
  });

  const handlePlayPause = (song: UserSong) => {
    if (currentlyPlaying === song.id) {
      // Si la même chanson est en cours de lecture, on la met en pause
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      // Si une autre chanson est en cours de lecture, on l'arrête
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // On crée un nouvel élément audio pour la nouvelle chanson
      const audio = new Audio(song.url);
      audioRef.current = audio;
      
      // On ajoute un gestionnaire pour quand la chanson se termine
      audio.onended = () => {
        setCurrentlyPlaying(null);
      };
      
      // On lance la lecture
      audio.play();
      setCurrentlyPlaying(song.id);
    }
  };

  // Nettoyer l'audio quand le composant est démonté
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMediaSelection = (index: number) => {
    const newSelection = new Set(selectedMediaIndexes);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedMediaIndexes(newSelection);
  };

  const toggleAllMedias = () => {
    if (selectedMediaIndexes.size === selectedMedias.length) {
      setSelectedMediaIndexes(new Set());
    } else {
      setSelectedMediaIndexes(new Set(selectedMedias.map((_, i) => i)));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setHooks(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTemplateImagePosition = (position: 'top' | 'center' | 'bottom', e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplateImagePosition(position);
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryCount = 0;
    const maxRetries = 5;
    const baseRetryDelay = 1000;
    let retryTimeout: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
    };

    const connectSSE = () => {
      cleanup();

      try {
      console.log('Connecting to SSE...');
        eventSource = new EventSource('/api/progress', { 
          withCredentials: false 
        });

      eventSource.onopen = () => {
        console.log('SSE connection opened successfully');
          retryCount = 0; // Reset retry count on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
            if (typeof data.progress === 'number') {
            setProgress(data.progress);
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
          cleanup();

          if (retryCount < maxRetries) {
            const delay = Math.min(
              baseRetryDelay * Math.pow(2, retryCount) + Math.random() * 1000,
              10000
            );
            retryCount++;
            console.log(
              `Attempting to reconnect in ${Math.round(delay/1000)} seconds... (Attempt ${retryCount}/${maxRetries})`
            );
            retryTimeout = setTimeout(connectSSE, delay);
          } else {
            console.error('Max retry attempts reached. Please refresh the page to reconnect.');
          }
        };
      } catch (error) {
        console.error('Error creating EventSource:', error);
        if (retryCount < maxRetries) {
          retryTimeout = setTimeout(connectSSE, baseRetryDelay);
        }
      }
    };

    // Initial connection
    connectSSE();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up SSE connection');
      cleanup();
    };
  }, []);

  // Fonction utilitaire pour convertir un blob/fichier en base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Fonction utilitaire pour convertir une URL en blob
  const urlToBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    return response.blob();
  };

  // Récupérer l'état de génération sauvegardé au chargement de la page
  useEffect(() => {
    const savedState = loadGenerationState();
    if (savedState && savedState.isGenerating) {
      // Restaurer l'état de génération
      setIsGenerating(savedState.isGenerating);
      setProgress(savedState.progress);
      setGeneratedVideos(savedState.generatedVideos);
      setGeneratedCount(savedState.generatedCount);
      setTotalToGenerate(savedState.totalToGenerate);
      setCurrentHookIndex(savedState.currentHookIndex);
      setCurrentMediaIndex(savedState.currentMediaIndex);
      
      // Si la génération était en cours, proposer de la reprendre
      if (savedState.isGenerating && savedState.generatedCount < savedState.totalToGenerate) {
        const shouldResume = window.confirm(
          `La génération de vidéos a été interrompue (${savedState.generatedCount}/${savedState.totalToGenerate} terminées). Voulez-vous reprendre la génération?`
        );
        
        if (shouldResume) {
          // Utiliser un timeout pour s'assurer que tous les états sont bien chargés
          setTimeout(() => {
            handleResumeGeneration();
          }, 1000);
        } else {
          // Si l'utilisateur refuse, nettoyer l'état
          clearGenerationState();
          setIsGenerating(false);
        }
      }
    }
  }, []);

  // Définir la fonction handleResumeGeneration
  const handleResumeGeneration = async () => {
    try {
      const savedState = loadGenerationState();
      if (!savedState) {
        toast.error("État de génération perdu. Veuillez recommencer.");
        setIsGenerating(false);
        return;
      }
      
      // Vérifier que tous les éléments nécessaires sont disponibles
      if (!selectedTemplate || selectedMedias.length === 0 || !selectedSong || !hooks) {
        toast.error("Impossible de reprendre la génération. Certains éléments sont manquants.");
        setIsGenerating(false);
        clearGenerationState();
        return;
      }
      
      // Récupérer le template sélectionné
      const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);
      if (!selectedTemplateObj) {
        toast.error("Template non trouvé.");
        setIsGenerating(false);
        clearGenerationState();
        return;
      }
      
      // Logique similaire à handleCreateVideos mais en reprenant à l'indice sauvegardé
      let templateUrl = selectedTemplateObj.url;
      let templateType = selectedTemplateObj.type || "image";
      
      // ... Préparer les données comme dans handleCreateVideos
      
      // Extraire les hooks (lignes non vides)
      const hookLines = hooks
        .split("\n")
        .map(h => h.trim())
        .filter(h => h && h !== "Enter your hook here or load from a text file..");
      
      if (hookLines.length === 0) {
        toast.error("Veuillez entrer au moins un hook valide.");
        setIsGenerating(false);
        clearGenerationState();
        return;
      }
      
      // Préparer les médias (Part 2)
      const selectedMediasList = Array.from(selectedMediaIndexes).map(index => selectedMedias[index]);
      
      // Préparer les informations sur la musique
      const songInfo = {
        id: selectedSong.id,
        url: selectedSong.url
      };
      
      // Reprendre la génération à partir des indices sauvegardés
      let count = savedState.generatedCount;
      
      toast.success(`Reprise de la génération à partir de la vidéo ${count+1}/${savedState.totalToGenerate}`);
      
      // Reprendre à partir du point d'interruption
      for (let i = savedState.currentHookIndex; i < hookLines.length; i++) {
        setCurrentHookIndex(i);
        
        // Déterminer l'indice de départ pour la boucle interne
        const startJ = i === savedState.currentHookIndex ? savedState.currentMediaIndex : 0;
        
        for (let j = startJ; j < selectedMediasList.length; j++) {
          setCurrentMediaIndex(j);
          
          // ... Logique de génération des vidéos, similaire à handleCreateVideos
          
          // Mettre à jour l'état de génération
          saveGenerationState({
            isGenerating: true,
            progress: Math.round((count / savedState.totalToGenerate) * 100),
            generatedVideos,
            generatedCount: count,
            totalToGenerate: savedState.totalToGenerate,
            currentHookIndex: i,
            currentMediaIndex: j
          });
          
          // Incrémenter le compteur après chaque vidéo générée
          count++;
          setGeneratedCount(count);
          setProgress(Math.round((count / savedState.totalToGenerate) * 100));
        }
      }
      
      // Une fois terminé, effacer l'état sauvegardé
      clearGenerationState();
      setProgress(100);
      
      // Déclencher l'animation de fin
      setShowCompletionAnimation(true);
      setTimeout(() => {
        setShowCompletionAnimation(false);
        setGenerationComplete(true);
      }, 2000); // Animation pendant 2 secondes
      
      // Ne pas réinitialiser les champs après la génération des vidéos
      // car cela empêche l'affichage du popup de téléchargement
      // resetFormFields();
    } catch (error) {
      console.error('Erreur lors de la reprise de la génération:', error);
      toast.error("Une erreur est survenue lors de la reprise de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  // Modifier la fonction handleCreateVideos
  const handleCreateVideos = async () => {
    try {
      setIsGenerating(true);
      setProgress(PROGRESS_STEPS.INIT);
      setGeneratedVideos([]);
      setCurrentHookIndex(0);
      setCurrentMediaIndex(0);
      
      // Vérifier si tous les éléments nécessaires sont sélectionnés
      if (!selectedTemplate) {
        toast.error("Veuillez sélectionner un template pour la partie 1.");
        setIsGenerating(false);
        return;
      }
      
      if (selectedMedias.length === 0) {
        toast.error("Veuillez sélectionner au moins un média pour la partie 2.");
        setIsGenerating(false);
        return;
      }
      
      if (!selectedSong) {
        toast.error("Veuillez sélectionner une musique.");
        setIsGenerating(false);
        return;
      }

      if (!hooks || hooks.trim() === "" || hooks === "Enter your hook here or load from a text file..") {
        toast.error("Veuillez entrer au moins un hook.");
        setIsGenerating(false);
        return;
      }

      // Préparer le template (Part 1)
      const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);
      if (!selectedTemplateObj) {
        toast.error("Template non trouvé.");
        setIsGenerating(false);
        return;
      }
      
      setProgress(PROGRESS_STEPS.TEMPLATE_PREP);
      
      // Convertir l'URL du template en base64 si nécessaire
      let templateUrl = selectedTemplateObj.url;
      let templateType = selectedTemplateObj.type || "image";
      
      try {
        // Si c'est une URL blob ou une référence localStorage, convertir en base64
        if (templateUrl.startsWith('blob:') || templateUrl.startsWith('local_storage_')) {
          if (templateUrl.startsWith('local_storage_')) {
            const dataUrl = localStorage.getItem(templateUrl);
            if (dataUrl) {
              templateUrl = dataUrl;
            } else {
              throw new Error("Template non trouvé dans le localStorage");
            }
          } else {
            // Convertir l'URL blob en base64
            const blob = await urlToBlob(templateUrl);
            templateUrl = await blobToBase64(blob);
          }
          templateType = templateUrl.includes('video/') ? 'video' : 'image';
        }
      } catch (error) {
        console.error('Erreur lors de la conversion du template:', error);
        toast.error("Erreur lors de la préparation du template");
        setIsGenerating(false);
        return;
      }
      
      // Préparer l'objet template
      const template = {
        url: templateUrl,
        type: templateType
      };
      
      // Extraire les hooks (lignes non vides)
      const hookLines = hooks
        .split("\n")
        .map(h => h.trim())
        .filter(h => h && h !== "Enter your hook here or load from a text file..");
      
      if (hookLines.length === 0) {
        toast.error("Veuillez entrer au moins un hook valide.");
        setIsGenerating(false);
        return;
      }
      
      setProgress(PROGRESS_STEPS.MEDIA_PREP);
      
      // Préparer les médias (Part 2)
      const selectedMediasList = Array.from(selectedMediaIndexes).map(index => selectedMedias[index]);
      
      // Convertir les URLs des médias si nécessaire
      const selectedMediasData = await Promise.all(selectedMediasList.map(async (media) => {
        if (!media.url) return media;
        
        try {
          let mediaUrl = media.url;
          
          // Convertir les URLs blob ou localStorage en base64
          if (mediaUrl.startsWith('blob:') || mediaUrl.startsWith('local_storage_')) {
            if (mediaUrl.startsWith('local_storage_')) {
              const dataUrl = localStorage.getItem(mediaUrl);
              if (dataUrl) {
                mediaUrl = dataUrl;
              } else {
                throw new Error("Média non trouvé dans le localStorage");
              }
            } else {
              // Convertir l'URL blob en base64
              const blob = await urlToBlob(mediaUrl);
              mediaUrl = await blobToBase64(blob);
            }
          }
          
          return {
            ...media,
            url: mediaUrl,
            type: mediaUrl.includes('video/') ? 'video' : 'image'
          };
        } catch (error) {
          console.error('Erreur lors de la conversion du média:', error);
          throw new Error("Erreur lors de la préparation du média");
        }
      }));
      
      // Nouvelle logique : le nombre de vidéos est égal au nombre de hooks
      const totalVideos = hookLines.length;
      setTotalToGenerate(totalVideos);
      
      // Préparer les informations sur la musique
      const songInfo = {
        id: selectedSong.id,
        url: selectedSong.url
      };
      
      setProgress(PROGRESS_STEPS.VIDEO_START);
      
      // Sauvegarder l'état initial de la génération
      saveGenerationState({
        isGenerating: true,
        progress: PROGRESS_STEPS.VIDEO_START,
        generatedVideos: [],
        generatedCount: 0,
        totalToGenerate: totalVideos,
        currentHookIndex: 0,
        currentMediaIndex: 0
      });
      
      let count = 0;
      
      // Nouvelle boucle : utiliser le modulo pour réutiliser les médias si nécessaire
      for (let i = 0; i < totalVideos; i++) {
        setCurrentHookIndex(i);
        const mediaIndex = i % selectedMediasData.length;
        setCurrentMediaIndex(mediaIndex);
        
        const hook = hookLines[i];
        const media = selectedMediasData[mediaIndex];
        
        // Déterminer le temps estimé de génération en fonction du type de média
        const isImage = media.type === 'image';
        const isFixedPartImage = template.type === 'image';
        
        // Base de progression pour cette vidéo
        const baseProgress = 5; // Départ à 5%
        const maxProgressPerVideo = 90 / totalVideos; // Progression max pour chaque vidéo (jusqu'à 95% au total)
        
        // Première étape - Préparation (20% du temps total de la vidéo)
        const prepProgress = baseProgress + (maxProgressPerVideo * 0.2);
        setProgress(Math.round(baseProgress + (i / totalVideos * 90)));
        
        // Mettre à jour l'état de génération pour l'étape de préparation
        saveGenerationState({
          isGenerating: true,
          progress: Math.round(baseProgress + (i / totalVideos * 90)),
          generatedVideos,
          generatedCount: count,
          totalToGenerate: totalVideos,
          currentHookIndex: i,
          currentMediaIndex: mediaIndex
        });
        
        // Calculer le temps moyen des durées pour chaque partie
        const part1AvgDuration = (templateDurationRange.min + templateDurationRange.max) / 2;
        const part2AvgDuration = (videoDurationRange.min + videoDurationRange.max) / 2;
        const totalDuration = part1AvgDuration + part2AvgDuration;
        
        // Calculer le temps estimé basé sur le type de médias ET la durée des parties
        let baseEstimatedTime;
        if (isImage && isFixedPartImage) {
          baseEstimatedTime = 15000; // Temps de base pour image + image
        } else if (!isImage && !isFixedPartImage) {
          baseEstimatedTime = 45000; // Temps de base pour vidéo + vidéo
        } else {
          baseEstimatedTime = 30000; // Temps de base pour image + vidéo ou vidéo + image
        }
        
        // Ajuster le temps estimé en fonction de la durée totale (en supposant 10s comme référence)
        const durationFactor = totalDuration / 10; // Facteur d'ajustement basé sur 10s de référence
        const estimatedTime = Math.round(baseEstimatedTime * durationFactor);
        
        // Afficher l'estimation dans la console pour le développement
        console.log(`Génération vidéo ${i+1}/${totalVideos}:`, {
          isImage, 
          isFixedPartImage, 
          part1AvgDuration, 
          part2AvgDuration,
          totalDuration,
          baseEstimatedTime,
          durationFactor,
          estimatedTime
        });
        
        // Progression graduelle pendant le temps estimé de génération
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
          const elapsedTime = Date.now() - startTime;
          const progressRatio = Math.min(elapsedTime / estimatedTime, 0.95); // Max 95% de la progression pour cette vidéo
          
          // Calculer la progression actuelle pour cette vidéo
          const currentVideoProgress = baseProgress + (maxProgressPerVideo * progressRatio);
          const overallProgress = Math.round(baseProgress + (i / totalVideos * 90) + (maxProgressPerVideo * progressRatio));
          
          // Ne pas dépasser 95% de progression totale
          const safeProgress = Math.min(overallProgress, 95);
          
          setProgress(safeProgress);
          
          // Mettre à jour l'état de génération pendant la progression
          saveGenerationState({
            isGenerating: true,
            progress: safeProgress,
            generatedVideos,
            generatedCount: count,
            totalToGenerate: totalVideos,
            currentHookIndex: i,
            currentMediaIndex: mediaIndex
          });
          
        }, 500); // Mise à jour toutes les 500ms
        
          // Préparer les données pour l'API
          const data = {
            hook: {
              text: hook,
              style: currentStyle,
              position: currentStyle === 1 ? style1Position.position : style2Position.position,
              offset: currentStyle === 1 ? style1Position.offset : style2Position.offset
            },
            part1: {
              url: template.url,
              type: template.type,
              position: templateImagePosition,
              duration: {
                min: templateDurationRange.min,
                max: templateDurationRange.max
              }
            },
            part2: {
              url: media.url,
              type: media.type,
            },
            part2Duration: {
              min: videoDurationRange.min,
              max: videoDurationRange.max
            },
            song: songInfo
          };
          
        try {
          // Envoi au serveur
          const response = await fetch('/api/create-video', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            const result = await response.json();
            const videoPath = result.videoPath;
            const expiresAt = result.expiresAt;
            
            addVideo(videoPath, expiresAt);
            setGeneratedVideos(prev => [...prev, videoPath]);
          } else {
            const errorText = await response.text();
            console.error('Erreur response du serveur:', errorText);
            toast.error(`Erreur de création de vidéo: ${errorText}`);
          }
        } catch (error) {
          console.error('Erreur lors de la création de la vidéo:', error);
          toast.error('Erreur lors de la création de la vidéo');
        }

        // Après la génération d'une vidéo, nettoyer l'intervalle
        clearInterval(progressInterval);
        
        // Vidéo générée, mise à jour du compteur
        count++;
        setGeneratedCount(count);
        
        // Marquer cette vidéo comme complétée (100% pour cette vidéo)
        const completedProgress = Math.min(Math.round(baseProgress + ((i+1) / totalVideos * 90)), 95);
        setProgress(completedProgress);
        
        // Mettre à jour l'état final pour cette vidéo
        saveGenerationState({
          isGenerating: true,
          progress: completedProgress,
          generatedVideos,
          generatedCount: count,
          totalToGenerate: totalVideos,
          currentHookIndex: i,
          currentMediaIndex: mediaIndex
        });
      }
      
      // Toutes les vidéos sont générées, marquer comme terminé
      setProgress(PROGRESS_STEPS.COMPLETION); // 100%
      
      // Déclencher l'animation de fin
      setShowCompletionAnimation(true);
      setTimeout(() => {
        setShowCompletionAnimation(false);
        setGenerationComplete(true);
      }, 2000);
      
      // Ne pas réinitialiser les champs après la génération des vidéos
      // car cela empêche l'affichage du popup de téléchargement
      // resetFormFields();
      
    } catch (error) {
      console.error('Erreur lors de la génération des vidéos:', error);
      toast.error("Une erreur est survenue lors de la génération des vidéos");
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour réinitialiser les champs du formulaire
  const resetFormFields = () => {
    // Réinitialiser les hooks
    setHooks('');
    
    // Réinitialiser la musique
    setSelectedSong(null);
    
    // Réinitialiser Part 1 (template)
    setSelectedTemplate(null);
    // Utiliser le state actuel au lieu de setLastUploadedTemplate
    // setLastUploadedTemplate([]);
    
    // Réinitialiser Part 2 (médias)
    setSelectedMedias([]);
    setSelectedMediaIndexes(new Set());
    
    // Réinitialiser l'état de génération
    setGeneratedVideos([]);
    setGeneratedCount(0);
    setTotalToGenerate(0);
    setProgress(0);
    
    clearGenerationState();
  };

  // Ajouter un gestionnaire pour la visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Si la page est cachée et que la génération est en cours, sauvegarder l'état
      if (document.visibilityState === 'hidden' && isGenerating) {
        saveGenerationState({
          isGenerating,
          progress,
          generatedVideos,
          generatedCount,
          totalToGenerate,
          currentHookIndex,
          currentMediaIndex
        });
      }
    };

    // Ajouter l'écouteur d'événement
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isGenerating, progress, generatedVideos, generatedCount, totalToGenerate, currentHookIndex, currentMediaIndex]);

  // ... existing code ...
  
  // Assurer que l'état est nettoyé lorsque la génération est terminée
  useEffect(() => {
    if (!isGenerating) {
      clearGenerationState();
    }
  }, [isGenerating]);

  // ... existing code ...

  // Fonction pour télécharger une vidéo
  const handleDownloadVideo = (videoPath: string) => {
    const link = document.createElement('a');
    
    // Correction du chemin pour les vidéos temporaires
    if (videoPath.startsWith('/temp-videos/')) {
      // Utiliser le chemin direct vers le fichier temporaire dans le dossier public
      link.href = videoPath;
    } else if (videoPath.includes('supabase') || videoPath.startsWith('http')) {
      // C'est une URL complète de Supabase, l'utiliser directement
      link.href = videoPath;
    } else {
      // C'est un chemin local (fallback), ajouter le préfixe /generated/ si nécessaire
      link.href = videoPath.startsWith('/generated/') ? videoPath : `/generated/${videoPath}`;
    }
    
    // Extraire juste le nom du fichier pour le téléchargement
    let fileName = videoPath.split('/').pop();
    
    // Si aucun nom de fichier, générer un nom par défaut
    if (!fileName || fileName.trim() === '') {
      fileName = `video_${Date.now()}.mp4`;
    }
    
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Ajouter un petit délai pour permettre le téléchargement de démarrer
    setTimeout(() => {
      // Vérifier si le téléchargement a fonctionné en créant une requête pour tester l'existence du fichier
      const testRequest = new XMLHttpRequest();
      testRequest.open('HEAD', link.href, true);
      testRequest.onreadystatechange = function() {
        if (testRequest.readyState === 4) {
          if (testRequest.status !== 200) {
            // Le fichier n'est pas accessible, afficher une erreur
            toast.error(`Erreur: Le fichier n'est pas disponible. Veuillez réessayer plus tard.`);
            console.error(`Fichier non disponible: ${link.href}`);
          }
        }
      };
      testRequest.send();
    }, 500);
  };

  // Fonction pour télécharger toutes les vidéos en ZIP
  const handleDownloadAll = async () => {
    try {
      if (generatedVideos.length === 0) {
        toast.error("Aucune vidéo à télécharger");
        return;
      }
      
      // Afficher un toast de chargement
      toast.loading("Préparation de votre téléchargement...");
      
      // Préparer les données pour le ZIP
      const videosToDownload = generatedVideos.map(videoPath => {
        // Extraire le nom du fichier
        let fileName = videoPath.split('/').pop() || `video_${Date.now()}.mp4`;
        
        // Corriger le chemin pour les différents types d'URL
        let path = videoPath;
        if (videoPath.startsWith('/temp-videos/')) {
          // Utiliser le chemin direct
          path = videoPath;
        } else if (videoPath.includes('supabase') || videoPath.startsWith('http')) {
          // C'est une URL complète, l'utiliser directement
          path = videoPath; 
        } else {
          // C'est un chemin local, ajouter le préfixe /generated/ si nécessaire
          path = videoPath.startsWith('/generated/') ? videoPath : `/generated/${videoPath}`;
        }
        
        return { path, fileName };
      });
      
      // Télécharger en ZIP
      await downloadVideosAsZip(videosToDownload, `bluum_videos_${Date.now()}.zip`);
      
      // Terminer l'affichage du toast de chargement et afficher un succès
      toast.dismiss();
      toast.success(`${videosToDownload.length} vidéos téléchargées avec succès`);
      
      // Ne pas fermer le modal et ne pas recharger la page
      // setGenerationComplete(false);
      // setTimeout(() => {
      //   if (typeof window !== 'undefined') {
      //     window.location.reload();
      //   }
      // }, 1000);
    } catch (error) {
      console.error("Erreur lors du téléchargement des vidéos:", error);
      toast.dismiss();
      toast.error("Une erreur est survenue lors du téléchargement. Veuillez réessayer.");
    }
  };

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      alert('Please log in to upload templates');
      return;
    }

    // Vérifier si on a déjà un template personnalisé
    const currentTemplates = useVideoStore.getState().mediaFiles || [];
    const customTemplates = currentTemplates.filter(f => (f.type === "image" || f.type === "video") && f.id !== defaultTemplate?.id);

    try {
      setIsUploadingTemplate(true);
      
      // Create a default project if needed
      const projectId = 'default';
      
      // Check file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert('Please upload an image or video file');
        return;
      }

      // Check file size (max 5MB pour le localStorage)
      const MAX_LOCAL_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > 10 * 1024 * 1024) {
        alert(`File size must be less than 10MB for both images and videos`);
        return;
      }

      // Avertir l'utilisateur si le fichier est trop grand pour le localStorage
      if (file.size > MAX_LOCAL_STORAGE_SIZE) {
        console.warn(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) may be too large for localStorage. Using object URL as fallback.`);
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      // Déclarer templateUrl au niveau supérieur pour qu'il soit accessible dans le bloc finally
      let templateUrl = '';

      let aspectRatio = 0.5625; // Default 9:16 ratio
      let duration = 5; // Default duration in seconds

      // For images, check dimensions and aspect ratio
      if (isImage) {
        const imageData = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          const img = document.createElement('img');
          img.onload = () => {
            resolve({
              width: img.width,
              height: img.height
            });
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = previewUrl;
        });

        // Calculate aspect ratio
        aspectRatio = imageData.width / imageData.height;
        
        // Nous ne validons plus le ratio 9:16
        // Enregistrer simplement les dimensions pour référence
        console.log(`Image dimensions: ${imageData.width}x${imageData.height}, ratio: ${aspectRatio.toFixed(2)}`);
      }
      
      // For videos, get duration and check aspect ratio
      if (isVideo) {
        const videoData = await new Promise<{ duration: number; aspectRatio: number }>((resolve, reject) => {
          const video = document.createElement('video');
          video.onloadedmetadata = () => {
            resolve({
              duration: video.duration,
              aspectRatio: video.videoWidth / video.videoHeight
            });
          };
          video.onerror = () => reject(new Error('Failed to load video'));
          video.src = previewUrl;
        });
        
        duration = videoData.duration;
        aspectRatio = videoData.aspectRatio;
        
        // Nous ne validons plus le ratio 9:16
        // Enregistrer simplement les dimensions pour référence
        console.log(`Video dimensions: ratio: ${aspectRatio.toFixed(2)}, duration: ${duration.toFixed(2)}s`);
      }
      
      console.log('Uploading template...');
      
      try {
        // Try to upload to Supabase first
        const timestamp = Date.now();
        const fileName = `user_${user.id}_${projectId}_templates_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const path = `${projectId}/templates/${fileName}`;
        
        // Utiliser local par défaut car Supabase n'est pas accessible
        
        try {
          // First, try to initialize storage buckets if they don't exist
          await initializeStorage().catch(error => {
            console.warn('Failed to initialize storage buckets:', error);
            // Continue anyway, the upload might still work with local fallback
          });
          
          // Pour les vidéos, toujours utiliser directement l'URL d'objet
          if (isVideo) {
            console.log('Video file detected, using object URL directly');
            templateUrl = previewUrl;
            
            // Créer un objet pour suivre cette URL d'objet
            try {
              const objectUrls = JSON.parse(localStorage.getItem('object_urls') || '[]');
              objectUrls.push({
                id: `local_${timestamp}`,
                url: previewUrl,
                timestamp: Date.now()
              });
              // Ne garder que les 5 dernières URLs
              if (objectUrls.length > 5) {
                objectUrls.splice(0, objectUrls.length - 5);
              }
              localStorage.setItem('object_urls', JSON.stringify(objectUrls));
            } catch (e) {
              console.warn('Failed to track object URL:', e);
            }
          } else if (file.size > 2 * 1024 * 1024) { // 2MB pour les images volumineuses
            console.log('Large image file detected, using object URL directly');
            templateUrl = previewUrl;
          } else {
            // Utiliser localStorage uniquement pour les petites images
            console.log('Using localStorage for small image file...');
            
            // Create a unique key for localStorage
            const localKey = `local_storage_templates_user_${user.id}_${projectId}_templates_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            
            // Nettoyer le localStorage avant d'ajouter un nouveau fichier
            try {
              // Supprimer tous les anciens templates du localStorage
              const keysToRemove = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('local_storage_templates_user_')) {
                  keysToRemove.push(key);
                }
              }
              
              // Supprimer les clés
              keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                console.log('Removed old template from localStorage:', key);
              });
            } catch (e) {
              console.warn('Failed to clean localStorage:', e);
            }
            
            try {
              // Read file as data URL
              const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
              });
              
              // Store in localStorage
              try {
                localStorage.setItem(localKey, dataUrl);
                // Use the localStorage key as the URL
                templateUrl = localKey;
                console.log('Template stored in localStorage with key:', localKey);
              } catch (storageError) {
                console.error('Failed to store in localStorage:', storageError);
                // Si erreur de stockage, utiliser l'URL d'objet
                templateUrl = previewUrl;
                console.log('localStorage error, using object URL instead');
              }
            } catch (readError) {
              console.error('Failed to read file:', readError);
              templateUrl = previewUrl;
              console.log('File reading error, using object URL instead');
            }
          }
        } catch (uploadError) {
          console.error('All storage methods failed:', uploadError);
          
          // Last resort: use the preview URL
          templateUrl = previewUrl;
          console.log('Using preview URL as last resort');
        }
        
        // Créer le nouveau template
        const newTemplate: MediaFile = {
          id: `local_${timestamp}`,
          type: isImage ? 'image' as const : 'video' as const,
          url: templateUrl,
          duration: duration
        };
        
        console.log("Created new template:", newTemplate);
        
        // Mettre à jour le store en remplaçant l'ancien template personnalisé s'il existe
        const updatedMediaFiles = [...currentTemplates.filter(f => f.id === defaultTemplate?.id), newTemplate];
        useVideoStore.setState({ 
          mediaFiles: updatedMediaFiles
        });
        
        // Sélectionner automatiquement le nouveau template
        setSelectedTemplate(newTemplate.id);
      } catch (error) {
        console.error('Error in template upload process:', error);
        throw error instanceof Error ? error : new Error('Unknown error during upload');
      } finally {
        // Clean up preview URL only if we're not using it
        if (templateUrl !== previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      }
    } catch (error) {
      console.error('Template upload error:', error);
      alert(`Error uploading template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingTemplate(false);
      // Reset the input value to allow uploading the same file again
      event.target.value = '';
    }
  };

  useEffect(() => {
    // Initialize required storage buckets
    initializeStorage().catch(error => {
      console.error('Failed to initialize storage buckets:', error);
      // Continue with app initialization even if bucket creation fails
      // This allows the app to work with existing buckets
    });
    
    // Note: loadFonts and loadUserSongs are called elsewhere in the component
  }, []);

  const handleDeleteMedia = (indexToDelete: number) => {
    setSelectedMedias(prev => prev.filter((_, index) => index !== indexToDelete));
    setSelectedMediaIndexes(prev => {
      const newSelection = new Set(prev);
      newSelection.delete(indexToDelete);
      // Réajuster les index restants
      const adjustedSelection = new Set<number>();
      newSelection.forEach(index => {
        if (index > indexToDelete) {
          adjustedSelection.add(index - 1);
        } else {
          adjustedSelection.add(index);
        }
      });
      return adjustedSelection;
    });
  };

  const handleDeleteSelectedMedias = () => {
    const selectedIndexes = Array.from(selectedMediaIndexes).sort((a, b) => b - a);
    selectedIndexes.forEach(index => {
      handleDeleteMedia(index);
    });
    setSelectedMediaIndexes(new Set());
  };

  const handleDeleteTemplate = () => {
    console.log('[CREATE PAGE] Deleting template, current mediaFiles:', mediaFiles);
    // Garder uniquement le template par défaut
    const updatedMediaFiles = mediaFiles.filter(f => f.id === defaultTemplate?.id);
    useVideoStore.setState({ 
      mediaFiles: updatedMediaFiles
    });
    console.log('[CREATE PAGE] After deletion, mediaFiles set to:', updatedMediaFiles);
    
    // Sélectionner le template par défaut ou null
    setSelectedTemplate(defaultTemplate?.id || null);
    
    // Pour forcer la mise à jour de lastUploadedTemplate
    setTimeout(() => {
      console.log('[CREATE PAGE] Post-deletion check, templates length:', 
        mediaFiles.filter(f => (f.type === "image" || f.type === "video")).length);
    }, 100);
  };

  // Add a useEffect to log template information for debugging
  useEffect(() => {
    if (selectedTemplate) {
      console.log("Preview template:", {
        selectedId: selectedTemplate,
        isDefaultTemplate: selectedTemplate === defaultTemplate?.id,
        defaultTemplateType: defaultTemplate?.type,
        foundTemplate: templates.find(t => t.id === selectedTemplate),
        foundTemplateType: templates.find(t => t.id === selectedTemplate)?.type
      });
    }
  }, [selectedTemplate, defaultTemplate, templates]);

  // Ajouter des styles CSS pour l'animation de progression
  useEffect(() => {
    // Ajouter une keyframe pour l'animation de progression
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes progress {
        0% { width: 0%; }
        100% { width: 100%; }
      }
      
      @keyframes fadeInScale {
        0% { opacity: 0; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-20px); }
        60% { transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Utiliser useEffect pour tout ce qui accède à localStorage ou window
  useEffect(() => {
    // Initialiser les états qui dépendent du navigateur ici
    if (isClient) {
      // Vérifier s'il y a un état de génération en cours
      const savedState = loadGenerationState();
      if (savedState && savedState.isGenerating) {
        setIsGenerating(true);
        setProgress(savedState.progress);
        setGeneratedVideos(savedState.generatedVideos || []);
        setGeneratedCount(savedState.generatedCount || 0);
        setTotalToGenerate(savedState.totalToGenerate || 0);
        setCurrentHookIndex(savedState.currentHookIndex || 0);
        setCurrentMediaIndex(savedState.currentMediaIndex || 0);
      }
    }
  }, [isClient]);

  return (
    <div className="flex flex-col min-h-screen">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="p-4 xl:p-6" suppressHydrationWarning>
        <div className="pt-8 xl:pt-8" suppressHydrationWarning>
          <div className="flex flex-col space-y-6 mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold dark:text-white">Create Your Videos</h1>
              
              {/* Bouton flottant pour réafficher le popup de téléchargement */}
              {generatedVideos.length > 0 && !generationComplete && !isGenerating && (
                <button 
                  onClick={() => setGenerationComplete(true)}
                  className="fixed bottom-8 right-8 bg-gradient-to-r from-[#f8d4eb] via-[#ce7acb] to-[#e9bcba] text-[#0a0a0c] font-medium px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg z-40"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Download {generatedVideos.length} Videos
                </button>
              )}
              
              {/* Bouton flottant pour Upgrade en bas à gauche */}
              <button 
                onClick={() => router.push('/pricing')}
                className="fixed bottom-16 left-8 bg-gradient-to-r from-[#f8d4eb] via-[#ce7acb] to-[#e9bcba] text-[#0a0a0c] font-medium px-4 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg z-40"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
                Upgrade
              </button>
            </div>
            <div className="flex flex-row h-[calc(100vh-100px)] bg-[#e5e6e0] dark:bg-[#18181a] rounded-2xl border border-gray-300 dark:border-[#0e0f15]">
              {/* Left Panel - Steps */}
              <div className="w-[calc(100%-250px)] sm:flex-1 overflow-y-auto">
                <div className="p-3 space-y-4">
                  {/* Top Row - Hook Input and Templates */}
                  <div className="grid grid-cols-1 [@media(min-width:1000px)]:grid-cols-2 gap-4">
                    {/* Hook Input */}
                    <section className="space-y-2 bg-[#f3f4ee] dark:bg-[#0e0f15] p-3 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fafafa] text-[#0a0a0c] font-bold text-sm border border-gray-200 dark:border-[#18181a]">1</div>
                          <h2 className="text-base font-bold dark:text-white">Hook</h2>
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".txt"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="hook-file"
                          />
                          <label
                            htmlFor="hook-file"
                            className="px-3 py-1.5 bg-[#202123] text-white rounded-lg hover:bg-[#202123]/90 transition-colors cursor-pointer flex items-center gap-2 text-sm font-normal"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 14v5a2 2 0 002 2h14a2 2 0 002-2v-5M12 3v12M5 10l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Load
                          </label>
                        </div>
                      </div>
                      <Textarea
                        value={hooks}
                        onChange={(e) => setHooks(e.target.value)}
                        placeholder="Enter your hook here or load from a text file.."
                        className="min-h-[150px] dark:bg-[#18181a] dark:text-white dark:border-[#0e0f15] dark:placeholder:text-gray-400"
                        maxLength={500}
                      />
                      <div className="flex gap-2 mt-4">
                        <div
                          onClick={() => {
                            setSelectedStyles(new Set([1]));
                            setCurrentStyle(1);
                          }}
                          className={`flex-1 flex items-center justify-center p-4 rounded-xl cursor-pointer transition-all ${
                            selectedStyles.has(1)
                              ? "bg-[#5465ff] text-white dark:bg-[#fafafa]"
                              : "bg-white/50 hover:bg-white/70 dark:bg-[#18181a] dark:hover:bg-[#18191C] dark:text-white"
                          }`}
                        >
                          <div 
                            className={`text-sm font-semibold ${
                              selectedStyles.has(1) 
                                ? "text-white dark:!text-[#0a0a0c]" 
                                : "text-gray-700 dark:text-white"
                            }`}
                          >
                            Normal
                          </div>
                        </div>

                        <div
                          onClick={() => {
                            setSelectedStyles(new Set([2]));
                            setCurrentStyle(2);
                          }}
                          className={`flex-1 flex items-center justify-center p-4 rounded-xl cursor-pointer transition-all ${
                            selectedStyles.has(2)
                              ? "bg-[#5465ff] text-white dark:bg-[#fafafa]"
                              : "bg-white/50 hover:bg-white/70 dark:bg-[#18181a] dark:hover:bg-[#18191C] dark:text-white"
                          }`}
                        >
                          <div 
                            className={`text-sm font-semibold ${
                              selectedStyles.has(2) 
                                ? "text-white dark:!text-[#0a0a0c]" 
                                : "text-gray-700 dark:text-white"
                            }`}
                          >
                            Background
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Music Section - Moved to position 2 */}
                    <section className="space-y-2 bg-[#f3f4ee] dark:bg-[#0e0f15] p-3 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fafafa] text-[#0a0a0c] font-bold text-sm border border-gray-200 dark:border-[#18181a]">2</div>
                          <h2 className="text-base font-bold dark:text-white">Music</h2>
                        </div>
                      </div>
                      {isLoadingSongs ? (
                        <div className="h-[200px] flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5465ff]"></div>
                        </div>
                      ) : songs.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-start pl-4 text-gray-500 dark:text-gray-400">
                          <div>
                            <p>No music available</p>
                            <p className="text-sm mt-2">Add music in the Music page first</p>
                          </div>
                        </div>
                      ) : (
                        <ScrollArea className="flex-1">
                          <div className="py-2 space-y-2">
                            {songs.map((song) => (
                              <div
                                key={song.id}
                                onClick={() => setSelectedSong(selectedSong?.id === song.id ? null : song)}
                                className={`flex items-center gap-3 p-2 pl-3 rounded-xl cursor-pointer transition-all ${
                                  selectedSong?.id === song.id
                                    ? "bg-[#5465ff] text-white dark:bg-[#fafafa]"
                                    : "bg-white/50 hover:bg-white/70 dark:bg-[#18181a] dark:hover:bg-[#18191C] dark:text-white"
                                }`}
                              >
                                <div className="relative w-10 h-10 [@media(min-width:1000px)]:w-12 [@media(min-width:1000px)]:h-12 flex-shrink-0">
                                  {song.cover_url ? (
                                    <Image
                                      src={song.cover_url}
                                      alt={song.title}
                                      layout="fill"
                                      className="object-cover rounded-md"
                                      sizes="(max-width: 1000px) 40px, 48px"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 dark:bg-[#18181a] rounded-md flex items-center justify-center">
                                      <MusicIcon className="h-5 w-5 [@media(min-width:1000px)]:h-6 [@media(min-width:1000px)]:w-6 text-gray-500" />
                                    </div>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlayPause(song);
                                    }}
                                    className={`absolute inset-0 flex items-center justify-center bg-black/30 rounded-md ${
                                      currentlyPlaying === song.id ? "opacity-100" : "opacity-0 hover:opacity-100"
                                    }`}
                                  >
                                    {currentlyPlaying === song.id ? (
                                      <PauseIcon className="h-5 w-5 [@media(min-width:1000px)]:h-6 [@media(min-width:1000px)]:w-6 text-white" />
                                    ) : (
                                      <PlayIcon className="h-5 w-5 [@media(min-width:1000px)]:h-6 [@media(min-width:1000px)]:w-6 text-white" />
                                    )}
                                  </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${selectedSong?.id === song.id ? "text-white dark:!text-[#0a0a0c]" : "text-gray-700 dark:text-white"}`}>
                                    {song.title}
                                  </p>
                                  <p className={`text-xs truncate ${selectedSong?.id === song.id ? "text-white/80 dark:!text-[#0a0a0c]/80" : "text-gray-500 dark:text-gray-300"}`}>
                                    {song.artist} • {formatDuration(song.duration)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </section>
                  </div>

                  {/* Bottom Row - Templates and Videos */}
                  <div className="grid grid-cols-1 [@media(min-width:1000px)]:grid-cols-2 gap-4">
                    {/* Templates Section - Moved to position 3 */}
                    <section className="space-y-2 bg-[#f3f4ee] dark:bg-[#0e0f15] p-3 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fafafa] text-[#0a0a0c] font-bold text-sm border border-gray-200 dark:border-[#18181a]">3</div>
                          <h2 className="text-base font-bold dark:text-white">Part 1</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">10MB max</span>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={handleTemplateUpload}
                              className="hidden"
                              id="template-file"
                              disabled={isUploadingTemplate}
                            />
                            <label
                              htmlFor="template-file"
                              className={`px-3 py-1.5 bg-[#202123] text-white rounded-lg hover:bg-[#202123]/90 transition-colors cursor-pointer flex items-center gap-2 text-sm font-normal ${
                              isUploadingTemplate ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 14v5a2 2 0 002 2h14a2 2 0 002-2v-5M12 3v12M5 10l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              {isUploadingTemplate ? 'Uploading...' : 'Upload'}
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex justify-center mt-auto pt-4 mb-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="2"
                                max="29"
                                value={templateDurationRange.min}
                                onChange={(e) => {
                                  const newMin = Number(e.target.value);
                                  if (newMin >= 2 && newMin < templateDurationRange.max) {
                                    setTemplateDurationRange(prev => ({
                                      min: newMin,
                                      max: prev.max
                                    }));
                                  }
                                }}
                                className="w-12 h-7 px-1 border border-gray-300 dark:border-[#0e0f15] dark:bg-[#18181a] dark:text-white rounded-md text-center text-sm"
                              />
                              <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>
                              <input
                                type="number"
                                min="3"
                                max="30"
                                value={templateDurationRange.max}
                                onChange={(e) => {
                                  const newMax = Number(e.target.value);
                                  if (newMax <= 30 && newMax > templateDurationRange.min) {
                                    setTemplateDurationRange(prev => ({
                                      min: prev.min,
                                      max: newMax
                                    }));
                                  }
                                }}
                                className="w-12 h-7 px-1 border border-gray-300 dark:border-[#0e0f15] dark:bg-[#18181a] dark:text-white rounded-md text-center text-sm"
                              />
                              <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">Seconds</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center gap-1">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={(e) => handleTemplateImagePosition('top', e)}
                                className={`flex flex-col items-center px-3 py-2 rounded-md ${templateImagePosition === 'top' ? 'bg-[#5465ff] text-white dark:bg-[#fafafa] dark:text-[#0a0a0c]' : 'bg-black/10 hover:bg-black/20 text-gray-700 dark:bg-[#18181a] dark:hover:bg-[#18191C] dark:text-white'} transition-colors`}
                                title="Afficher le haut de l'image/vidéo"
                              >
                                <svg className={`w-4 h-4 ${templateImagePosition === 'top' && 'dark:text-[#0a0a0c]'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4 5h16M4 9h16M10 13h4m-4 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button
                                onClick={(e) => handleTemplateImagePosition('center', e)}
                                className={`flex flex-col items-center px-3 py-2 rounded-md ${templateImagePosition === 'center' ? 'bg-[#5465ff] text-white dark:bg-[#fafafa] dark:text-[#0a0a0c]' : 'bg-black/10 hover:bg-black/20 text-gray-700 dark:bg-[#18181a] dark:hover:bg-[#18191C] dark:text-white'} transition-colors`}
                                title="Centrer l'image/vidéo"
                              >
                                <svg className={`w-4 h-4 ${templateImagePosition === 'center' && 'dark:text-[#0a0a0c]'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M4 9h16M4 12h16M4 15h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button
                                onClick={(e) => handleTemplateImagePosition('bottom', e)}
                                className={`flex flex-col items-center px-3 py-2 rounded-md ${templateImagePosition === 'bottom' ? 'bg-[#5465ff] text-white dark:bg-[#fafafa] dark:text-[#0a0a0c]' : 'bg-black/10 hover:bg-black/20 text-gray-700 dark:bg-[#18181a] dark:hover:bg-[#18191C] dark:text-white'} transition-colors`}
                                title="Afficher le bas de l'image/vidéo"
                              >
                                <svg className={`w-4 h-4 ${templateImagePosition === 'bottom' && 'dark:text-[#0a0a0c]'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10 7h4m-4 4h4M4 15h16M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="pb-0.3"></div>
                      </div>
                      {templates.length === 0 && !defaultTemplate ? (
                        <div className="h-[200px] flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                          <div>
                            <p>No media uploaded</p>
                            <p className="text-sm mt-2">Upload 1 video or 1 image to continue</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2 max-w-[170px] mx-auto">
                            {defaultTemplate && (
                              <div
                                key={defaultTemplate.id}
                                onClick={() => setSelectedTemplate(defaultTemplate.id)}
                                className={`relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer border-2 ${
                                  selectedTemplate === defaultTemplate.id
                                    ? "bg-[#5465ff]/10 border-[#5465ff] ring-2 ring-[#5465ff]"
                                    : "border-gray-200 hover:border-gray-300 dark:border-[#0e0f15] dark:hover:border-[#27272A]"
                                }`}
                              >
                                <div className="relative w-full h-full">
                                  <TemplateImage 
                                    template={{ 
                                      url: defaultTemplate.url,
                                      type: defaultTemplate.type || 'image'
                                    }} 
                                    alt="Default Template" 
                                    position={templateImagePosition}
                                  />
                                </div>
                              </div>
                            )}
                            {lastUploadedTemplate.map((template) => (
                              <div
                                key={template.id}
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer border-2 group ${
                                  selectedTemplate === template.id
                                    ? "bg-[#5465ff]/10 border-[#5465ff] ring-2 ring-[#5465ff]"
                                    : "border-gray-200 hover:border-gray-300 dark:border-[#0e0f15] dark:hover:border-[#27272A]"
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTemplate();
                                  }}
                                  className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                                  title="Delete template"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                <div className="relative w-full h-full">
                                  <TemplateImage 
                                    template={{ 
                                      url: template.url,
                                      type: template.type
                                    }} 
                                    alt={`Template ${template.id}`} 
                                    position={templateImagePosition}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </section>

                    {/* Videos Upload - Moved to position 4 */}
                    <section className="space-y-2 bg-[#f3f4ee] dark:bg-[#0e0f15] p-3 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fafafa] text-[#0a0a0c] font-bold text-sm border border-gray-200 dark:border-[#18181a]">4</div>
                          <h2 className="text-base font-bold dark:text-white">Part 2</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <div {...getRootProps()}>
                            <input {...getInputProps()} />
                            <button className="px-3 py-1.5 bg-[#202123] text-white rounded-lg hover:bg-[#202123]/90 transition-colors text-sm font-normal flex items-center gap-2">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 14v5a2 2 0 002 2h14a2 2 0 002-2v-5M12 3v12M5 10l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Upload
                            </button>
                          </div>
                          {selectedMedias.length > 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">{selectedMedias.length}/50</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-center mt-auto pt-4 mb-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="2"
                              max="29"
                              value={videoDurationRange.min}
                              onChange={(e) => {
                                const newMin = Number(e.target.value);
                                if (newMin >= 2 && newMin < videoDurationRange.max) {
                                  setVideoDurationRange(prev => ({
                                    min: newMin,
                                    max: prev.max
                                  }));
                                }
                              }}
                              className="w-12 h-7 px-1 border border-gray-300 dark:border-[#0e0f15] dark:bg-[#18181a] dark:text-white rounded-md text-center text-sm"
                            />
                            <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>
                            <input
                              type="number"
                              min="3"
                              max="30"
                              value={videoDurationRange.max}
                              onChange={(e) => {
                                const newMax = Number(e.target.value);
                                if (newMax <= 30 && newMax > videoDurationRange.min) {
                                  setVideoDurationRange(prev => ({
                                    min: prev.min,
                                    max: newMax
                                  }));
                                }
                              }}
                              className="w-12 h-7 px-1 border border-gray-300 dark:border-[#0e0f15] dark:bg-[#18181a] dark:text-white rounded-md text-center text-sm"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">Seconds</span>
                          </div>
                        </div>
                      </div>
                      {selectedMedias.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                          <div>
                            <p>No media uploaded</p>
                            <p className="text-sm mt-2">Upload videos or images to continue (50 max)</p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              {selectedMediaIndexes.size >= 2 && (
                                <button
                                  onClick={handleDeleteSelectedMedias}
                                  className="text-red-500 hover:text-red-600 transition-colors"
                                  title="Delete selected medias"
                                >
                                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={toggleAllMedias}
                                className="text-xs text-[#5465ff] hover:underline dark:text-[#f8d4eb]"
                              >
                                {selectedMediaIndexes.size === selectedMedias.length
                                  ? "Deselect All"
                                  : "Select All"}
                              </button>
                            </div>
                          </div>
                          <ScrollArea className="h-[200px] w-full">
                            <div className="grid grid-cols-5 gap-2 p-1 min-w-[200px]">
                              {selectedMedias.map((media, index) => (
                                <div
                                  key={index}
                                  onClick={() => toggleMediaSelection(index)}
                                  className={`relative w-10 aspect-[9/16] rounded-lg overflow-hidden cursor-pointer border-2 group ${
                                    selectedMediaIndexes.has(index)
                                      ? "bg-[#5465ff]/10 border-[#5465ff] ring-2 ring-[#5465ff] dark:bg-[#5465ff]/10 dark:border-[#5465ff] dark:ring-[#5465ff]"
                                      : "border-transparent hover:border-gray-500 dark:hover:border-gray-300"
                                  }`}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMedia(index);
                                    }}
                                    className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                                    title="Delete media"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                  <div className="relative w-full h-full">
                                    {media.url ? (
                                      <div className="relative w-full h-full">
                                        {media.type === 'video' ? (
                                          <video 
                                            id={`video-${index}`}
                                            src={media.url} 
                                            className="w-full h-full object-cover"
                                            preload="metadata"
                                            autoPlay
                                            muted
                                            loop
                                          />
                                        ) : (
                                          <Image 
                                            src={media.url}
                                            alt={`Media ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            layout="fill"
                                          />
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-center p-2">
                                        <p className="text-xs font-medium truncate dark:text-white">{media.file.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {media.type === 'video' ? formatDuration(media.duration) : '5s'}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </section>
                  </div>

                  {/* Create Videos Button */}
                  <div className="flex flex-col items-center justify-center mt-8 mb-4">
                    <Button
                      onClick={handleCreateVideos}
                      disabled={!selectedTemplate || selectedMediaIndexes.size === 0 || !selectedSong || !hooks || isGenerating}
                      className="w-64 h-12 text-lg font-semibold bg-[#5564ff] hover:bg-[#5564ff]/90 text-white"
                    >
                      {isGenerating ? (
                        <div className="flex items-center justify-center w-full">
                          <span>Generating...</span>
                        </div>
                      ) : (
                        `Create ${hooks.split('\n').filter(line => line.trim() !== '').length} Videos`
                      )}
                    </Button>
                  </div>

                  {/* Progress bar pendant la génération */}
                  {isGenerating && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                      <div className="bg-white dark:bg-[#18181a] rounded-xl shadow-xl p-8 max-w-md w-full mx-4 transform transition-all">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-semibold dark:text-white">Generating Videos</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-300">Please wait while your videos are being created</p>
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-bold text-[#5465ff]">{Math.round(progress)}%</span>
                          </div>
                        </div>
                        
                        <div className="relative w-full h-6 bg-gray-100 dark:bg-[#0e0f15] rounded-full overflow-hidden mb-4">
                          <div
                            className="absolute left-0 top-0 h-full bg-[#5465ff] transition-all duration-300 rounded-full"
                            style={{ 
                              width: `${progress}%`,
                              transition: progress < 90 ? 'width 0.5s ease-in-out' : 'none'
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#5465ff] rounded-full animate-pulse" />
                            <span>Processing video {generatedCount + 1} of {totalToGenerate}</span>
                          </div>
                          <span className="font-medium">{generatedCount}/{totalToGenerate} videos</span>
                        </div>
                        
                        {/* Estimation du temps restant basée sur la taille des fichiers */}
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                          {progress < 90 ? (
                            <div className="text-center">
                              {progress === 0 ? (
                                "Calculating estimated time..."
                              ) : (
                                <>
                                  Estimated time remaining: {Math.ceil(
                                    ((totalToGenerate - generatedCount) * 
                                    (selectedTemplate ? 
                                      estimateProcessingTime(
                                        (templates.find(t => t.id === selectedTemplate) as any)?.size ?? 1024 * 1024,
                                        selectedMedias.reduce((avg, media, _, { length }) => 
                                          avg + (media.file?.size || 0) / length, 0
                                        )
                                      ) : BASE_PROCESSING_TIME)
                                    ) / 60
                                  )} minutes
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="text-center">
                              Finalizing video generation...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Animation de fin */}
                  {showCompletionAnimation && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                      <div className="bg-white dark:bg-[#18181a] rounded-xl shadow-xl p-8 max-w-md w-full mx-4 transform transition-all" style={{ animation: 'fadeInScale 0.5s ease-out' }}>
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-24 h-24 rounded-full bg-[#5465ff] flex items-center justify-center mb-6" style={{ animation: 'bounce 2s ease' }}>
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-center mb-2 dark:text-white">Generation Complete!</h3>
                          <p className="text-center text-gray-500 dark:text-gray-300 mb-4">All your videos have been successfully created</p>
                          <div className="w-full bg-gray-100 dark:bg-[#0e0f15] rounded-full h-2 mb-4">
                            <div className="bg-[#5465ff] h-2 rounded-full" style={{ animation: 'progress 1s ease-in-out forwards' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option de téléchargement après génération */}
                  {generationComplete && !isGenerating && generatedVideos.length > 0 && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                      <div className="bg-white dark:bg-[#18181a] rounded-xl shadow-xl p-8 max-w-md w-full mx-4 border border-gray-300 dark:border-gray-700">
                        <div className="flex flex-col items-center justify-center">
                          <h3 className="text-2xl font-bold text-center mb-4 dark:text-white">Your {generatedVideos.length} videos are ready !</h3>
                          <p className="text-center text-gray-500 dark:text-gray-300 mb-6">What would you like to do next ?</p>
                          <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <button
                              onClick={handleDownloadAll}
                              className="px-6 py-3 bg-gradient-to-r from-[#f8d4eb] via-[#ce7acb] to-[#e9bcba] text-[#0a0a0c] rounded-lg font-medium flex-1 hover:opacity-90 transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                              </svg>
                              Download All ({generatedVideos.length} vidéos)
                            </button>
                            <button
                              onClick={() => {
                                setGenerationComplete(false);
                                // Ne pas réinitialiser les champs pour permettre à l'utilisateur
                                // de revenir au popup de téléchargement si nécessaire
                                // resetFormFields();
                              }}
                              className="px-6 py-3 border border-gray-300 dark:border-[#0e0f15] text-gray-700 dark:text-white rounded-lg font-medium flex-1 hover:bg-gray-50 dark:hover:bg-[#18191C] transition-colors duration-200"
                            >
                              Close
                            </button>
                            </div>
                          </div>
                      </div>
                    </div>
                  )}

                  {/* Video Preview Modal */}
                  {previewVideo && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                      <div className="relative w-full max-w-4xl">
                        <button
                          onClick={() => setPreviewVideo(null)}
                          className="absolute -top-10 right-0 text-white hover:text-gray-300"
                        >
                          Close
                        </button>
                        <video
                          className="w-full rounded-lg"
                          src={previewVideo}
                          controls
                          autoPlay
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </div>
                  )}

                  {/* Download Modal */}
                  {showDownloadModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-white dark:bg-[#18181a] rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold dark:text-white">Vidéos générées</h3>
                          <button
                            onClick={() => setShowDownloadModal(false)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-[#18191C] rounded-lg dark:text-white"
                          >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                          <div className="grid gap-4">
                            {generatedVideos.map((videoFileName, index) => (
                              <div
                                key={videoFileName}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0e0f15] rounded-xl"
                              >
                                <span className="font-medium dark:text-white">Vidéo {index + 1}</span>
                                <button
                                  onClick={() => handleDownloadVideo(videoFileName)}
                                  className="px-4 py-2 bg-[#5465ff] text-white rounded-lg hover:bg-[#5465ff]/90 transition-colors"
                                >
                                  Télécharger
                                </button>
                      </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-4">
                          <button
                            onClick={() => setShowDownloadModal(false)}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                          >
                            Fermer
                          </button>
                          <button
                            onClick={handleDownloadAll}
                            className="px-6 py-3 bg-[#5465ff] text-white rounded-xl hover:bg-[#5465ff]/90 transition-colors"
                          >
                            Tout télécharger ({generatedVideos.length} vidéos)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Preview */}
              <div className="w-[250px] sm:w-[250px] md:w-[300px] lg:w-[350px] xl:w-[400px] p-3 sm:p-4 xl:p-6 bg-[#f3f4ee] dark:bg-[#18181A] flex-col items-center justify-center border-l border-gray-200 dark:border-[#0e0f15] flex">
                <div className="w-full max-w-[220px] md:max-w-[280px] xl:max-w-[320px]">
                  <div className="aspect-[9/16] rounded-2xl bg-white dark:bg-[#18181A] shadow-lg overflow-hidden relative">
                    {selectedTemplate ? (
                      <>
                        <TemplateImage 
                          template={{ 
                            url: selectedTemplate === defaultTemplate?.id 
                              ? defaultTemplate.url 
                              : templates.find(t => t.id === selectedTemplate)?.url || "",
                            type: selectedTemplate === defaultTemplate?.id
                              ? defaultTemplate.type || 'image'
                              : templates.find(t => t.id === selectedTemplate)?.type || 'image'
                          }} 
                          alt="Preview" 
                          position={templateImagePosition}
                        />
                        {hooks && (
                          <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full"
                            style={{ pointerEvents: 'none' }}
                          />
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full relative">
                        <Image
                          src="/preview.jpg"
                          alt="Preview background"
                          layout="fill"
                          objectFit="cover"
                          className="absolute inset-0"
                        />
                        <div className="relative w-full h-full">
                          <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full"
                            style={{ pointerEvents: 'none' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Text Position Controls */}
                  <div className="flex flex-col items-center gap-4 mt-2">
                    {/* Position Buttons */}
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={(e) => {
                          if (currentStyle === 1) {
                            setStyle1Position({ position: 'top', offset: 0 });
                          } else {
                            setStyle2Position({ position: 'top', offset: 0 });
                          }
                        }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          (currentStyle === 1 ? style1Position.position : style2Position.position) === 'top'
                            ? 'bg-[#5465ff] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0c]'
                            : 'bg-white hover:bg-white/80 dark:bg-[#0e0f15] dark:hover:bg-[#18191C] dark:text-white'
                        }`}
                      >
                        <svg className={`w-6 h-6 ${(currentStyle === 1 ? style1Position.position : style2Position.position) === 'top' && 'dark:text-[#0a0a0c]'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 5h16M4 9h16M10 13h4m-4 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          if (currentStyle === 1) {
                            setStyle1Position({ position: 'middle', offset: 0 });
                          } else {
                            setStyle2Position({ position: 'middle', offset: 0 });
                          }
                        }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          (currentStyle === 1 ? style1Position.position : style2Position.position) === 'middle'
                            ? 'bg-[#5465ff] text-[#fafafa] dark:bg-[#fafafa] dark:text-[#0a0a0c]'
                            : 'bg-white hover:bg-white/80 dark:bg-[#0e0f15] dark:hover:bg-[#18191C] dark:text-white'
                        }`}
                      >
                        <svg className={`w-6 h-6 ${(currentStyle === 1 ? style1Position.position : style2Position.position) === 'middle' && 'dark:text-[#0a0a0c]'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 9h16M4 12h16M4 15h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>

                    {/* Fine Position Control */}
                    <div className="flex gap-2 items-center">
                      {/* Test Hook button */}
                      {hooks && (
                        <Button
                          onClick={async () => {
                            try {
                              const hookText = getFirstHook();
                              
                              // Ne pas créer de preview si le hook est vide
                              if (hookText.trim() === "") {
                                toast.info("Veuillez d'abord saisir un hook");
                                return;
                              }
                              
                              const response = await fetch('/api/create-hook-preview', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  text: hookText,
                                  style: currentStyle,
                                  position: currentStyle === 1 ? style1Position.position : style2Position.position,
                                  offset: currentStyle === 1 ? style1Position.offset : style2Position.offset,
                                }),
                              });
                              
                              if (!response.ok) throw new Error('Failed to create hook preview');
                              
                              const blob = await response.blob();
                              const url = URL.createObjectURL(blob);
                              
                              // Open in new tab
                              window.open(url, '_blank');
                            } catch (error) {
                              console.error('Error creating hook preview:', error);
                            }
                          }}
                          className="bg-[#202123] hover:bg-[#202123]/90 text-white"
                          size="sm"
                        >
                          Test Hook
                        </Button>
                      )}
                      <button
                        onClick={() => {
                          if (currentStyle === 1) {
                            setStyle1Position(prev => ({ ...prev, offset: Math.max(prev.offset - 5, -50) }));
                          } else {
                            setStyle2Position(prev => ({ ...prev, offset: Math.max(prev.offset - 5, -50) }));
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-white/80 dark:bg-[#0e0f15] dark:hover:bg-[#18191C] dark:text-white flex items-center justify-center transition-all"
                        aria-label="Move text up"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 20V4m0 0l-6 6m6-6l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (currentStyle === 1) {
                            setStyle1Position(prev => ({ ...prev, offset: Math.min(prev.offset + 5, 50) }));
                          } else {
                            setStyle2Position(prev => ({ ...prev, offset: Math.min(prev.offset + 5, 50) }));
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-white/80 dark:bg-[#0e0f15] dark:hover:bg-[#18191C] dark:text-white flex items-center justify-center transition-all"
                        aria-label="Move text down"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fonction StepNumber correctement définie pour être utilisée si nécessaire
function StepNumber({ number }: { number: number }) {
  return (
    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black dark:bg-white dark:text-black text-sm font-black">
      {number}
    </div>
  );
} 