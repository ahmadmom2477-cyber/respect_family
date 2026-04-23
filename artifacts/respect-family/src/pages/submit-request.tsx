import { useCreateChannelRequest } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
  username: z.string().min(2, "Kick username must be at least 2 characters").max(50),
  submitterName: z.string().max(100).optional(),
  submitterEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  note: z.string().max(500, "Note must be under 500 characters").optional(),
});

export default function SubmitRequest() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const createReq = useCreateChannelRequest();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      submitterName: "",
      submitterEmail: "",
      note: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createReq.mutate(
      {
        data: {
          username: values.username,
          submitterName: values.submitterName || undefined,
          submitterEmail: values.submitterEmail || undefined,
          note: values.note || undefined,
        }
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: (error: any) => {
          toast({
            title: t("submit.errorTitle"),
            description: error.message || "Please try again later.",
            variant: "destructive",
          });
        }
      }
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] items-center justify-center py-12 px-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
      
      <div className="relative z-10 w-full max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">{t("submit.title")}</h1>
          <p className="text-lg text-muted-foreground">
            {t("submit.subtitle")}
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-sm">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-20 w-20 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">{t("submit.successTitle")}</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                {t("submit.successDesc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/">{t("common.backHome")}</Link>
                </Button>
                <Button variant="outline" size="lg" onClick={() => { form.reset(); setSubmitted(false); }}>
                  {t("submit.submitAnother")}
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">{t("submit.usernameLabel")} <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder={t("submit.usernamePlaceholder")} className="h-12 bg-input/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="submitterName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t("submit.nameLabel")}</FormLabel>
                        <FormControl>
                          <Input placeholder="" className="h-12 bg-input/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="submitterEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">{t("submit.emailLabel")}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="" className="h-12 bg-input/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">{t("submit.noteLabel")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t("submit.notePlaceholder")} 
                          className="resize-none min-h-[120px] bg-input/50" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full h-14 text-lg bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(168,85,247,0.3)] mt-4" disabled={createReq.isPending}>
                  {createReq.isPending ? t("submit.submitting") : (
                    <>
                      <Send className="me-2 h-5 w-5 rtl:scale-x-[-1]" />
                      {t("submit.submitBtn")}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
