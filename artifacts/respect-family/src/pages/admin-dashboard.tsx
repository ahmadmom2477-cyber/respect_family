import { useState } from "react";
import { 
  useGetMe, 
  useListChannelRequests, 
  useUpdateChannelRequest, 
  useListStreamers, 
  useCreateStreamer, 
  useDeleteStreamer, 
  useGetStats,
  useListAdminEmails,
  useAddAdminEmail,
  useRemoveAdminEmail,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  getListChannelRequestsQueryKey, 
  getListStreamersQueryKey,
  getGetStatsQueryKey,
  getListAdminEmailsQueryKey,
} from "@workspace/api-client-react";
import { 
  ShieldAlert, 
  Check, 
  X, 
  Trash2, 
  Plus, 
  LayoutDashboard, 
  Tv, 
  Users, 
  Activity, 
  Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: me } = useGetMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [addChannelUsername, setAddChannelUsername] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const { data: stats } = useGetStats();
  const { data: pendingRequests } = useListChannelRequests({ status: "pending" });
  const { data: allRequests } = useListChannelRequests();
  const { data: streamers } = useListStreamers();
  const { data: adminEmails } = useListAdminEmails({ query: { enabled: !!me?.isAdmin } });

  const updateReq = useUpdateChannelRequest();
  const createStreamer = useCreateStreamer();
  const deleteStreamer = useDeleteStreamer();
  const addAdmin = useAddAdminEmail();
  const removeAdmin = useRemoveAdminEmail();

  const handleAddAdmin = () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    addAdmin.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          setNewAdminEmail("");
          queryClient.invalidateQueries({ queryKey: getListAdminEmailsQueryKey() });
          toast({ title: t("admin.toast.added") });
        },
        onError: () => toast({ title: t("admin.toast.error"), variant: "destructive" }),
      },
    );
  };

  const handleRemoveAdmin = (email: string) => {
    if (!confirm(t("admin.admins.confirmRemove"))) return;
    removeAdmin.mutate(
      { email },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminEmailsQueryKey() });
          toast({ title: t("admin.toast.removed") });
        },
        onError: () => toast({ title: t("admin.toast.error"), variant: "destructive" }),
      },
    );
  };

  if (!me?.isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[70vh] bg-background">
        <ShieldAlert className="h-20 w-20 text-destructive mb-6" />
        <h2 className="text-3xl font-bold mb-3">{t("admin.notAdminTitle")}</h2>
        <p className="text-muted-foreground text-lg max-w-md">
          {t("admin.notAdminDesc")}
        </p>
      </div>
    );
  }

  const handleUpdateStatus = (id: number, status: "approved" | "rejected") => {
    updateReq.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListChannelRequestsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStreamersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
          toast({ title: status === 'approved' ? t("admin.toast.approved") : t("admin.toast.rejected") });
        },
        onError: () => {
          toast({ title: t("admin.toast.error"), variant: "destructive" });
        }
      }
    );
  };

  const handleAddChannel = () => {
    if (!addChannelUsername) return;
    createStreamer.mutate(
      { data: { username: addChannelUsername } },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          setAddChannelUsername("");
          queryClient.invalidateQueries({ queryKey: getListStreamersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
          toast({ title: t("admin.toast.added") });
        },
        onError: (error: any) => {
          toast({ title: t("admin.toast.error"), description: error.message, variant: "destructive" });
        }
      }
    );
  };

  const handleDeleteChannel = (username: string) => {
    if (!confirm(t("admin.channels.confirmRemoveDesc"))) return;
    
    deleteStreamer.mutate(
      { username },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListStreamersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
          toast({ title: t("admin.toast.removed") });
        },
        onError: () => {
          toast({ title: t("admin.toast.error"), variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="border-b border-border/40 bg-card/40">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.title")}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.stats.totalChannels")}</CardTitle>
              <Tv className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalChannels || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.stats.liveNow")}</CardTitle>
              <Activity className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats?.liveNow || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.stats.totalViewers")}</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalViewers?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("admin.stats.pendingRequests")}</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{stats?.pendingRequests || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/50 p-1">
            <TabsTrigger value="pending" className="data-[state=active]:bg-card">
              {t("admin.tabs.pending")}
              {stats?.pendingRequests ? (
                <Badge variant="secondary" className="ms-2 bg-orange-500/20 text-orange-500">{stats.pendingRequests}</Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="channels" className="data-[state=active]:bg-card">{t("admin.tabs.channels")}</TabsTrigger>
            <TabsTrigger value="all-requests" className="data-[state=active]:bg-card">{t("admin.tabs.all")}</TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-card">{t("admin.tabs.admins")}</TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="pending" className="m-0">
            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle>{t("admin.tabs.pending")}</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests?.length ? (
                  <div className="rounded-md border border-border/40">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("admin.request.username")}</TableHead>
                          <TableHead>{t("admin.request.submitter")}</TableHead>
                          <TableHead>{t("admin.request.note")}</TableHead>
                          <TableHead>{t("admin.request.submittedAt")}</TableHead>
                          <TableHead className="text-end">{t("admin.request.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingRequests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.username}</TableCell>
                            <TableCell>
                              {req.submitterName || "Anonymous"}
                              {req.submitterEmail && <span className="block text-xs text-muted-foreground">{req.submitterEmail}</span>}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={req.note || ""}>
                              {req.note || "-"}
                            </TableCell>
                            <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-end space-x-2 space-x-reverse">
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleUpdateStatus(req.id, "rejected")}>
                                <X className="h-4 w-4 me-1" /> {t("admin.request.reject")}
                              </Button>
                              <Button size="sm" className="bg-[#00E701]/20 text-[#00E701] hover:bg-[#00E701]/30 border border-[#00E701]/30" onClick={() => handleUpdateStatus(req.id, "approved")}>
                                <Check className="h-4 w-4 me-1" /> {t("admin.request.approve")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>{t("admin.request.empty")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Channels Tab */}
          <TabsContent value="channels" className="m-0">
            <Card className="border-border/40 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("admin.tabs.channels")}</CardTitle>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 me-2" /> {t("admin.channels.addNew")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] border-border/50">
                    <DialogHeader>
                      <DialogTitle>{t("admin.channels.addNew")}</DialogTitle>
                      <DialogDescription>
                        {t("admin.channels.addPlaceholder")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Input
                          id="username"
                          placeholder={t("admin.channels.addPlaceholder")}
                          value={addChannelUsername}
                          onChange={(e) => setAddChannelUsername(e.target.value)}
                          className="col-span-3 bg-input/50"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddChannel} disabled={createStreamer.isPending || !addChannelUsername}>
                        {createStreamer.isPending ? t("common.loading") : t("admin.channels.add")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border/40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.channels.username")}</TableHead>
                        <TableHead>{t("admin.channels.followers")}</TableHead>
                        <TableHead>{t("admin.channels.status")}</TableHead>
                        <TableHead>{t("admin.request.submittedAt")}</TableHead>
                        <TableHead className="text-end">{t("admin.channels.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {streamers?.map((streamer) => (
                        <TableRow key={streamer.id}>
                          <TableCell className="font-bold flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md bg-muted overflow-hidden">
                              {streamer.profilePictureUrl ? (
                                <img src={streamer.profilePictureUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/20 text-primary font-bold">
                                  {streamer.displayName.charAt(0)}
                                </div>
                              )}
                            </div>
                            {streamer.displayName}
                          </TableCell>
                          <TableCell>{streamer.followers.toLocaleString()}</TableCell>
                          <TableCell>
                            {streamer.isLive ? (
                              <Badge variant="destructive" className="bg-destructive/20 text-destructive border-none">{t("card.live")}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground border-border/50">{t("card.offline")}</Badge>
                            )}
                          </TableCell>
                          <TableCell>{new Date(streamer.addedAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-end">
                            <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteChannel(streamer.username)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Emails Tab */}
          <TabsContent value="admins" className="m-0">
            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle>{t("admin.admins.title")}</CardTitle>
                <p className="text-sm text-muted-foreground">{t("admin.admins.desc")}</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                  <Input
                    type="email"
                    placeholder={t("admin.admins.addPlaceholder")}
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="bg-input/50"
                  />
                  <Button onClick={handleAddAdmin} disabled={!newAdminEmail || addAdmin.isPending} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 me-2" />
                    {t("admin.admins.add")}
                  </Button>
                </div>
                <div className="rounded-md border border-border/40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.admins.email")}</TableHead>
                        <TableHead>{t("admin.admins.addedAt")}</TableHead>
                        <TableHead>{t("admin.admins.addedBy")}</TableHead>
                        <TableHead className="text-end">{t("admin.admins.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminEmails?.map((row) => {
                        const isPrimary = row.email.toLowerCase() === "3x51hb@gmail.com";
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">
                              {row.email}
                              {isPrimary && (
                                <Badge variant="default" className="ms-2 bg-primary/20 text-primary">
                                  {t("admin.admins.primary")}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{new Date(row.addedAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{row.addedBy || "-"}</TableCell>
                            <TableCell className="text-end">
                              {!isPrimary && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => handleRemoveAdmin(row.email)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Requests History Tab */}
          <TabsContent value="all-requests" className="m-0">
            <Card className="border-border/40 bg-card/50">
              <CardHeader>
                <CardTitle>{t("admin.tabs.all")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border/40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.request.username")}</TableHead>
                        <TableHead>{t("admin.request.submitter")}</TableHead>
                        <TableHead>{t("admin.request.status")}</TableHead>
                        <TableHead>{t("admin.request.submittedAt")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRequests?.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.username}</TableCell>
                          <TableCell>{req.submitterName || "Anonymous"}</TableCell>
                          <TableCell>
                            <Badge variant={
                              req.status === 'approved' ? 'default' : 
                              req.status === 'rejected' ? 'destructive' : 'secondary'
                            } className={req.status === 'approved' ? 'bg-[#00E701]/20 text-[#00E701]' : ''}>
                              {req.status === 'approved' ? t("admin.request.approved") : req.status === 'rejected' ? t("admin.request.rejected") : t("admin.request.pending")}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
