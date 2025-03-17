"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { AuthGuard } from "@/components/AuthGuard";

export default function Home() {
  const router = useRouter();

  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="flex flex-col items-center space-y-8 max-w-4xl w-full">
          <div className="flex flex-col items-center space-y-4 mb-8">
            <div className="w-24 h-24 flex items-center justify-center bg-[#fafafa] dark:bg-[#18191C] rounded-2xl shadow-sm">
              <Image
                src="/BluumLogo.png"
                alt="Bluum Logo"
                width={72}
                height={72}
                className="object-contain dark:hidden"
                priority
              />
              <Image
                src="/BluumLogoDarkTheme.png"
                alt="Bluum Logo Dark"
                width={72}
                height={72}
                className="object-contain hidden dark:block"
                priority
              />
            </div>
            <p className="text-lg text-muted-foreground dark:text-white text-center">
            Create up to 1,000 videos per day with AI-powered automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Create New Video */}
            <div className="rounded-xl border dark:border-[#27272A] bg-[#fafafa] dark:bg-[#18191C] p-6 hover:shadow-md transition-all">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#18191C] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Create New Video</h3>
                  <p className="text-muted-foreground dark:text-gray-300 mb-4">
                    Start a new video project with templates, media, and hooks
                  </p>
                </div>
                <Button 
                  className="bg-[#5564ff] hover:bg-[#5564ff]/90 text-white w-full dark:bg-[#fafafa] dark:hover:bg-[#fafafa]/90 dark:text-[#0a0a0c]"
                  onClick={() => router.push("/create")}
                >
                  Create Videos
                </Button>
              </div>
            </div>

            {/* My Videos */}
            <div className="rounded-xl border dark:border-[#27272A] bg-[#fafafa] dark:bg-[#18191C] p-6 hover:shadow-md transition-all">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#18191C] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">My Videos</h3>
                  <p className="text-muted-foreground dark:text-gray-300 mb-4">
                    Continue working on your existing projects
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="text-muted-foreground dark:text-white hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#27272A] w-full dark:border-[#27272A]"
                  onClick={() => router.push("/videos")}
                >
                  View Videos
                </Button>
              </div>
            </div>

            {/* My Music */}
            <div className="rounded-xl border dark:border-[#27272A] bg-[#fafafa] dark:bg-[#18191C] p-6 hover:shadow-md transition-all">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#18191C] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">My Music</h3>
                  <p className="text-muted-foreground dark:text-gray-300 mb-4">
                    Manage your music library for video projects
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="text-muted-foreground dark:text-white hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#27272A] w-full dark:border-[#27272A]"
                  onClick={() => router.push("/music")}
                >
                  View Music
                </Button>
              </div>
            </div>

            {/* Settings */}
            <div className="rounded-xl border dark:border-[#27272A] bg-[#fafafa] dark:bg-[#18191C] p-6 hover:shadow-md transition-all">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#18191C] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 dark:text-white">Settings</h3>
                  <p className="text-muted-foreground dark:text-gray-300 mb-4">
                    Configure your account and preferences
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="text-muted-foreground dark:text-white hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#27272A] w-full dark:border-[#27272A]"
                  onClick={() => router.push("/settings")}
                >
                  Open Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 