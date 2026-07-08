import { HelpCircle } from "lucide-react";

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
  onLoadSampleScene: () => void;
}

export function HelpPanel({ open, onClose, onLoadSampleScene }: HelpPanelProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel help-modal"
        role="dialog"
        aria-modal="true"
        aria-label="MineMotion help"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <HelpCircle size={18} />
            Quick Start
          </h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="help-content">
          <button
            type="button"
            className="primary-action"
            onClick={onLoadSampleScene}
          >
            Load Sample Scene
          </button>
          <ul>
            <li>Drag in the viewport to orbit, right-drag to pan, wheel to zoom.</li>
            <li>Select objects in the viewport or outliner.</li>
            <li>Edit transforms in the inspector.</li>
            <li>Add a keyframe, move to another frame, edit, then add another.</li>
            <li>Use Play to preview linear animation.</li>
            <li>World import currently scans folder structure; real chunk rendering is Phase 2.</li>
            <li>Save projects as `.mmsproj` JSON files.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

