import { motion } from "framer-motion";
import { Bell, Volume2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockReminders } from "@/data/mockData";
import { useState } from "react";

export default function Reminders() {
  const [reminders, setReminders] = useState(mockReminders);

  const speakReminder = (medicine: string, time: string, instruction: string) => {
    const msg = new SpeechSynthesisUtterance(
      `Hi Chandry, it's ${time}. Please take ${medicine} ${instruction}.`
    );
    msg.rate = 0.9;
    speechSynthesis.speak(msg);
  };

  const markDone = (id: number) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "done" as const } : r))
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Medicine Reminders 🔔
        </h1>
        <p className="text-muted-foreground mt-1">
          Stay on track with your medication schedule
        </p>
      </motion.div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-display">Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reminders.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                r.status === "done"
                  ? "bg-success/5 border-success/20 opacity-60"
                  : "hover:bg-accent/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    r.status === "done"
                      ? "bg-success/10"
                      : r.status === "upcoming"
                      ? "gradient-primary"
                      : "bg-muted"
                  }`}
                >
                  {r.status === "done" ? (
                    <Check className="h-5 w-5 text-success" />
                  ) : (
                    <Bell
                      className={`h-4 w-4 ${
                        r.status === "upcoming"
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {r.medicine}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.time} · {r.instruction}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    r.status === "done"
                      ? "default"
                      : r.status === "upcoming"
                      ? "default"
                      : "secondary"
                  }
                  className={`text-[10px] ${
                    r.status === "done" ? "bg-success text-success-foreground" : ""
                  }`}
                >
                  {r.status === "done" ? "taken" : r.status}
                </Badge>
                {r.status !== "done" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        speakReminder(r.medicine, r.time, r.instruction)
                      }
                    >
                      <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => markDone(r.id)}
                    >
                      Mark Done
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
