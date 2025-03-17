// Stub implementation for uploadthing
// import { createUploadthing, type FileRouter } from "uploadthing/next";
import { currentUser } from "@clerk/nextjs";

// Define FileRouter type
type FileRouter = Record<string, any>;

// Stub implementation
const createUploadthing = () => {
  return {
    image: () => ({
      maxFileSize: (size: string) => ({
        maxFileCount: (count: number) => ({
          middleware: (fn: Function) => ({
            onUploadComplete: (fn: Function) => ({})
          })
        })
      })
    }),
    video: () => ({
      maxFileSize: (size: string) => ({
        maxFileCount: (count: number) => ({
          middleware: (fn: Function) => ({
            onUploadComplete: (fn: Function) => ({})
          })
        })
      })
    }),
    audio: (config: any) => ({
      middleware: (fn: Function) => ({
        onUploadComplete: (fn: Function) => ({})
      })
    })
  };
};

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f.image()
    .maxFileSize("4MB")
    .maxFileCount(1)
    .middleware(async () => {
      const { userId } = currentUser();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }: any) => {
      return { fileUrl: "https://example.com/image.jpg" };
    }),

  mediaUploader: f.image()
    .maxFileSize("4MB")
    .maxFileCount(10)
    .middleware(async () => {
      const { userId } = currentUser();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }: any) => {
      return { fileUrl: "https://example.com/media.jpg" };
    }),

  musicUploader: f.audio({
    "audio/mpeg": { maxFileSize: "4MB", maxFileCount: 5 },
    "audio/wav": { maxFileSize: "4MB", maxFileCount: 5 },
    "audio/m4a": { maxFileSize: "4MB", maxFileCount: 5 }
  })
    .middleware(async () => {
      const { userId } = currentUser();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }: any) => {
      return { fileUrl: "https://example.com/audio.mp3" };
    })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 