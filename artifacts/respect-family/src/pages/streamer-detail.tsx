import { useParams } from "wouter";
import { useGetStreamer, useListStreamers, useGetMe, useListFavorites, useAddFavorite, useRemoveFavorite } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListFavoritesQueryKey, getGetMeQueryKey, getListStreamersQueryKey, getGetStreamerQueryKey } from "@workspace/api-client-react";
import { StreamerCard } from "@/components/streamer-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Heart, Users, Video, Tv, Info, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Show } from "@clerk/react";
import { useTranslation } from "react-i18next";

export default function StreamerDetail() {
  const { t } = useTranslation();
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: streamer, isLoading: isStreamerLoading } = useGetStreamer(username || "", {
    query: { enabled: !!username, queryKey: getGetStreamerQueryKey(username || "") }
  });
  
  const { data: me } = useGetMe();
  const { data: favorites } = useListFavorites();
  const { data: allStreamers, isLoading: isStreamersLoading } = useListStreamers();

  const addFav = useAddFavorite();
  const rmFav = useRemoveFavorite();

  const favoriteUsernames = new Set(Array.isArray(favorites) ? favorites.map(f => f.username) : []);
  const isFavorite = favoriteUsernames.has(username || "");

  const handleFavorite = () => {
    if (!username) return;

    if (isFavorite) {
      rmFav.mutate(
        { username },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetStreamerQueryKey(username) });
            toast({ title: t("card.removeFromFavorites") });
          }
        }
      );
    } else {
      addFav.mutate(
        { data: { username } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetStreamerQueryKey(username) });
            toast({ title: t("card.addToFavorites") });
          },
          onError: (err: any) => {
            if (err.status === 401) {
              toast({ title: t("favorites.signInRequired"), description: t("favorites.signInRequiredDesc"), variant: "destructive" });
            } else if (err.status === 400) {
               toast({ title: "Limit reached", description: "You can only have 50 favorites.", variant: "destructive" });
            }
          }
        }
      );
    }
  };

  if (isStreamerLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-[300px] w-full rounded-2xl mb-8" />
        <div className="flex gap-8">
          <Skeleton className="h-32 w-32 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-10 w-1/3 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-8" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!streamer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
        <Tv className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">{t("detail.notFound")}</h2>
        <p className="text-muted-foreground max-w-md">
          {t("detail.notFound")}
        </p>
      </div>
    );
  }

  const relatedStreamers = allStreamers?.filter(s => s.username !== username).slice(0, 4) || [];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Banner */}
      <div className="relative h-64 md:h-80 lg:h-[400px] w-full bg-muted/30">
        {streamer.bannerUrl ? (
          <img src={streamer.bannerUrl} alt={`${streamer.displayName} banner`} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 via-secondary to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Profile Info overlaid on banner */}
        <div className="absolute bottom-0 start-0 end-0 container mx-auto px-4 translate-y-1/3 md:translate-y-1/4">
          <div className="flex flex-col md:flex-row items-end md:items-end gap-6">
            <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-2xl border-4 border-background overflow-hidden bg-card shadow-2xl flex-shrink-0">
              {streamer.profilePictureUrl ? (
                <img src={streamer.profilePictureUrl} alt={streamer.displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                  {streamer.displayName.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 md:pb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">{streamer.displayName}</h1>
                  {streamer.promoted && (
                    <Badge variant="default" className="bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                      PROMOTED
                    </Badge>
                  )}
                </div>
                {streamer.category && (
                  <p className="text-primary font-medium text-lg drop-shadow-md">{streamer.category}</p>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Show when="signed-in">
                  <Button 
                    variant={isFavorite ? "outline" : "default"}
                    className={`h-12 px-6 shadow-lg ${!isFavorite ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-primary/50 hover:bg-primary/10'}`}
                    onClick={handleFavorite}
                    disabled={addFav.isPending || rmFav.isPending}
                  >
                    <Heart className={`me-2 h-5 w-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
                    {isFavorite ? t("card.removeFromFavorites") : t("card.addToFavorites")}
                  </Button>
                </Show>
                <Button asChild size="lg" className="h-12 px-8 bg-[#00E701] hover:bg-[#00C701] text-black font-bold shadow-[0_0_15px_rgba(0,231,1,0.3)]">
                  <a href={streamer.channelUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="me-2 h-5 w-5 rtl:scale-x-[-1]" />
                    {t("card.watchOnKick")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 mt-24 md:mt-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Live Status & About */}
          <div className="lg:col-span-2 space-y-8">
            {streamer.isLive ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                  </span>
                  <h2 className="text-xl font-bold text-destructive flex items-center gap-2">
                    {t("card.live")}
                    <Badge variant="outline" className="text-foreground border-destructive/50 ms-2">
                      <Users className="me-1 h-3 w-3" />
                      {streamer.viewers.toLocaleString()}
                    </Badge>
                  </h2>
                </div>
                <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                  <h3 className="text-lg font-medium text-foreground">{streamer.streamTitle || "Untitled Stream"}</h3>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/50 bg-card p-6 flex items-center gap-4 text-muted-foreground">
                <Video className="h-8 w-8 opacity-50" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{t("detail.currentlyOffline")}</h2>
                  <p>{t("detail.offlineDesc")}</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border/40 bg-card p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Info className="h-6 w-6 text-primary" />
                {t("detail.bio")}
              </h2>
              <div className="prose prose-invert max-w-none">
                {streamer.bio ? (
                  <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">{streamer.bio}</p>
                ) : (
                  <p className="text-lg text-muted-foreground italic">{t("detail.bio")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/40 bg-card p-6">
              <h3 className="font-semibold text-lg mb-4 text-muted-foreground uppercase tracking-wider text-xs">{t("detail.channelStats")}</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 text-muted-foreground mb-1">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium">{t("detail.followers")}</span>
                  </div>
                  <p className="text-3xl font-bold">{streamer.followers.toLocaleString()}</p>
                </div>
                <div className="h-px bg-border/50" />
                <div>
                  <div className="flex items-center gap-3 text-muted-foreground mb-1">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="font-medium">{t("detail.category")}</span>
                  </div>
                  <p className="text-xl font-medium">
                    {streamer.category || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Grid */}
        {relatedStreamers.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{t("detail.moreFromFamily")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedStreamers.map((s) => (
                <StreamerCard 
                  key={s.id} 
                  streamer={s} 
                  isFavorite={favoriteUsernames.has(s.username)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
