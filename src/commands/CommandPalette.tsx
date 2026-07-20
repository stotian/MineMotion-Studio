import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Command } from "./Command";
import { useLocalization } from "../localization/LocalizationContext";
import type { TranslationKey } from "../localization/LocalizationTypes";

const GROUP_KEYS = {
  Project: "commands.group.project",
  Scene: "commands.group.scene",
  Timeline: "commands.group.timeline",
  View: "commands.group.view",
  Settings: "commands.group.settings",
  Plugins: "commands.group.plugins",
  Effects: "commands.group.effects",
  Render: "commands.group.render",
  Post: "commands.group.post"
} as const satisfies Record<Command["group"], TranslationKey>;

interface CommandPaletteProps {
  commands: Command[];
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({
  commands,
  open,
  onClose
}: CommandPaletteProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [query, setQuery] = useState("");
  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return commands;
    return commands.filter((command) =>
      `${command.title} ${command.group}`.toLowerCase().includes(normalized)
    );
  }, [commands, query]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label={t("commands.ariaLabel")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="command-search">
          <Search size={18} />
          <input
            autoFocus
            value={query}
            placeholder={t("commands.searchPlaceholder")}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "Enter" && filteredCommands[0]) {
                filteredCommands[0].run();
                onClose();
              }
            }}
          />
        </div>
        <div className="command-list">
          {filteredCommands.map((command) => (
            <button
              key={command.id}
              type="button"
              className="command-item"
              onClick={() => {
                command.run();
                onClose();
              }}
            >
              <span>{command.title}</span>
              <small>{command.shortcut ?? t(GROUP_KEYS[command.group])}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
