import { Button } from '@/components/ui/button';
import { Plus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
  };
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: PageHeaderProps) {
  const ActionIcon = action?.icon ?? Plus;

  return (
    <div className={cn('mb-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>

        {action && (
          <Button
            onClick={action.onClick}
            disabled={action.disabled}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <ActionIcon className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}