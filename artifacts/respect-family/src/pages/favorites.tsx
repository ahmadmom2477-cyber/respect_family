import { useListFavorites, useListStreamers } from "@workspace/api-client-react";
import { StreamerCard } from "@/components/streamer-card";
import { Heart, Tv } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function Favorites() {
  const { t } = useTranslation();
  const { data: favorites, isLoading: isFavLoading } = useListFavorites();
  const { data: streamers, isLoading: isStreamersLoading } = useListStreamers();

  const isLoading = isFavLoading || isStreamersLoading;

  const favoriteUsernames = new Set(Array.isArray(favorites) ? favorites.map(f => f.username) : []);
  
  // Filter the full streamer list to only those that are favorited
  // We use the full streamer data to display the cards properly
  const favoritedStreamers = streamers?.filter(s => favoriteUsernames.has(s.username)) || [];

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <section className="bg-card/50 border-b border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Heart className="h-6 w-6 fill-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{t("favorites.title")}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {t("favorites.subtitle")}
          </p>
        </div>
      </section>

      <section className="py-12 flex-1 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
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
          ) : favoritedStreamers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoritedStreamers.map((streamer) => (
                <StreamerCard 
                  key={streamer.id} 
                  streamer={streamer} 
                  isFavorite={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card/30 rounded-3xl border border-border/50 max-w-3xl mx-auto backdrop-blur-sm">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-6 opacity-30" />
              <h3 className="text-2xl font-bold mb-3">{t("favorites.empty")}</h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                {t("favorites.emptyDesc")}
              </p>
              <Button asChild size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90">
                <Link href="/">
                  {t("common.backHome")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
