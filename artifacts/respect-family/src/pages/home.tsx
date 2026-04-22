import { useState } from "react";
import { useListStreamers, useGetStats, useListFavorites, useGetMe } from "@workspace/api-client-react";
import { StreamerCard } from "@/components/streamer-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Activity, Users, Tv } from "lucide-react";
import { Link } from "wouter";
import { Show, useUser } from "@clerk/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { user } = useUser();

  const { data: stats } = useGetStats({ query: { refetchInterval: 5 * 60 * 1000 } });
  const { data: streamers, isLoading } = useListStreamers({ search }, { query: { refetchInterval: 5 * 60 * 1000 } });
  const { data: favorites } = useListFavorites();
  const { data: me } = useGetMe();

  const displayName = user?.firstName || user?.username || me?.email || "";

  const favoriteUsernames = new Set(Array.isArray(favorites) ? favorites.map(f => f.username) : []);

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0" />
        <div className="absolute top-0 start-0 end-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50 z-0" />
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <Badge text={t("home.badge")} />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 drop-shadow-sm">
            {t("home.heroLine1")} <br/>
            <span className="gradient-text">{t("home.heroLine2")}</span>
          </h1>
          {displayName && (
            <p className="text-2xl md:text-3xl font-bold text-primary mb-10">
              {t("home.welcomeUser", { name: displayName })}
            </p>
          )}
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(168,85,247,0.4)]" asChild>
              <a href="#directory">{t("home.browseStreamers")}</a>
            </Button>
            <Show when="signed-out">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-primary/30 hover:bg-primary/10" asChild>
                <Link href="/submit">{t("home.submitChannel")}</Link>
              </Button>
            </Show>
            <Show when="signed-in">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-primary/30 hover:bg-primary/10" asChild>
                <Link href="/favorites">{t("nav.favorites")}</Link>
              </Button>
            </Show>
          </div>
        </div>

        {/* Stats Strip */}
        {stats && typeof stats.totalChannels === "number" && (
          <div className="absolute bottom-0 start-0 end-0 bg-card/50 backdrop-blur-md border-t border-border/50 py-4">
            <div className="container mx-auto px-4 flex flex-wrap justify-center md:justify-between items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Tv className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{stats.totalChannels}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("home.channels")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none text-destructive">{stats.liveNow}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("home.liveNow")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{(stats.totalViewers ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("home.totalViewers")}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Content */}
      <section id="directory" className="py-20 bg-background flex-1">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">{t("home.allStreamers")}</h2>
              <p className="text-muted-foreground">{t("home.heroSubtitle")}</p>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder={t("home.searchPlaceholder")}
                className="ps-10 h-12 bg-card border-border/50 focus-visible:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/40 overflow-hidden bg-card">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : Array.isArray(streamers) && streamers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {streamers.map((streamer) => (
                <StreamerCard 
                  key={streamer.id} 
                  streamer={streamer} 
                  isFavorite={favoriteUsernames.has(streamer.username)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/30 rounded-2xl border border-border/50 backdrop-blur-sm">
              <Tv className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">{t("home.noStreamers")}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {search ? t("home.noStreamers") : t("home.noStreamersDesc")}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium backdrop-blur-sm">
      <span className="relative flex h-2 w-2 me-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      {text}
    </div>
  )
}
