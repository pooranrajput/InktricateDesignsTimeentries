import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export default function StatsCard({ title, value, icon: Icon, iconColor, iconBg }: StatsCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-2 ${iconBg} rounded-lg`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
