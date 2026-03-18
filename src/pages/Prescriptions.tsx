import { motion } from "framer-motion";
import { FileText, Calendar, Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockPrescriptions } from "@/data/mockData";

export default function Prescriptions() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Prescription History
        </h1>
        <p className="text-muted-foreground mt-1">
          All your prescriptions in one place
        </p>
      </motion.div>

      <div className="space-y-4">
        {mockPrescriptions.map((rx, i) => (
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
                        {rx.doctorName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {rx.hospitalName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {rx.id}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {rx.date}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Pill className="h-3.5 w-3.5" />
                    {rx.medicines.length} medicines
                  </div>
                </div>

                <div className="space-y-2">
                  {rx.medicines.map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {med.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {med.dosage} · {med.foodInstruction} food
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {med.timing.morning && (
                          <Badge className="text-[9px] bg-warning/10 text-warning border-warning/20" variant="outline">
                            AM
                          </Badge>
                        )}
                        {med.timing.afternoon && (
                          <Badge className="text-[9px] bg-info/10 text-info border-info/20" variant="outline">
                            PM
                          </Badge>
                        )}
                        {med.timing.night && (
                          <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20" variant="outline">
                            Night
                          </Badge>
                        )}
                      </div>
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
