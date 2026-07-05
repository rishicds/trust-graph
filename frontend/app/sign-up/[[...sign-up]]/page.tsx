import { SignUp } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/Navbar";
import { routes } from "@/constants";
import { layout } from "@/constants/styles";

export default function SignUpPage() {
  return (
    <>
      <Navbar />
      <main className={`${layout.pageCentered} pt-32`}>
        <SignUp
          forceRedirectUrl={routes.onboarding}
          fallbackRedirectUrl={routes.onboarding}
          signInUrl={routes.signIn}
        />
      </main>
    </>
  );
}
