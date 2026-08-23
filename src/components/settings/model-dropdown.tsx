"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";

import { OPENAI_MODELS, type OpenAIModelId } from "@/agents/constants";
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

type ModelDropdownProps = {
  value: string;
  onChange: (value: OpenAIModelId) => void;
  id?: string;
  disabled?: boolean;
};

export function ModelDropdown({
  value,
  onChange,
  id,
  disabled,
}: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected =
    OPENAI_MODELS.find((model) => model.id === value) ?? OPENAI_MODELS[0];

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
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate">{selected.label}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {selected.id}
            </span>
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
          <CommandInput placeholder="Search models…" />
          <CommandList
            className="max-h-56 overscroll-contain"
            onWheel={(event) => event.stopPropagation()}
          >
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {OPENAI_MODELS.map((model) => {
                const isSelected = selected.id === model.id;
                return (
                  <CommandItem
                    key={model.id}
                    value={`${model.label} ${model.id} ${model.hint}`}
                    data-checked={isSelected || undefined}
                    onSelect={() => {
                      onChange(model.id);
                      setOpen(false);
                    }}
                    className="hover:cursor-pointer data-selected:bg-accent data-selected:text-accent-foreground"
                  >
                    <CheckIcon
                      className={cn(
                        "text-foreground opacity-0",
                        isSelected && "opacity-100",
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <span>{model.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.hint}
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {model.id}
                      </span>
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
