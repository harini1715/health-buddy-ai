import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileImage, Loader2, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import ManualPrescriptionForm from "@/components/ManualPrescriptionForm";

interface PrescriptionResult {
  date: string;
  hospitalName: string;
  doctorName: string;
  summary?: string;
  medicines: {
    name: string;
    dosage: string;
    timing: string;
    food: string;
    duration?: string;
  }[];
}

export default function UploadPrescription() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"credit" | "rateLimit" | "generic" | null>(null);
  const [saved, setSaved] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setProcessing(true);
    setError(null);
    setErrorType(null);
    setSaved(false);
    setShowManualForm(false);

    try {
      const imageBase64 = await fileToBase64(f);

      const { data, error: fnError } = await supabase.functions.invoke(
        "analyze-prescription",
        {
          body: { imageBase64, mimeType: f.type },
        }
      );

      if (fnError) {
        throw new Error(fnError.message || "Failed to analyze prescription");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data as PrescriptionResult);
      toast.success("Prescription analyzed successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process prescription";
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t("upload.title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("upload.subtitle")}
        </p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardContent className="p-0">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors m-6"
            >
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-4">
                <Upload className="h-7 w-7 text-primary-foreground" />
              </div>
              <p className="font-display font-semibold text-foreground">
                {t("upload.drop")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("upload.browse")}
              </p>
              {file && (
                <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-accent">
                  <FileImage className="h-4 w-4 text-accent-foreground" />
                  <span className="text-sm text-accent-foreground font-medium">
                    {file.name}
                  </span>
                </div>
              )}
            </label>
          </CardContent>
        </Card>
      </motion.div>

      {/* Processing State */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center py-12">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="font-display font-semibold mt-4 text-foreground">
                  {t("upload.analyzing")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("upload.extracting")}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && !processing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="shadow-card border-destructive/30">
              <CardContent className="flex items-center gap-3 py-6">
                <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{t("upload.failed")}</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !processing && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="shadow-card border-primary/20">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">
                    {t("upload.complete")}
                  </CardTitle>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span className="text-xs text-success">
                      {t("upload.poweredBy")}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                {result.summary && (
                  <div className="p-4 rounded-xl gradient-accent">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                      {t("upload.aiSummary")}
                    </p>
                    <p className="text-sm text-foreground">{result.summary}</p>
                  </div>
                )}

                {/* Prescription Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {t("upload.date")}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {result.date}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {t("upload.hospital")}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {result.hospitalName}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {t("upload.doctor")}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {result.doctorName}
                    </p>
                  </div>
                </div>

                {/* Medicines */}
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-3">
                    {t("upload.extractedMeds")} ({result.medicines.length})
                  </h3>
                  <div className="space-y-2">
                    {result.medicines.map((med, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl border hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {med.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {med.dosage}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {med.timing}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {med.food}
                          </Badge>
                          {med.duration && (
                            <Badge className="text-[10px] bg-info text-info-foreground">
                              {med.duration}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={saving || saved}
                  onClick={async () => {
                    if (!result) return;
                    setSaving(true);
                    try {
                      // Insert prescription
                      const { data: rxData, error: rxError } = await supabase
                        .from("prescriptions")
                        .insert({
                          doctor_name: result.doctorName,
                          hospital_name: result.hospitalName,
                          date: result.date,
                          summary: result.summary || null,
                        })
                        .select("id")
                        .single();

                      if (rxError) throw rxError;

                      // Insert medicines
                      const medsToInsert = result.medicines.map((med) => ({
                        prescription_id: rxData.id,
                        medicine_name: med.name,
                        dosage: med.dosage,
                        timing: med.timing,
                        food_instruction: med.food,
                      }));

                      const { error: medError } = await supabase
                        .from("medicines")
                        .insert(medsToInsert);

                      if (medError) throw medError;

                      setSaved(true);
                      toast.success("Prescription saved successfully!");
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Failed to save";
                      toast.error(msg);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saved ? t("upload.saved") : saving ? t("upload.saving") : t("upload.save")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
