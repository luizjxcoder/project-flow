import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  customColors?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, customColors = false }: StatCardProps) {
  return (
    <Card className={`hover:shadow-lg transition-shadow animate-fade-in h-full flex flex-col ${customColors ? 'bg-[#86BCBE]' : ''}`}>
      <CardContent className="p-6 flex-1 flex flex-col justify-center">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-sm font-medium ${customColors ? 'text-[#F9FAFF]' : 'text-muted-foreground'}`}>{title}</p>
            <h3 className={`text-3xl font-bold mt-2 ${customColors ? 'text-[#F9FAFF]' : 'text-foreground'}`}>{value}</h3>
            {trend && (
              <p className={`text-sm mt-2 ${customColors ? 'text-[#F9FAFF]/90' : (trendUp ? 'text-success' : 'text-destructive')}`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${customColors ? 'bg-[#F9FAFF]/20' : 'bg-primary/10'}`}>
            <Icon className={`w-6 h-6 ${customColors ? 'text-[#F9FAFF]' : 'text-primary'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
