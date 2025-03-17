"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  PackageIcon, 
  ZapIcon, 
  BuildingIcon, 
  CheckIcon, 
  XIcon, 
  VideoIcon, 
  LayoutIcon, 
  MousePointerIcon,
  ClockIcon,
  InfoIcon
} from "lucide-react";
import { useUserPlanStore } from "@/store/userPlanStore";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { plan } = useUserPlanStore();
  const email = user?.emailAddresses[0]?.emailAddress || '';
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const isBusinessPlan = email === "bluumfrerk@gmail.com" || plan === "business";
  const isProfessionalPlan = plan === "professional";
  const isBasicPlan = plan === "basic";

  // Discount de 20% pour les plans annuels
  const yearlyDiscount = 0.2;
  
  // Prix mensuels
  const basicMonthlyPrice = 29;
  const proMonthlyPrice = 99;
  const businessMonthlyPrice = 299;
  
  // Prix annuels (avec la réduction)
  const basicYearlyPrice = Math.round(basicMonthlyPrice * 12 * (1 - yearlyDiscount));
  const proYearlyPrice = Math.round(proMonthlyPrice * 12 * (1 - yearlyDiscount));
  const businessYearlyPrice = Math.round(businessMonthlyPrice * 12 * (1 - yearlyDiscount));

  return (
    <div className="h-[calc(100vh-65px)] w-full overflow-y-auto bg-[#fafafa] dark:bg-[#0e0f15]">
      <div className="ml-[70px] xl:ml-[260px] h-full flex flex-col py-6 md:py-8 px-4 sm:px-6 md:px-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-center dark:text-white">Choose your plan</h1>
          
          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center">
            <div className="flex items-center bg-white dark:bg-[#18181C] border dark:border-[#27272A] rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-[#5564ff] text-white'
                    : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#27272A]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md transition-all ${
                  billingPeriod === 'yearly'
                    ? 'bg-[#5564ff] text-white' 
                    : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#27272A]'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          {billingPeriod === 'yearly' && (
            <div className="text-sm text-green-600 font-medium mb-6">
              Save up to 20% with annual billing
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap gap-3 md:gap-4 lg:gap-5 mx-auto justify-center">
          {/* Plan Basic */}
          <div className="w-full sm:w-[45%] md:w-[30%] lg:w-[28%] border dark:border-[#27272A] rounded-xl bg-white dark:bg-[#0a0a0c] shadow-sm hover:shadow-md transition-all overflow-hidden flex-shrink-0 flex-grow mb-4 sm:mb-4 md:mb-0">
            <div className="h-full flex flex-col">
              <div className="p-4 xs:p-5 sm:p-6 pb-3 xs:pb-3 sm:pb-4">
                <h2 className="text-lg sm:text-xl font-bold mb-1 dark:text-white">Starter</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">For individual creators</p>
                
                <div className="flex items-baseline mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-3xl font-bold dark:text-white">${billingPeriod === 'monthly' ? basicMonthlyPrice : Math.round(basicYearlyPrice / 12)}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1 text-xs sm:text-sm">/mo</span>
                </div>
                
                <Button 
                  onClick={() => router.push("/create")}
                  className={`w-full py-3 sm:py-4 md:py-5 text-sm sm:text-base ${
                    isBasicPlan 
                      ? "bg-gradient-to-r from-[#f8d4eb] via-[#ce7acb] to-[#e9bcba] text-[#0a0a0c]" 
                      : "bg-black dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                  } text-[#0a0a0c] rounded-xl`}
                  disabled={isBasicPlan}
                >
                  {isBasicPlan ? "Current Plan" : "Buy Now"}
                </Button>
              </div>
              
              <div className="p-4 xs:p-5 sm:p-6 pt-2 xs:pt-2 sm:pt-3 border-t dark:border-[#27272A] mt-1 sm:mt-2">
                <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-1 mb-3 sm:mb-4">
                  <span className="font-medium">${billingPeriod === 'monthly' ? basicMonthlyPrice : Math.round(basicYearlyPrice / 12)} billed {billingPeriod === 'monthly' ? 'monthly' : 'annually'}</span>
                  <InfoIcon className="h-3.5 w-3.5" />
                </div>
                
                <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">500 videos per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">Access to 1 template</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">Basic hook </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">All video formats in 9:16 ratio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">Powerful preview</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Plan Professional */}
          <div className="w-full sm:w-full md:w-[40%] lg:w-[44%] bg-gradient-to-r from-[#f8d4eb] via-[#ce7acb] to-[#e9bcba] p-[3px] rounded-xl shadow-md hover:shadow-lg transition-all relative flex-shrink-0 flex-grow order-first sm:order-none sm:mx-auto md:mx-0 md:-mt-4 z-10">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#f8d4eb] via-[#ce7acb] to-[#e9bcba] text-[#0a0a0c] px-3 py-0.5 rounded-full text-xs font-medium">
              Most Popular
            </div>
            <div className="h-full rounded-lg flex flex-col bg-gradient-to-b from-black via-[#191919] to-[#201a1e]">
              <div className="p-4 xs:p-5 sm:p-6 pb-3 xs:pb-3 sm:pb-4">
                <h2 className="text-lg sm:text-xl font-bold mb-1 dark:text-white">Pro</h2>
                <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">For professional creators, marketers, & teams</p>
                
                <div className="flex items-baseline mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-3xl font-bold text-white">${billingPeriod === 'monthly' ? proMonthlyPrice : Math.round(proYearlyPrice / 12)}</span>
                  <span className="text-gray-400 ml-1 text-xs sm:text-sm">/mo</span>
                </div>
                
                <Button 
                  onClick={() => router.push("/create")}
                  className={`w-full py-3 sm:py-4 md:py-5 text-sm sm:text-base ${
                    isProfessionalPlan 
                      ? "bg-gradient-to-r from-[#f8d4eb] via-[#ce7acb] to-[#e9bcba] text-[#0a0a0c]" 
                      : "bg-[#5564ff] hover:bg-[#5564ff]/90"
                  } text-white rounded-xl`}
                  disabled={isProfessionalPlan}
                >
                  {isProfessionalPlan ? "Current Plan" : "Buy Now"}
                </Button>
              </div>
              
              <div className="p-4 xs:p-5 sm:p-6 pt-2 xs:pt-2 sm:pt-3 border-t border-[#222222] mt-1 sm:mt-2">
                <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-1 mb-3 sm:mb-4">
                  <span className="font-medium text-white">${billingPeriod === 'monthly' ? proMonthlyPrice : Math.round(proYearlyPrice / 12)} billed {billingPeriod === 'monthly' ? 'monthly' : 'annually'}</span>
                  <InfoIcon className="h-3.5 w-3.5 text-white" />
                </div>
                
                <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="text-white">2,000 videos per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="text-white">Access to 3 templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="text-white">Generate unlimited viral hooks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="text-white">Basic + TikTok Hook</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="text-white">All video formats (9:16, 1:1, 16:9)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="text-white">Powerful preview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="text-white">Add your own music</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Plan Business */}
          <div className="w-full sm:w-[45%] md:w-[30%] lg:w-[28%] border dark:border-[#27272A] rounded-xl bg-white dark:bg-[#0a0a0c] shadow-sm hover:shadow-md transition-all overflow-hidden flex-shrink-0 flex-grow mb-4 sm:mb-4 md:mb-0">
            <div className="h-full flex flex-col">
              <div className="p-4 xs:p-5 sm:p-6 pb-3 xs:pb-3 sm:pb-4">
                <h2 className="text-xl font-bold mb-1 dark:text-white">Business</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">For bulk content creations</p>
                
                <div className="flex items-baseline mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-3xl font-bold dark:text-white">${billingPeriod === 'monthly' ? businessMonthlyPrice : Math.round(businessYearlyPrice / 12)}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1 text-xs sm:text-sm">/mo</span>
                </div>
                
                <Button 
                  onClick={() => router.push("/create")}
                  className={`w-full py-3 sm:py-4 md:py-5 text-sm sm:text-base ${
                    isBusinessPlan 
                      ? "bg-gradient-to-r from-[#f8d4eb] via-[#ce7acb] to-[#e9bcba] text-[#0a0a0c]" 
                      : "bg-black dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                  } text-white rounded-xl`}
                  disabled={isBusinessPlan}
                >
                  {isBusinessPlan ? "Current Plan" : "Buy Now"}
                </Button>
              </div>
              
              <div className="p-4 xs:p-5 sm:p-6 pt-2 xs:pt-2 sm:pt-3 border-t dark:border-[#27272A] mt-1 sm:mt-2">
                <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-1 mb-3 sm:mb-4">
                  <span className="font-medium">${billingPeriod === 'monthly' ? businessMonthlyPrice : Math.round(businessYearlyPrice / 12)} billed {billingPeriod === 'monthly' ? 'monthly' : 'annually'}</span>
                  <InfoIcon className="h-3.5 w-3.5" />
                </div>
                <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">10,000 videos per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">Access to 3 templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">Generate unlimited viral hooks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">Basic + TikTok Hook</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">All video formats (9:16, 1:1, 16:9)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">Powerful preview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-[#5564ff] flex-shrink-0 mt-0.5" />
                    <span className="dark:text-white">Add your own music</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 