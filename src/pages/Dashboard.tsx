import { motion } from "framer-motion";
import {
  Pill,
  FileText,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Volume2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardStats, mockReminders, mockPrescriptions } from "@/data/mockData";
import { Link } from "react-router-dom";

const statIcons = [Pill, FileText, Clock, TrendingUp];

export default function Dashboard() {
  const speakReminder = (medicine: string, time: string, instruction: string) => {
    const msg = new SpeechSynthesisUtterance(
      `Hi Chandry, it's ${time}. Please take ${medicine} ${instruction}.`
    );
    msg.rate = 0.9;
    speechSynthesis.speak(msg);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-display font-bold text-foreground">
          Good Morning, Chandry 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your health overview for today
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat, i) => {
          const Icon = statIcons[i];
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    {stat.trend === "up" && (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    )}
                  </div>
                  <p className="mt-4 text-2xl font-display font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Reminders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-display">Today's Schedule</CardTitle>
              <Link to="/reminders">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockReminders.slice(0, 4).map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                      <Clock className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {reminder.medicine}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reminder.time} · {reminder.instruction}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={reminder.status === "upcoming" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {reminder.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        speakReminder(
                          reminder.medicine,
                          reminder.time,
                          reminder.instruction
                        )
                      }
                    >
                      <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Prescriptions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-display">
                Recent Prescriptions
              </CardTitle>
              <Link to="/prescriptions">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-4 rounded-xl border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {rx.doctorName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rx.hospitalName}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {rx.id}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-muted-foreground">
                      📅 {rx.date}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      💊 {rx.medicines.length} medicines
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
