// Server-side only imports
let ffmpeg: any;
let ffmpegPath: string;
let ffprobePath: string;

// Only import FFmpeg-related modules on the server side
if (typeof window === 'undefined') {
  try {
    // Get paths from environment variables or fallback to installed paths
    ffmpegPath = process.env.FFMPEG_PATH || require('@ffmpeg-installer/ffmpeg').path;
    ffprobePath = process.env.FFPROBE_PATH || require('@ffprobe-installer/ffprobe').path;
    
    // Import FFmpeg module
    const ffmpegModule = require('fluent-ffmpeg');
    
    // Configure FFmpeg paths using environment variables
    process.env.FFMPEG_PATH = ffmpegPath;
    process.env.FFPROBE_PATH = ffprobePath;
    
    // Assign the configured module
    ffmpeg = ffmpegModule;
    
    // Verify paths are set correctly
    if (!ffmpegPath || !ffprobePath) {
      throw new Error('FFmpeg or FFprobe paths are not set correctly');
    }

    // Test FFmpeg installation
    const { execSync } = require('child_process');
    try {
      execSync(`${ffmpegPath} -version`);
      console.log('FFmpeg initialized successfully with paths:', {
        ffmpeg: ffmpegPath,
        ffprobe: ffprobePath
      });
    } catch (error: any) {
      throw new Error(`FFmpeg test failed: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Error loading FFmpeg modules:', error);
    throw new Error(`Failed to load FFmpeg modules: ${error.message}`);
  }
} else {
  // Stub implementations for client-side
  ffmpeg = null;
  ffmpegPath = '';
  ffprobePath = '';
}

// Import the shared hook text drawing function
import { drawHookText } from './utils';

export interface VideoGenerationOptions {
  template: {
    url: string;
    duration: number;
    position: 'top' | 'center' | 'bottom';
  };
  video: {
    path: string;
    duration: number;
  };
  music: {
    url: string;
  };
  hook: {
    text: string;
    style: {
      type: number;
      position: 'top' | 'middle' | 'bottom';
      offset: number;
    };
  };
  progress?: (progress: number) => void;
}

export async function generateVideo(
  options: VideoGenerationOptions,
  outputPath: string
): Promise<string> {
  // Ensure this function only runs on the server
  if (typeof window !== 'undefined') {
    throw new Error('generateVideo can only be called from the server side');
  }

  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const path = require('path');
    const fs = require('fs/promises');
    const os = require('os');
    const execAsync = promisify(exec);

    // Update progress to 10%
    if (options.progress) options.progress(10);

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
      throw error;
    }

    // Update progress to 20%
    if (options.progress) options.progress(20);

    // Download template and music with error handling
    let templatePath: string;
    let musicPath: string;

    try {
      // Download template
      const templateResponse = await fetch(options.template.url);
      if (!templateResponse.ok) {
        throw new Error(`Failed to fetch template: ${templateResponse.statusText}`);
      }
      const templateBuffer = await templateResponse.arrayBuffer();
      templatePath = path.join(tempDir, `template-${Date.now()}.mp4`);
      await fs.writeFile(templatePath, Buffer.from(templateBuffer));

      // Update progress to 40%
      if (options.progress) options.progress(40);

      // Download music
      const musicResponse = await fetch(options.music.url);
      if (!musicResponse.ok) {
        throw new Error(`Failed to fetch music: ${musicResponse.statusText}`);
      }
      const musicBuffer = await musicResponse.arrayBuffer();
      musicPath = path.join(tempDir, `music-${Date.now()}.mp3`);
      await fs.writeFile(musicPath, Buffer.from(musicBuffer));

      // Update progress to 50%
      if (options.progress) options.progress(50);
    } catch (error: any) {
      console.error('Error downloading media files:', error);
      throw new Error(`Failed to download media files: ${error.message}`);
    }

    // Create a temporary directory for FFmpeg processing
    const ffmpegTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ffmpeg-'));
    console.log('Created temporary directory:', ffmpegTempDir);
    
    // Update progress to 60%
    if (options.progress) options.progress(60);

    // Copy files to temporary directory with simple names
    const simpleTemplatePath = path.join(ffmpegTempDir, 'template.mp4');
    const simpleVideoPath = path.join(ffmpegTempDir, 'video.mp4');
    const simpleMusicPath = path.join(ffmpegTempDir, 'music.mp3');
    const simpleOutputPath = path.join(ffmpegTempDir, 'output.mp4');

    // Copy files to temporary directory
    await Promise.all([
      fs.copyFile(templatePath, simpleTemplatePath),
      fs.copyFile(options.video.path, simpleVideoPath),
      fs.copyFile(musicPath, simpleMusicPath),
    ]);

    // Update progress to 70%
    if (options.progress) options.progress(70);

    // Step 1: Generate the base video using FFmpeg (without text)
    const baseCommand = `ffmpeg -i "${simpleTemplatePath}" -i "${simpleVideoPath}" -i "${simpleMusicPath}" \\
      -filter_complex "[0:v]scale=1080:-1,crop=1080:min(ih\\,1920):0:${options.template.position === 'top' ? '0' : options.template.position === 'bottom' ? 'max(0\\,ih-1920)' : '(ih-min(ih\\,1920))/2'},pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS[scaled_template];[1:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS+${options.template.duration}/TB[scaled_video];[scaled_template][scaled_video]concat=n=2:v=1[outv]" \\
      -map "[outv]" -map 2:a \\
      -c:v libx264 -c:a aac \\
      -t ${options.template.duration + options.video.duration} \\
      "${simpleOutputPath}"`;

    try {
      console.log('Executing FFmpeg command:', baseCommand);
      await execAsync(baseCommand);
      console.log('Base video generated successfully');

      // Update progress to 80%
      if (options.progress) options.progress(80);

      // Step 2: Extract a frame, add text with Canvas, then overlay it back
      const frameOutputPath = path.join(ffmpegTempDir, 'frame.png');
      const textOverlayPath = path.join(ffmpegTempDir, 'text_overlay.png');
      
      // Extract first frame
      const extractFrameCommand = `ffmpeg -i "${simpleOutputPath}" -vframes 1 "${frameOutputPath}"`;
      await execAsync(extractFrameCommand);
      console.log('Frame extracted successfully');

      // Create text overlay using shared function
      const { createCanvas, registerFont } = require('canvas');
      
      // Register custom fonts
      registerFont(path.join(process.cwd(), 'fonts/TikTokDisplayMedium.otf'), {
        family: 'TikTok Display Medium'
      });
      registerFont(path.join(process.cwd(), 'fonts/proximanova-bold.otf'), {
        family: 'Proxima Nova'
      });

      // Create canvas for text overlay
      const canvas = createCanvas(1080, 1920);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw hook text using shared function
      drawHookText(ctx, options.hook.text, options.hook.style);

      // Save text overlay
      const textOverlayBuffer = canvas.toBuffer('image/png');
      await fs.writeFile(textOverlayPath, textOverlayBuffer);

      // Overlay text on video
      const finalOutputPath = path.join(ffmpegTempDir, 'final_output.mp4');
      const overlayCommand = `ffmpeg -i "${simpleOutputPath}" -i "${textOverlayPath}" \\
        -filter_complex "[1:v]format=rgba,colorchannelmixer=aa=1[text];[0:v][text]overlay=0:0:format=auto,format=yuv420p" \\
        -c:v libx264 -c:a copy \\
        "${finalOutputPath}"`;

      await execAsync(overlayCommand);
      console.log('Text overlay added successfully');

      // Copy final output to destination
      await fs.copyFile(finalOutputPath, outputPath);

      // Update progress to 90%
      if (options.progress) options.progress(90);

      // Clean up temporary files
      await Promise.all([
        fs.unlink(simpleTemplatePath),
        fs.unlink(simpleVideoPath),
        fs.unlink(simpleMusicPath),
        fs.unlink(simpleOutputPath),
        fs.unlink(frameOutputPath),
        fs.unlink(textOverlayPath),
        fs.unlink(finalOutputPath)
      ]).catch(console.error);

      // Update progress to 100%
      if (options.progress) options.progress(100);

      return outputPath;
    } catch (error) {
      console.error('Error in video generation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in generateVideo:', error);
    throw error;
  }
}

// Alias for backward compatibility
export const generateVideoWithFFmpeg = generateVideo;

// New overload for generateVideoWithFFmpeg that accepts a single options object
export async function generateVideoWithFFmpeg(options: {
  templateImage: string;
  mediaFile: string;
  hook: string;
  font: string;
  music: string | null;
  templateDuration: number;
  mediaDuration: number;
  templatePosition: {
    x: number;
    y: number;
    scale: number;
  };
}): Promise<File> {
  if (typeof window !== 'undefined') {
    throw new Error('generateVideoWithFFmpeg can only be called from the server side');
  }

  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // Create temp directory for output
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'video-'));
    const outputPath = path.join(tempDir, 'output.mp4');

    // Map new options format to original format
    const videoOptions: VideoGenerationOptions = {
      template: {
        url: options.templateImage,
        duration: options.templateDuration,
        position: 'center' // Default position
      },
      video: {
        path: options.mediaFile,
        duration: options.mediaDuration
      },
      music: options.music ? {
        url: options.music
      } : { url: '' }, // Empty string as fallback
      hook: {
        text: options.hook,
        style: {
          type: 1, // Default style
          position: 'middle',
          offset: 0
        }
      }
    };

    // Call the original implementation
    await generateVideo(videoOptions, outputPath);
    
    // Read the file
    const buffer = await fs.promises.readFile(outputPath);
    
    // Convert to File
    const filename = `video-${Date.now()}.mp4`;
    // @ts-ignore
    return new File([buffer], filename, { type: 'video/mp4', lastModified: Date.now() });
  } catch (error) {
    console.error('Error in generateVideoWithFFmpeg:', error);
    throw error;
  }
}

export async function generateImageWithHook(
  imagePath: string,
  hookText: string,
  fontPath: string,
  position?: { x: number, y: number, scale: number }
): Promise<File> {
  if (typeof window !== 'undefined') {
    throw new Error('generateImageWithHook can only be called from the server side');
  }

  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // Create temp directory for output
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hook-image-'));
    const outputPath = path.join(tempDir, 'output.png');

    // Build the ffmpeg command
    const x = position?.x || '(w-text_w)/2';
    const y = position?.y || '(h-text_h)/2';
    const scale = position?.scale || 1;
    const fontSize = Math.floor(24 * scale);

    const command = `ffmpeg -i "${imagePath}" -vf drawtext="text='${hookText}':fontfile='${fontPath}':fontsize=${fontSize}:fontcolor=white:x=${x}:y=${y}" "${outputPath}"`;
    
    await execAsync(command);
    
    // Read the file
    const buffer = await fs.promises.readFile(outputPath);
    
    // Convert buffer to a Blob
    const blob = new Blob([buffer], { type: 'image/png' });
    
    // Convert Blob to File
    const filename = `hook-image-${Date.now()}.png`;
    // @ts-ignore - File constructor is available in Node.js environment when using next.js
    return new File([blob], filename, { type: 'image/png', lastModified: Date.now() });
  } catch (error) {
    console.error('Error generating image with hook:', error);
    throw error;
  }
}

function generateSubtitleFile(
  text: string,
  styleType: number,
  position: 'top' | 'middle' | 'bottom',
  offset: number,
  duration: number
): string {
  const verticalPosition = position === 'top' ? 10 : position === 'middle' ? 50 : 90;
  const adjustedPosition = verticalPosition + offset;

  // Style 1: Texte blanc avec ombre
  const style1 = {
    fontname: 'Proxima Nova',
    fontsize: 72, // Augmenté pour correspondre à text-2xl
    primaryColour: '&HFFFFFF', // Blanc
    secondaryColour: '&H000000',
    outlineColour: '&H000000',
    backColour: '&H000000',
    bold: -1,
    italic: 0,
    borderStyle: 1,
    outline: 2, // Réduit pour correspondre à l'ombre
    shadow: 2, // Ajout d'une ombre
    alignment: 2,
    marginL: 10,
    marginR: 10,
    marginV: adjustedPosition,
    encoding: 1,
    spacing: 0.001 // Ajout du letter-spacing
  };

  // Style 2: Texte noir sur fond blanc
  const style2 = {
    fontname: 'Proxima Nova',
    fontsize: 72, // Augmenté pour correspondre à text-2xl
    primaryColour: '&H000000', // Noir
    secondaryColour: '&HFFFFFF',
    outlineColour: '&HFFFFFF',
    backColour: '&HFFFFFF', // Fond blanc
    bold: 1, // Gras pour correspondre à fontWeight: 600
    italic: 0,
    borderStyle: 1,
    outline: 0,
    shadow: 2,
    alignment: 2,
    marginL: 10,
    marginR: 10,
    marginV: adjustedPosition,
    encoding: 1,
    spacing: 0.001 // Ajout du letter-spacing
  };

  const style = styleType === 1 ? style1 : style2;

  return `[Script Info]
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontname},${style.fontsize},${style.primaryColour},${style.secondaryColour},${style.outlineColour},${style.backColour},${style.bold},${style.italic},${style.borderStyle},${style.outline},${style.shadow},${style.alignment},${style.marginL},${style.marginR},${style.marginV},${style.encoding}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:${duration.toString().padStart(2, '0')}:00.00,Default,,0,0,0,,${text}`;
}

export async function cleanupTempFiles(files: string[]) {
  if (typeof window !== 'undefined') {
    throw new Error('cleanupTempFiles can only be called from the server side');
  }

  const fs = require('fs/promises');
  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.unlink(file);
      } catch (error) {
        console.error(`Error deleting temporary file ${file}:`, error);
      }
    })
  );
}

function generateDrawTextFilter(text: string, style: { type: number; position: 'top' | 'middle' | 'bottom'; offset: number }) {
  // Calculate vertical position
  const yPosition = style.position === 'top' ? 'h*0.15' : 
                   style.position === 'middle' ? 'h*0.5' : 
                   'h*0.85';
  
  // Apply offset
  const offsetY = `${yPosition}${style.offset !== 0 ? `+h*${(style.offset / 50) * 0.1}` : ''}`;

  if (style.type === 2) {
    // Style 2: Black text on white background with shadow
    return `drawtext=text='${text}':
      fontfile=/System/Library/Fonts/TikTokDisplayMedium.otf:
      fontsize=h*0.07:
      fontcolor=black:
      x=(w-text_w)/2:
      y=${offsetY}:
      box=1:
      boxcolor=white@0.98:
      boxborderw=24:
      borderw=0:
      line_spacing=12:
      shadowcolor=black@0.1:
      shadowx=4:
      shadowy=4:
      font='TikTok Display Medium':
      expansion=normal`;
  } else {
    // Style 1: White text with black outline
    return `drawtext=text='${text}':
      fontfile=/System/Library/Fonts/TikTokDisplayMedium.otf:
      fontsize=h*0.07:
      fontcolor=white:
      x=(w-text_w)/2:
      y=${offsetY}:
      bordercolor=black:
      borderw=24:
      line_spacing=0:
      font='TikTok Display Medium':
      expansion=normal`;
  }
} 