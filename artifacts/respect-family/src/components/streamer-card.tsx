import { Link } from "wouter";
import { useAddFavorite, useRemoveFavorite, useGetMe, Streamer } from "@workspace/api-client-react";
import { Heart, Users, Video, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { getListFavoritesQueryKey, getGetMeQueryKey, getListStreamersQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Show } from "@clerk/react";
import { useTranslation } from "react-i18next";

export function StreamerCard({ streamer, isFavorite = false }: { streamer: Streamer, isFavorite?: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const addFav = useAddFavorite();
  const rmFav = useRemoveFavorite();
  const { data: me } = useGetMe();

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavorite) {
      rmFav.mutate(
        { username: streamer.username },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListStreamersQueryKey() });
            toast({ title: t("card.removeFromFavorites"), description: `${streamer.displayName} removed.` });
          }
        }
      );
    } else {
      addFav.mutate(
        { data: { username: streamer.username } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListStreamersQueryKey() });
            toast({ title: t("card.addToFavorites"), description: `${streamer.displayName} added.` });
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

  return (
    <Link href={`/streamers/${streamer.username}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:border-primary/50 cursor-pointer h-full flex flex-col bg-card/50 backdrop-blur-sm">
        <div className="relative aspect-video w-full overflow-hidden bg-muted/20">
          {streamer.bannerUrl ? (
            <img 
              src={streamer.bannerUrl} 
              alt={`${streamer.displayName} banner`} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
              <Video className="h-12 w-12 text-primary/40" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          
          <div className="absolute top-3 start-3 flex items-center gap-2">
            {streamer.isLive && (
              <Badge variant="destructive" className="animate-pulse-fast bg-destructive text-destructive-foreground font-bold px-2 py-0.5 shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                {t("card.live")}
              </Badge>
            )}
            {streamer.promoted && (
              <Badge variant="default" className="bg-primary/90 text-primary-foreground">
                PROMOTED
              </Badge>
            )}
          </div>
          
          <Show when="signed-in">
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-3 end-3 h-8 w-8 rounded-full bg-background/50 backdrop-blur-md hover:bg-background/80 ${isFavorite ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={handleFavorite}
              disabled={addFav.isPending || rmFav.isPending}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </Show>
          
          <div className="absolute bottom-3 start-3 flex items-end gap-3">
            <div className="h-12 w-12 rounded-lg border-2 border-background overflow-hidden bg-muted">
              {streamer.profilePictureUrl ? (
                <img src={streamer.profilePictureUrl} alt={streamer.displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                  {streamer.displayName.charAt(0)}
                </div>
              )}
            </div>
            <div className="mb-0.5">
              <h3 className="font-bold text-lg leading-none text-foreground drop-shadow-md">{streamer.displayName}</h3>
              {streamer.category && (
                <p className="text-xs text-primary font-medium mt-1">{streamer.category}</p>
              )}
            </div>
          </div>
        </div>
        
        <CardContent className="pt-4 pb-2 flex-grow">
          {streamer.isLive && streamer.streamTitle ? (
            <p className="text-sm font-medium line-clamp-2 text-foreground/90">{streamer.streamTitle}</p>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-2">{streamer.bio || t("detail.bio")}</p>
          )}
        </CardContent>
        
        <CardFooter className="pt-2 pb-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 mx-4 px-0">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium">{streamer.followers.toLocaleString()}</span>
          </div>
          {streamer.isLive && (
            <div className="flex items-center gap-1.5 text-destructive">
              <Video className="h-3.5 w-3.5" />
              <span className="font-medium">{streamer.viewers.toLocaleString()} {t("card.viewers")}</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
