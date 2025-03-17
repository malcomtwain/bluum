"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { UserButton } from "@clerk/nextjs";
import { UpgradeButton } from "@/components/UpgradeButton";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';

  if (isAuthPage || !userId) {
    return <main className="w-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      {/* User button in the top right */}
      <div className="fixed top-4 right-4 z-50">
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: { 
              avatarBox: "w-9 h-9 text-base",
              userPreviewMainIdentifier: "text-sm font-medium dark:text-[#fafafa]"
            }
          }}
        />
      </div>
      
      {/* Fixed sidebar */}
      <div className="fixed left-0 top-0 h-full z-30">
        <Sidebar />
      </div>
      
      {/* Global upgrade button */}
      <UpgradeButton />
      
      {/* Main content with appropriate margin to account for sidebar */}
      <main className="flex-1 ml-[70px] xl:ml-[260px]">{children}</main>
    </div>
  );
} 