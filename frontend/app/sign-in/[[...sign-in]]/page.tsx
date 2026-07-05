import { SignIn } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/Navbar";
import { routes } from "@/constants";
import { layout } from "@/constants/styles";

export default function SignInPage() {
  return (
    <>
      <Navbar />
      <main className={`${layout.pageCentered} pt-32`}>
        <SignIn
          forceRedirectUrl={routes.dashboard}
          fallbackRedirectUrl={routes.dashboard}
          signUpUrl={routes.signUp}
        />
      </main>
    </>
  );
}
