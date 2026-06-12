import { Building2, Target, DollarSign, Tags, ChevronDown, Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useState } from 'react';

export type CatalogType = 'centros' | 'metas' | 'fuentes' | 'clasificadores';

interface CatalogOption {
  value: CatalogType;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const CATALOG_OPTIONS: CatalogOption[] = [
  {
    value: 'centros',
    label: 'Centros de Costo',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    value: 'metas',
    label: 'Metas Presupuestales',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    value: 'fuentes',
    label: 'Fuentes de Financiamiento',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  { 
    value: 'clasificadores', 
    label: 'Clasificadores de Gasto', 
    icon: Tags, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50' 
  },
];

interface CatalogSelectorProps {
  value: CatalogType;
  onChange: (value: CatalogType) => void;
}

export function CatalogSelector({ value, onChange }: CatalogSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = CATALOG_OPTIONS.find(o => o.value === value)!;
  const CurrentIcon = current.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all w-full sm:w-auto',
            'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200',
            current.bgColor,
            'border-current/20',
            current.color
          )}
        >
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-white shadow-sm')}>
            <CurrentIcon className={cn('w-5 h-5', current.color)} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs text-gray-500 font-medium">Catálogo actual</p>
            <p className={cn('text-sm font-bold', current.color)}>{current.label}</p>
          </div>
          <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {CATALOG_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = option.value === value;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', option.bgColor)}>
                      <Icon className={cn('w-5 h-5', option.color)} />
                    </div>
                    <span className="flex-1 font-medium text-sm text-gray-900">
                      {option.label}
                    </span>
                    <Check className={cn('w-4 h-4', isSelected ? 'opacity-100 text-blue-600' : 'opacity-0')} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}