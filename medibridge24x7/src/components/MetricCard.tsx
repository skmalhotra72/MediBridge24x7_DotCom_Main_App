import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

export const MetricCard = ({ icon: Icon, label, value, trend, isLoading }: MetricCardProps) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-400" />
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 text-sm font-medium ${
              trend.isPositive ? 'text-secondary-400' : 'text-accent-400'
            }`}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-sm mb-1">{label}</p>
        {isLoading ? (
          <div className="h-8 w-24 bg-slate-700 animate-pulse rounded"></div>
        ) : (
          <p className="text-3xl font-bold text-white">{value}</p>
        )}
      </div>
    </div>
  );
};
