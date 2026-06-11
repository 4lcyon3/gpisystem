import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  trend?: {
    value: number;
    label: string;
  };
  variation?: number; // Nueva prop para comparativa interanual
  isLoading?: boolean;
}

const iconColorMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-amber-100 text-amber-600',
  purple: 'bg-purple-100 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend,
  variation,
  isLoading,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus
    : null;

  const trendColor = trend
    ? trend.value > 0
      ? 'text-emerald-600'
      : trend.value < 0
      ? 'text-red-600'
      : 'text-gray-500'
    : '';

  const VariationIcon = variation
    ? variation > 0
      ? ArrowUpRight
      : variation < 0
      ? ArrowDownRight
      : Minus
    : null;

  const variationColor = variation
    ? variation > 0
      ? 'text-emerald-600 bg-emerald-50'
      : variation < 0
      ? 'text-red-600 bg-red-50'
      : 'text-gray-500 bg-gray-50'
    : '';

  return (
    <Card className="border-gray-200 hover:shadow-md transition-all hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-gray-500 truncate flex-1">{title}</p>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconColorMap[iconColor])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <p className="text-2xl font-bold text-gray-900 tabular-nums mb-1">
          {value}
        </p>

        {subtitle && (
          <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {trend && TrendIcon && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
              <span className="text-gray-400 font-normal">{trend.label}</span>
            </div>
          )}

          {variation !== undefined && VariationIcon && (
            <div className={cn('flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', variationColor)}>
              <VariationIcon className="w-3 h-3" />
              <span>{variation > 0 ? '+' : ''}{variation.toFixed(1)}%</span>
              <span className="opacity-75 font-normal">vs anterior</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}