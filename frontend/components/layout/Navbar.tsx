import Link from "next/link";
import { AuthNav } from "@/components/layout/AuthNav";
import { AdminNavLink } from "@/components/layout/AdminNavLink";
import { brand, navigation, routes } from "@/constants";
import { nav as navStyles } from "@/constants/styles";

export function Navbar() {
  return (
    <header className={navStyles.header}>
      <nav className={navStyles.bar}>
        <Link href={routes.home} className="text-lg font-semibold tracking-tight">
          {brand.name}
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {navigation.links.map((link) => (
            <Link key={link.href} href={link.href} className={navStyles.link}>
              {link.label}
            </Link>
          ))}
          <AdminNavLink />
        </div>
        <AuthNav />
      </nav>
    </header>
  );
}
