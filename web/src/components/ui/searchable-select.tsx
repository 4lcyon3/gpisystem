import * as React from 'react';
import { Check, ChevronsUpDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  /** Texto adicional para búsqueda (códigos, aliases, etc.) */
  keywords?: string[];
  /** Agrupación de la opción */
  group?: string;
  /** Deshabilitar opción específica */
  disabled?: boolean;
  /** Descripción auxiliar mostrada debajo del label */
  description?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  icon?: React.ReactNode;
  className?: string;
  showAll?: boolean;
  allLabel?: string;
  /** Permitir limpiar la selección */
  clearable?: boolean;
  /** Deshabilitar el componente */
  disabled?: boolean;
  /** Altura máxima del dropdown (por defecto 350px) */
  maxHeight?: number;
  /** Mostrar contador de resultados */
  showCount?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar por nombre, código...',
  emptyText = 'No se encontraron resultados',
  icon,
  className,
  showAll = false,
  allLabel = 'Todos',
  clearable = false,
  disabled = false,
  maxHeight = 350,
  showCount = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = value === 'all' ? allLabel : selectedOption?.label || placeholder;
  const hasValue = value && value !== 'all' && value !== '';

  // Filtrar opciones según búsqueda (para contador)
  const filteredCount = React.useMemo(() => {
    if (!search) return options.length;
    const q = search.toLowerCase();
    return options.filter((opt) => {
      const searchIn = [
        opt.label,
        opt.value,
        opt.badge,
        opt.description,
        ...(opt.keywords || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchIn.includes(q);
    }).length;
  }, [options, search]);

  // Agrupar opciones
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, SelectOption[]> = {};
    const ungrouped: SelectOption[] = [];

    options.forEach((opt) => {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    });

    return { groups, ungrouped };
  }, [options]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  const handleSelect = (newValue: string) => {
    onChange(newValue);
    setOpen(false);
    setSearch('');
  };

  const renderOption = (option: SelectOption) => {
    const isSelected = value === option.value;
    // Keywords para búsqueda: label + value + badge + keywords custom
    const keywords = [
      option.label,
      option.value,
      option.badge,
      option.description,
      ...(option.keywords || []),
    ].filter(Boolean) as string[];

    return (
      <CommandItem
        key={option.value}
        value={option.value}
        keywords={keywords}
        disabled={option.disabled}
        onSelect={() => !option.disabled && handleSelect(option.value)}
        className={cn(
          'flex items-start gap-2 py-2.5 px-3',
          isSelected && 'bg-blue-50',
          option.disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Check
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 transition-opacity',
            isSelected ? 'opacity-100 text-blue-600' : 'opacity-0'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span className="flex-1 truncate font-medium text-sm">
              {option.label}
            </span>
            {option.badge && (
              <Badge
                variant="outline"
                className="ml-auto text-[10px] font-mono px-1.5 py-0 bg-gray-50 shrink-0"
              >
                {option.badge}
              </Badge>
            )}
          </div>
          {option.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {option.description}
            </p>
          )}
        </div>
      </CommandItem>
    );
  };

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) setSearch('');
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'justify-between font-medium h-12 w-full',
            hasValue && 'bg-blue-50/50 border-blue-200 text-blue-900',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate flex-1 min-w-0">
            {icon && <span className="text-gray-500 shrink-0">{icon}</span>}
            <span className={cn('truncate', !hasValue && 'text-gray-400')}>
              {displayValue}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {clearable && hasValue && (
              <span
                onClick={handleClear}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Limpiar selección"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onOpenAutoFocus={() => {
          // Pequeño delay para que el input reciba foco
          setTimeout(() => {
            const input = document.querySelector<HTMLInputElement>(
              '[cmdk-input]'
            );
            input?.focus();
          }, 10);
        }}
      >
        <Command shouldFilter={true} className="max-h-none">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              className="h-11 pl-9 border-b"
            />
          </div>

          {showCount && (
            <div className="px-3 py-1.5 text-xs text-gray-500 border-b bg-gray-50/50">
              {filteredCount} de {options.length} resultado{filteredCount !== 1 ? 's' : ''}
            </div>
          )}

          <CommandList style={{ maxHeight: `${maxHeight}px` }}>
            <CommandEmpty>
              <div className="py-6 text-center">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{emptyText}</p>
                {search && (
                  <p className="text-xs text-gray-400 mt-1">
                    Intenta con otros términos
                  </p>
                )}
              </div>
            </CommandEmpty>

            {showAll && (
              <>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => handleSelect('all')}
                    className="flex items-center gap-2 py-2.5"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === 'all' ? 'opacity-100 text-blue-600' : 'opacity-0'
                      )}
                    />
                    <span className="font-semibold">{allLabel}</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Opciones sin grupo */}
            {groupedOptions.ungrouped.length > 0 && (
              <CommandGroup>
                {groupedOptions.ungrouped.map(renderOption)}
              </CommandGroup>
            )}

            {/* Opciones agrupadas */}
            {Object.entries(groupedOptions.groups).map(([groupName, groupOptions]) => (
              <React.Fragment key={groupName}>
                <CommandSeparator />
                <CommandGroup heading={groupName}>
                  {groupOptions.map(renderOption)}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}