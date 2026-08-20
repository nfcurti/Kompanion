"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";

import type { AgentStatus } from "@/agents/types";
import { statusMeta } from "@/components/agents/agent-meta";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: AgentStatus[] = [
  "planned",
  "registered",
  "active",
  "disabled",
];

type StatusDropdownProps = {
  value: AgentStatus;
  onChange: (value: AgentStatus) => void;
  id?: string;
  disabled?: boolean;
};

export function StatusDropdown({
  value,
  onChange,
  id,
  disabled,
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2">
            <span
              className={cn("size-1.5 rounded-full", statusMeta[value].dot)}
              aria-hidden
            />
            {statusMeta[value].label}
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onWheel={(event) => event.stopPropagation()}
      >
        <Command className="max-h-72 w-full rounded-lg border-0 bg-transparent">
          <CommandInput placeholder="Search status…" />
          <CommandList
            className="max-h-56 overscroll-contain"
            onWheel={(event) => event.stopPropagation()}
          >
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup>
              {STATUS_OPTIONS.map((status) => {
                const selected = value === status;
                const meta = statusMeta[status];
                return (
                  <CommandItem
                    key={status}
                    value={`${meta.label} ${status}`}
                    data-checked={selected || undefined}
                    onSelect={() => {
                      onChange(status);
                      setOpen(false);
                    }}
                    className="hover:cursor-pointer data-selected:bg-accent data-selected:text-accent-foreground"
                  >
                    <CheckIcon
                      className={cn(
                        "text-foreground opacity-0",
                        selected && "opacity-100",
                      )}
                    />
                    <span
                      className={cn("size-1.5 rounded-full", meta.dot)}
                      aria-hidden
                    />
                    <span className="flex-1">{meta.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {status}
                    </span>
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
