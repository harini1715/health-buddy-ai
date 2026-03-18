import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Heart, UserCircle, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockPatient } from "@/data/mockData";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toPng } from "html-to-image";
import { toast } from "@/hooks/use-toast";

export default function PatientID() {
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["all-prescriptions-for-qr"],
    queryFn: async () => {
      const { data: rxData, error } = await supabase
        .from("prescriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const withMeds = await Promise.all(
        (rxData || []).map(async (rx) => {
          const { data: meds } = await supabase
            .from("medicines")
            .select("*")
            .eq("prescription_id", rx.id);
          return {
            doctor: rx.doctor_name,
            hospital: rx.hospital_name,
            date: rx.date,
            medicines: (meds || []).map((m) => ({
              name: m.medicine_name,
              dosage: m.dosage,
              timing: m.timing,
              food: m.food_instruction,
            })),
          };
        })
      );
      return withMeds;
    },
  });

  // Build a scannable URL with patient + prescription data
  const qrPayload = {
    patient: {
      id: mockPatient.id,
      name: mockPatient.name,
      age: mockPatient.age,
      gender: mockPatient.gender,
      bloodGroup: mockPatient.bloodGroup,
      contact: mockPatient.contactNumber,
    },
    prescriptions: prescriptions || [],
  };

  const qrUrl = `${window.location.origin}/patient-id?data=${encodeURIComponent(
    btoa(JSON.stringify(qrPayload))
  )}`;

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `patient-id-${mockPatient.id}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Downloaded!", description: "ID card saved as image." });
    } catch {
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Patient ID Card
        </h1>
        <p className="text-muted-foreground mt-1">
          Your digital health identity
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <Card ref={cardRef} className="overflow-hidden shadow-elevated">
          {/* Card Header */}
          <div className="gradient-hero p-6 pb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 translate-y-1/2 -translate-x-1/2" />
            <div className="relative flex items-center gap-3">
              <Heart className="h-6 w-6 text-primary" />
              <div>
                <h2 className="font-display font-bold text-lg text-primary-foreground">
                  Health Twin AI
                </h2>
                <p className="text-xs text-primary-foreground/60">
                  Digital Health Card
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 -mt-4">
            <div className="flex items-start gap-5">
              <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
                <UserCircle className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-display text-xl font-bold text-foreground">
                    {mockPatient.name}
                  </p>
                  <p className="font-mono text-sm text-primary font-semibold">
                    {mockPatient.id}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <InfoRow label="Age" value={`${mockPatient.age} yrs`} />
                  <InfoRow label="Gender" value={mockPatient.gender} />
                  <InfoRow label="Blood Group" value={mockPatient.bloodGroup} />
                  <InfoRow label="Contact" value={mockPatient.contactNumber} />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t">
              <InfoRow label="Address" value={mockPatient.address} />
            </div>

            {/* QR Code */}
            <div className="mt-5 flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">
                  Scan for full details
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  Opens patient profile & prescriptions
                </p>
              </div>
              {isLoading ? (
                <div className="h-24 w-24 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              ) : (
                <QRCodeSVG
                  value={qrUrl}
                  size={96}
                  level="L"
                  className="rounded-lg"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Button variant="outline" className="w-full" onClick={handleDownload}>
        <Download className="h-4 w-4 mr-2" /> Download ID Card
      </Button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </p>
      <p className="text-sm text-foreground font-medium">{value}</p>
    </div>
  );
}
