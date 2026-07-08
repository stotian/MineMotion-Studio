import { LayoutTemplate } from "lucide-react";
import type { ProjectTemplate } from "../../templates/TemplateTypes";

interface TemplatePickerProps {
  open: boolean;
  templates: ProjectTemplate[];
  onClose: () => void;
  onCreateFromTemplate: (templateId: string) => void;
}

export function TemplatePicker({
  open,
  templates,
  onClose,
  onCreateFromTemplate
}: TemplatePickerProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel template-modal"
        role="dialog"
        aria-modal="true"
        aria-label="New project from template"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <LayoutTemplate size={18} />
            New Project From Template
          </h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="template-grid">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-card"
              onClick={() => onCreateFromTemplate(template.id)}
            >
              <strong>{template.name}</strong>
              <small>{template.category}</small>
              <span>{template.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

