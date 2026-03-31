'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GroupPickerProps {
  allGroupCodes: string[];
  selectedGroupCode: string | null;
  onSelect: (groupCode: string | null) => void;
}

export function GroupPicker({
  allGroupCodes,
  selectedGroupCode,
  onSelect,
}: GroupPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">აირჩიეთ ჯგუფი</label>
      <Select value={selectedGroupCode || ''} onValueChange={(val) => onSelect(val)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="ჯგუფის არჩევა..." />
        </SelectTrigger>
        <SelectContent>
          {allGroupCodes.map((group) => (
            <SelectItem key={group} value={group}>
              {group.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
