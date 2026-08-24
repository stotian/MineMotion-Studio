import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Blender's editor header.
 *
 * Every Blender editor carries one of these instead of a title bar: an
 * editor-type icon on the far left, then plain-text menus, then controls
 * pushed to the right. Blender never writes the editor's name in its header —
 * a header reading "Properties" is the clearest tell that a UI is only
 * imitating Blender rather than following it.
 */
export function EditorHeader({
  icon: Icon,
  label,
  menus,
  children
}: {
  /** Editor-type icon, shown in the leading dropdown-style button. */
  icon: LucideIcon;
  /** Accessible name for the editor; shown only to screen readers. */
  label: string;
  /** Plain-text menu entries, e.g. View / Select / Add / Object. */
  menus?: ReactNode;
  /** Controls pushed to the right-hand end of the header. */
  children?: ReactNode;
}) {
  return (
    <div className="editor-header" role="toolbar" aria-label={label}>
      <button type="button" className="editor-type" aria-label={label} title={label}>
        <Icon size={14} />
        <span className="editor-type-caret" aria-hidden="true" />
      </button>
      {menus ? <div className="editor-menus">{menus}</div> : null}
      {children ? <div className="editor-header-controls">{children}</div> : null}
    </div>
  );
}

/** A plain-text header menu, as in Blender's View / Select / Add / Object. */
export function EditorMenu({
  label,
  onClick
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="editor-menu" onClick={onClick}>
      {label}
    </button>
  );
}
