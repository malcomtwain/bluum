import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { generateVideo, cleanupTempFiles } from '@/lib/ffmpeg';
import { updateProgress } from '@/lib/progress';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const jsonData = JSON.parse(formData.get('json') as string);
    
    // Create temp directory for processing
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-gen-'));
    const generatedVideos: string[] = [];
    
    // Save videos to temp directory
    const videoFiles: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('video_') && value instanceof File) {
        const filePath = path.join(tempDir, value.name);
        await fs.writeFile(filePath, Buffer.from(await value.arrayBuffer()));
        videoFiles.push(filePath);
      }
    }

    // Vérifier que FFmpeg est disponible dans l'environnement actuel
    try {
      // Generate videos for each hook and video combination
      for (const hook of jsonData.hooks) {
        for (const videoPath of videoFiles) {
          try {
            // Generate output filename
            const outputFileName = `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`;
            const outputPath = path.join(process.cwd(), 'public', 'generated', outputFileName);

            // Generate video with progress tracking
            const options = {
              template: {
                url: jsonData.template.url,
                duration: jsonData.duration.template,
                position: jsonData.templateImagePosition
              },
              video: {
                path: videoPath,
                duration: jsonData.duration.video,
              },
              music: {
                url: jsonData.music.url,
              },
              hook: {
                text: hook,
                style: {
                  type: jsonData.style.type,
                  position: jsonData.style.position,
                  offset: jsonData.style.offset,
                },
              },
              progress: (progress: number) => {
                console.log(`Progress: ${progress}%`);
                updateProgress(progress);
              },
            };

            console.log('Generating video with durations:', {
              template: options.template.duration,
              video: options.video.duration,
              total: options.template.duration + options.video.duration
            });

            await generateVideo(options, outputPath);

            generatedVideos.push(`/generated/${outputFileName}`);
          } catch (error) {
            console.error('Error generating video:', error);
          }
        }
      }
    } catch (ffmpegError) {
      console.error('FFmpeg processing error:', ffmpegError);
      // Retourner une réponse appropriée sans interrompre le déploiement
      return NextResponse.json({
        success: false,
        message: 'Video generation is not available in this environment',
        error: ffmpegError instanceof Error ? ffmpegError.message : 'FFmpeg error',
      }, { status: 503 }); // Service Unavailable
    }

    // Clean up temp files
    await cleanupTempFiles(videoFiles);
    await fs.rmdir(tempDir);
    
    return NextResponse.json({
      success: true,
      videos: generatedVideos,
    });

  } catch (error) {
    console.error('Error generating videos:', error);
    return NextResponse.json({
      success: false,
      message: 'Error generating videos',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 