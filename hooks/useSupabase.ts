import { useCallback, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase, uploadFile, getFileUrl, deleteFile, uploadFileWithFallback, getFileUrlWithFallback } from '@/lib/supabase';
import { generateVideoWithFFmpeg, generateImageWithHook } from '@/lib/ffmpeg';

export function useSupabase() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour synchroniser les données utilisateur entre Clerk et Supabase
  const syncUser = useCallback(async (userData: { 
    id: string; 
    email?: string; 
    firstName?: string; 
    lastName?: string; 
    imageUrl?: string; 
  }) => {
    if (!userData.id) return;
    
    try {
      await supabase
        .from('users')
        .upsert({
          clerk_id: userData.id,
          email: userData.email || '',
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          avatar_url: userData.imageUrl || '',
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }, []);

  const createProject = useCallback(async (name: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, ensure user exists in our database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({
          clerk_id: user.id,
          email: user.emailAddresses[0].emailAddress,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Then create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: userData.id,
          name,
        })
        .select()
        .single();

      if (projectError) throw projectError;
      return project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const uploadTemplate = useCallback(async (file: File, projectId: string, position: { x: number; y: number; scale: number }, duration: number) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const path = `${user.id}/${projectId}/templates/${Date.now()}-${file.name}`;
      
      // Use the enhanced upload function with local storage fallback
      const uploadResult = await uploadFileWithFallback(file, 'templates', path);
      
      // Create a record in the database if using Supabase storage
      let templateData;
      
      if (uploadResult.storage === 'supabase') {
        // If using Supabase, create a record in the database
        const { data, error } = await supabase
          .from('templates')
          .insert({
            project_id: projectId,
            storage_path: path,
            position_x: position.x,
            position_y: position.y,
            scale: position.scale,
            duration,
          })
          .select()
          .single();

        if (error) {
          console.warn('Failed to insert template record in database:', error);
          // Continue with local fallback even if database insert fails
        } else {
          templateData = data;
        }
      }
      
      // If no template data from database, create a local version
      if (!templateData) {
        const timestamp = new Date().toISOString();
        templateData = {
          id: `local_${Date.now()}`,
          project_id: projectId,
          storage_path: uploadResult.path,
          position_x: position.x,
          position_y: position.y,
          scale: position.scale,
          duration,
          created_at: timestamp,
          storage_type: uploadResult.storage
        };
        
        // Store template metadata in localStorage for persistence
        try {
          const localTemplates = JSON.parse(localStorage.getItem('local_templates') || '[]');
          localTemplates.push(templateData);
          localStorage.setItem('local_templates', JSON.stringify(localTemplates));
        } catch (e) {
          console.warn('Failed to store template metadata in localStorage:', e);
        }
      } else {
        // Add storage type to the template data
        templateData.storage_type = uploadResult.storage;
      }
      
      return templateData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const uploadMedia = useCallback(async (file: File, projectId: string, type: 'image' | 'video', duration: number, orderIndex: number) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const path = `${user.id}/${projectId}/media/${Date.now()}-${file.name}`;
      await uploadFile(file, 'media', path);

      const { data, error } = await supabase
        .from('media')
        .insert({
          project_id: projectId,
          storage_path: path,
          type,
          duration,
          order_index: orderIndex,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const uploadMusic = useCallback(async (file: File, projectId: string, orderIndex: number) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const path = `${user.id}/${projectId}/music/${Date.now()}-${file.name}`;
      await uploadFile(file, 'music', path);

      const { data, error } = await supabase
        .from('music')
        .insert({
          project_id: projectId,
          storage_path: path,
          order_index: orderIndex,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addHook = useCallback(async (projectId: string, text: string, position: { x: number; y: number }) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('hooks')
        .insert({
          project_id: projectId,
          text,
          position_x: position.x,
          position_y: position.y,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const generateImages = useCallback(async (projectId: string, templateId: string, hookId: string, fontType: 'withBackground' | 'normal') => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the template and hook data
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      const { data: hook, error: hookError } = await supabase
        .from('hooks')
        .select('*')
        .eq('id', hookId)
        .single();

      if (hookError) throw hookError;

      // Get the template image URL
      const templateUrl = await getFileUrl('templates', template.storage_path);

      // Generate the image with FFmpeg
      const imageBlob = await generateImageWithHook(
        templateUrl,
        hook.text,
        fontType === 'withBackground' ? '/fonts/with-background.ttf' : '/fonts/normal.ttf',
        {
          x: template.position_x,
          y: template.position_y,
          scale: template.scale,
        }
      );

      // Upload the generated image
      const path = `${user.id}/${projectId}/generated/${Date.now()}-image.png`;
      await uploadFile(imageBlob, 'generated', path);

      // Save the generated image to the database
      const { data, error } = await supabase
        .from('generated_images')
        .insert({
          project_id: projectId,
          template_id: templateId,
          hook_id: hookId,
          storage_path: path,
          font_type: fontType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const generateVideo = useCallback(async (
    projectId: string,
    generatedImageId: string,
    mediaId: string,
    musicId: string | null
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all the necessary data
      const { data: generatedImage, error: imageError } = await supabase
        .from('generated_images')
        .select(`
          *,
          template:templates(*),
          hook:hooks(*)
        `)
        .eq('id', generatedImageId)
        .single();

      if (imageError) throw imageError;

      const { data: media, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (mediaError) throw mediaError;

      const { data: music, error: musicError } = musicId ? await supabase
        .from('music')
        .select('*')
        .eq('id', musicId)
        .single() : { data: null, error: null };

      if (musicError) throw musicError;

      // Get all the file URLs
      const imageUrl = await getFileUrl('generated', generatedImage.storage_path);
      const mediaUrl = await getFileUrl('media', media.storage_path);
      const musicUrl = music ? await getFileUrl('music', music.storage_path) : null;

      // Generate the video with FFmpeg
      const videoBlob = await generateVideoWithFFmpeg({
        templateImage: imageUrl,
        mediaFile: mediaUrl,
        hook: generatedImage.hook.text,
        font: generatedImage.font_type === 'withBackground' ? '/fonts/with-background.ttf' : '/fonts/normal.ttf',
        music: musicUrl,
        templateDuration: generatedImage.template.duration,
        mediaDuration: media.duration,
        templatePosition: {
          x: generatedImage.template.position_x,
          y: generatedImage.template.position_y,
          scale: generatedImage.template.scale,
        },
      });

      // Upload the generated video
      const path = `${user.id}/${projectId}/generated/${Date.now()}-video.mp4`;
      await uploadFile(videoBlob, 'generated', path);

      // Save the generated video to the database
      const { data, error } = await supabase
        .from('generated_videos')
        .insert({
          project_id: projectId,
          generated_image_id: generatedImageId,
          media_id: mediaId,
          music_id: musicId,
          storage_path: path,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isLoading,
    error,
    createProject,
    uploadTemplate,
    uploadMedia,
    uploadMusic,
    addHook,
    generateImages,
    generateVideo,
    syncUser,
  };
} 