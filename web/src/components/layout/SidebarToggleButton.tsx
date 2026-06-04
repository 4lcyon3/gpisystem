import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarToggleButtonProps {
  collapsed: boolean;
  onClick: () => void;
  className?: string;
}

export function SidebarToggleButton({ collapsed, onClick, className }: SidebarToggleButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        'h-8 w-8 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50',
        'transition-all duration-200',
        className
      )}
      aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
    >
      {collapsed ? (
        <ChevronRight className="w-4 h-4" />
      ) : (
        <ChevronLeft className="w-4 h-4" />
      )}
    </Button>
  );
}