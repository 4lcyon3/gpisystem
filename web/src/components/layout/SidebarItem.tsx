/* eslint-disable react-hooks/static-components */
import { Link, useLocation } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/stores/authStore';

interface SidebarItemProps {
  item: MenuItem;
  collapsed: boolean;
  onClick?: () => void;
}

export function SidebarItem({ item, collapsed, onClick }: SidebarItemProps) {
  const location = useLocation();
  const Icon = getIcon(item.icono);
  const isActive = location.pathname === item.ruta;

  const content = (
    <Link
      to={item.ruta}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className={cn(
        'w-5 h-5 shrink-0',
        isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
      )} />
      {!collapsed && (
        <span className="text-sm font-medium truncate">{item.nombre}</span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.nombre}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}