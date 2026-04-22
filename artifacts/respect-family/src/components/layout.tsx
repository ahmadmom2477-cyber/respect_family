import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useGetMe } from "@workspace/api-client-react";
import { useClerk, Show, SignInButton, SignUpButton, useUser } from "@clerk/react";
import {
  LogOut,
  User as UserIcon,
  Menu,
  Heart,
  LayoutDashboard,
  Tv,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/language-switcher";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: me } = useGetMe();
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={user.imageUrl} alt={user.fullName || ""} />
            <AvatarFallback>{user.firstName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/favorites" className="cursor-pointer flex items-center w-full">
            <Heart className="me-2 h-4 w-4" />
            <span>
              {t("nav.favorites")} ({me?.favoriteCount || 0})
            </span>
          </Link>
        </DropdownMenuItem>
        {me?.isAdmin && (
          <DropdownMenuItem asChild>
            <Link
              href="/admin"
              className="cursor-pointer flex items-center w-full text-primary"
            >
              <LayoutDashboard className="me-2 h-4 w-4" />
              <span>{t("nav.admin")}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="me-2 h-4 w-4" />
          <span>{t("nav.signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLinks({
  className,
  onItemClick,
}: {
  className?: string;
  onItemClick?: () => void;
}) {
  const [location] = useLocation();
  const { data: me } = useGetMe();
  const { t } = useTranslation();

  const links = [
    { href: "/", label: t("nav.streamers"), icon: Tv },
    { href: "/submit", label: t("nav.submit"), icon: Plus },
  ];

  if (me?.signedIn) {
    links.push({ href: "/favorites", label: t("nav.favorites"), icon: Heart });
  }
  if (me?.isAdmin) {
    links.push({ href: "/admin", label: t("nav.admin"), icon: LayoutDashboard });
  }

  return (
    <nav className={className}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onItemClick}
          className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
            location === link.href ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <link.icon className="me-2 h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex flex-col" dir={i18n.dir()}>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8 mx-auto">
          <div className="flex items-center gap-6 md:gap-10">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={i18n.dir() === "rtl" ? "right" : "left"} className="w-64 sm:w-80">
                <Link href="/" className="flex items-center gap-2 mb-8 mt-4">
                  <img
                    src={`${basePath}/respect-logo.jpg`}
                    alt="Respect Family"
                    className="h-8 w-8 rounded object-cover"
                  />
                  <span className="font-bold text-xl gradient-text">{t("brand")}</span>
                </Link>
                <NavLinks className="flex flex-col gap-4" />
              </SheetContent>
            </Sheet>

            <Link href="/" className="hidden md:flex items-center gap-2">
              <img
                src={`${basePath}/respect-logo.jpg`}
                alt="Respect Family"
                className="h-8 w-8 rounded object-cover"
              />
              <span className="font-bold text-xl gradient-text tracking-tight">
                {t("brand")}
              </span>
            </Link>

            <NavLinks className="hidden md:flex gap-6" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost">{t("nav.signIn")}</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                  {t("nav.signUp")}
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserMenu />
            </Show>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="border-t border-border/40 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 sm:px-8 mx-auto">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            <span className="font-medium text-primary">{t("brand")}</span>
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a
              href="https://kick.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Kick.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
