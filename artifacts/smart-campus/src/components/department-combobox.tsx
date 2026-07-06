import React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useListDepartments } from '@workspace/api-client-react';

interface DepartmentComboboxProps {
  value: string; // department id as string, or "other"
  customValue?: string;
  onChange: (id: string, name: string) => void;
  onCustomChange?: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export function DepartmentCombobox({
  value,
  customValue = '',
  onChange,
  onCustomChange,
  placeholder = 'Select department',
  className,
}: DepartmentComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { data: departments = [], isLoading } = useListDepartments();

  const selected = value === 'other'
    ? { id: 'other', name: 'Other' }
    : departments.find((d: any) => String(d.id) === value);

  const handleSelect = (deptId: string, deptName: string) => {
    onChange(deptId, deptName);
    setOpen(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal h-10"
            type="button"
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading...
              </span>
            ) : selected ? (
              <span className="truncate">{selected.name}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search department..." />
            <CommandList className="max-h-64">
              <CommandEmpty>No department found.</CommandEmpty>
              <CommandGroup>
                {departments.map((dept: any) => (
                  <CommandItem
                    key={dept.id}
                    value={dept.name}
                    onSelect={() => handleSelect(String(dept.id), dept.name)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', value === String(dept.id) ? 'opacity-100' : 'opacity-0')}
                    />
                    {dept.name}
                  </CommandItem>
                ))}
                <CommandItem
                  value="Other"
                  onSelect={() => handleSelect('other', 'Other')}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === 'other' ? 'opacity-100' : 'opacity-0')}
                  />
                  Other
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value === 'other' && (
        <Input
          placeholder="Enter department name"
          value={customValue}
          onChange={e => onCustomChange?.(e.target.value)}
          className="mt-1"
        />
      )}
    </div>
  );
}
