import { onboarding } from "@/constants";

export function OnboardingLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F5F5F5] px-6">
      <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-border border-t-teal" />
      <p className="text-sm text-muted">{onboarding.loading}</p>
    </div>
  );
}
