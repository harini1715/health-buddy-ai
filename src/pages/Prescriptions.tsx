import { motion } from "framer-motion";
import { FileText, Calendar, Pill, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

export default function Prescriptions() {
  const { t } = useLanguage();
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const { data: rxData, error: rxError } = await supabase
        .from("prescriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (rxError) throw rxError;

      const withMeds = await Promise.all(
        (rxData || []).map(async (rx) => {
          const { data: meds } = await supabase
            .from("medicines")
            .select("*")
            .eq("prescription_id", rx.id);
          return { ...rx, medicines: meds || [] };
        })
      );

      return withMeds;
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t("rx.title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("rx.subtitle")}
        </p>
      </motion.div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      )}

      {!isLoading && (!prescriptions || prescriptions.length === 0) && (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-display font-semibold text-foreground">{t("rx.noRx")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("rx.uploadToStart")}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {prescriptions?.map((rx, i) => (
          <motion.div
            key={rx.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-display">
                        {rx.doctor_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {rx.hospital_name}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {rx.id.slice(0, 8)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {rx.summary && (
                  <p className="text-sm text-muted-foreground mb-3 p-3 rounded-lg bg-accent/30">
                    {rx.summary}
                  </p>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {rx.date}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Pill className="h-3.5 w-3.5" />
                    {rx.medicines.length} {t("dash.medicines")}
                  </div>
                </div>

                <div className="space-y-2">
                  {rx.medicines.map((med) => (
                    <div
                      key={med.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {med.medicine_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {med.dosage} · {med.food_instruction}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0 self-start sm:self-auto">
                        {med.timing}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
