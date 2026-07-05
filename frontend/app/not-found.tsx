import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { notFound as notFoundCopy, routes } from "@/constants";
import { buttons } from "@/constants/styles";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-sm text-teal">{notFoundCopy.code}</p>
        <h1 className="mt-2 text-4xl font-bold">{notFoundCopy.title}</h1>
        <p className="mt-3 max-w-md text-muted">{notFoundCopy.description}</p>
        <Link href={routes.home} className={`mt-8 ${buttons.base} ${buttons.primary} px-6 py-3`}>
          {notFoundCopy.cta}
        </Link>
      </main>
    </>
  );
}
