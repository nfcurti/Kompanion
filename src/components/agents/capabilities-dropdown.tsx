"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { cn } from "@/lib/utils";

type CapabilitiesDropdownProps = {
  value: string[];
  onChange: (value: string[]) => void;
  id?: string;
  disabled?: boolean;
};

export function CapabilitiesDropdown({
  value,
  onChange,
  id,
  disabled,
}: CapabilitiesDropdownProps) {
  const { skills } = useWorkspace();
  const [open, setOpen] = useState(false);

  function toggle(skillId: string) {
    if (value.includes(skillId)) {
      onChange(value.filter((item) => item !== skillId));
      return;
    }
    onChange([...value, skillId]);
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || skills.length === 0}
            className="h-auto min-h-8 w-full justify-between px-2.5 py-1.5 font-normal"
          >
            <span className="truncate text-muted-foreground">
              {skills.length === 0
                ? "No skills available…"
                : value.length === 0
                  ? "Select skills…"
                  : `${value.length} selected`}
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
            <CommandInput placeholder="Search skills…" />
            <CommandList
              className="max-h-56 overscroll-contain"
              onWheel={(event) => event.stopPropagation()}
            >
              <CommandEmpty>No skill found.</CommandEmpty>
              <CommandGroup heading="Skills">
                {skills.map((skill) => {
                  const selected = value.includes(skill.id);
                  return (
                    <CommandItem
                      key={skill.id}
                      value={`${skill.id} ${skill.description}`}
                      data-checked={selected || undefined}
                      onSelect={() => toggle(skill.id)}
                      className="hover:cursor-pointer data-selected:bg-accent data-selected:text-accent-foreground"
                    >
                      <CheckIcon
                        className={cn(
                          "text-foreground opacity-0",
                          selected && "opacity-100",
                        )}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="font-mono text-sm">{skill.id}</span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {skill.description}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {skills.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Create skills under{" "}
          <Link
            href="/skills"
            className="underline underline-offset-2 hover:cursor-pointer hover:text-foreground"
          >
            Skills
          </Link>{" "}
          before attaching them to an agent.
        </p>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((skillId) => (
            <Badge key={skillId} variant="secondary" className="font-mono">
              {skillId}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
