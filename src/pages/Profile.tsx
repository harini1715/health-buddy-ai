import { motion } from "framer-motion";
import { UserCircle, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockPatient } from "@/data/mockData";
import { toast } from "sonner";

export default function Profile() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Patient Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your personal details</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-display">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center">
                  <UserCircle className="h-10 w-10 text-primary-foreground" />
                </div>
                <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-card border shadow-card flex items-center justify-center">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <div>
                <p className="font-display font-bold text-foreground">
                  {mockPatient.name}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  {mockPatient.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input defaultValue={mockPatient.name} />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" defaultValue={mockPatient.age} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select defaultValue={mockPatient.gender.toLowerCase()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select defaultValue="o+">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg.toLowerCase()}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input defaultValue={mockPatient.contactNumber} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input defaultValue={mockPatient.address} />
              </div>
            </div>

            <Button
              className="w-full gradient-primary text-primary-foreground"
              onClick={() => toast.success("Profile updated! (Mock)")}
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
