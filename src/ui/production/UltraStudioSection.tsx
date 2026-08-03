import { useMemo, useState, type ChangeEvent, type FocusEvent } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Plus, ShieldCheck, Trash2, WandSparkles } from "lucide-react";
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";
import type { MineMotionProject } from "../../project/ProjectFile";
import { createUltraPhaseArtifact } from "../../ultra/UltraDefaults";
import {
  ULTRA_ARCS,
  ULTRA_PHASE_DEFINITIONS,
  type UltraArcId,
  type UltraPhaseNumber
} from "../../ultra/UltraPhaseRegistry";
import { searchUltraCapabilities } from "../../ultra/capabilities/UltraCapabilityEngine";
import {
  getUltraPhaseRecords,
  markUltraValidationState,
  removeUltraPhaseRecord,
  setUltraActiveArc,
  updateUltraPhaseRecordMetadata,
  validateUltraProjectData
} from "../../ultra/UltraSerializer";

interface UltraStudioSectionProps {
  project: MineMotionProject;
  onProjectChange: (project: MineMotionProject, label: string) => void;
}

export function UltraStudioSection({ project, onProjectChange }: UltraStudioSectionProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const phaseText = (phase: UltraPhaseNumber, field: "title" | "objective" | "gate") => {
    const definition = ULTRA_PHASE_DEFINITIONS.find((candidate) => candidate.number === phase);
    return phase <= 83 ? t(`ultra.phase.${phase}.${field}` as TranslationKey) : definition?.[field] ?? "";
  };
  const [expandedPhase, setExpandedPhase] = useState<UltraPhaseNumber | null>(null);
  const [query, setQuery] = useState("");
  const activeArc = project.ultra.activeArc;
  const arcDefinitions = useMemo(
    () => ULTRA_PHASE_DEFINITIONS.filter((definition) => definition.arc === activeArc),
    [activeArc]
  );
  const definitions = useMemo(
    () => searchUltraCapabilities(query, arcDefinitions),
    [arcDefinitions, query]
  );
  const report = useMemo(() => validateUltraProjectData(project.ultra), [project.ultra]);

  const updateUltra = (ultra: MineMotionProject["ultra"], label: string) =>
    onProjectChange({ ...project, ultra }, label);

  const initializePhase = (phase: UltraPhaseNumber) => {
    const sequence = getUltraPhaseRecords(project.ultra, phase).length + 1;
    updateUltra(createUltraPhaseArtifact(phase, sequence)(project.ultra), `Initialize Ultra phase ${phase}`);
    setExpandedPhase(phase);
  };

  const initializeArc = () => {
    let ultra = project.ultra;
    for (const definition of arcDefinitions) {
      if (getUltraPhaseRecords(ultra, definition.number).length === 0) {
        ultra = createUltraPhaseArtifact(definition.number, 1)(ultra);
      }
    }
    updateUltra(ultra, `Initialize Ultra ${activeArc} arc`);
  };

  const validateAll = () => {
    const validation = validateUltraProjectData(project.ultra);
    updateUltra(markUltraValidationState(project.ultra, validation), "Validate Ultra production systems");
  };

  return (
    <section className="ultra-studio-section" aria-label={t("ultra.ariaLabel")}>
      <header className="ultra-studio-header">
        <div>
          <h3><WandSparkles size={17} />{t("ultra.title")}</h3>
          <p>{t("ultra.description")}</p>
        </div>
        <div className="ultra-studio-summary">
          <span>{t("ultra.configured", { count: report.configuredPhases })}</span>
          <span>{t("ultra.validated", { count: report.validatedPhases })}</span>
          <span className={report.valid ? "success-note" : "error-note"}>
            {report.valid ? t("ultra.valid") : t("ultra.invalid", { count: report.issues.length })}
          </span>
        </div>
      </header>

      <div className="ultra-arc-tabs" aria-label={t("ultra.arcs")}>
        <select
          value={activeArc}
          aria-label={t("ultra.arcs")}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const arc = event.currentTarget.value as UltraArcId;
            updateUltra(setUltraActiveArc(project.ultra, arc), `Open Ultra ${arc} arc`);
            setExpandedPhase(null);
          }}
        >
          {ULTRA_ARCS.map((arc) => (
            <option key={arc.id} value={arc.id}>{t(`ultra.arc.${arc.id}` as TranslationKey)}</option>
          ))}
        </select>
        <input
          value={query}
          type="search"
          placeholder={t("commands.searchPlaceholder")}
          aria-label={t("commands.searchPlaceholder")}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.currentTarget.value)}
        />
      </div>

      <div className="production-toolbar compact ultra-toolbar">
        <button type="button" onClick={initializeArc}><Plus size={14} />{t("ultra.initializeArc")}</button>
        <button type="button" onClick={validateAll}><ShieldCheck size={14} />{t("ultra.validateAll")}</button>
      </div>

      <div className="ultra-phase-grid">
        {definitions.map((definition) => {
          const records = getUltraPhaseRecords(project.ultra, definition.number);
          const state = project.ultra.phaseStates[String(definition.number)];
          const expanded = expandedPhase === definition.number;
          const phaseIssues = report.issues.filter((issue) => issue.phase === definition.number);
          return (
            <article key={definition.number} className={`ultra-phase-card status-${state?.status ?? "planned"}`}>
              <button
                type="button"
                className="ultra-phase-heading"
                onClick={() => setExpandedPhase(expanded ? null : definition.number)}
                aria-expanded={expanded}
              >
                {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                <span className="ultra-phase-number">{definition.number}</span>
                <span>
                  <strong>{phaseText(definition.number, "title")}</strong>
                  <small>{t(`ultra.status.${state?.status ?? "planned"}`)} · {t("ultra.artifacts", { count: records.length })}</small>
                </span>
                {state?.status === "validated" && <CheckCircle2 size={16} className="success-note" />}
              </button>
              {expanded && (
                <div className="ultra-phase-details">
                  <p>{phaseText(definition.number, "objective")}</p>
                  <dl>
                    <dt>{t("ultra.dependencies")}</dt>
                    <dd>{definition.dependencies.length > 0 ? definition.dependencies.join(", ") : t("common.none")}</dd>
                    <dt>{t("ultra.gate")}</dt>
                    <dd>{phaseText(definition.number, "gate")}</dd>
                  </dl>
                  <div className="ultra-record-list">
                    {records.map((record) => (
                      <div key={record.id} className="ultra-record-editor">
                        <div className="ultra-record-row">
                          <span><strong>{record.name}</strong><small>{record.id}</small></span>
                          <label className="ultra-enabled-toggle">
                            <input
                              type="checkbox"
                              checked={record.enabled}
                              onChange={(event: ChangeEvent<HTMLInputElement>) => updateUltra(
                                updateUltraPhaseRecordMetadata(project.ultra, definition.number, record.id, { enabled: event.currentTarget.checked }),
                                `Toggle Ultra phase ${definition.number} artifact`
                              )}
                            />
                            {t("ultra.enabled")}
                          </label>
                          <button
                            type="button"
                            title={t("ultra.removeArtifact")}
                            onClick={() => updateUltra(removeUltraPhaseRecord(project.ultra, definition.number, record.id), `Remove Ultra phase ${definition.number} artifact`)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <label>
                          {t("ultra.recordName")}
                          <input
                            key={`${record.id}_${record.updatedAt}_name`}
                            defaultValue={record.name}
                            maxLength={160}
                            onBlur={(event: FocusEvent<HTMLInputElement>) => {
                              if (event.currentTarget.value !== record.name) {
                                updateUltra(
                                  updateUltraPhaseRecordMetadata(project.ultra, definition.number, record.id, { name: event.currentTarget.value }),
                                  `Rename Ultra phase ${definition.number} artifact`
                                );
                              }
                            }}
                          />
                        </label>
                        <label>
                          {t("ultra.tags")}
                          <input
                            key={`${record.id}_${record.updatedAt}_tags`}
                            defaultValue={record.tags.join(", ")}
                            onBlur={(event: FocusEvent<HTMLInputElement>) => {
                              const tags = event.currentTarget.value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean);
                              if (tags.join("\u0000") !== record.tags.join("\u0000")) {
                                updateUltra(
                                  updateUltraPhaseRecordMetadata(project.ultra, definition.number, record.id, { tags }),
                                  `Update Ultra phase ${definition.number} tags`
                                );
                              }
                            }}
                          />
                        </label>
                        <label>
                          {t("ultra.notes")}
                          <textarea
                            key={`${record.id}_${record.updatedAt}_notes`}
                            defaultValue={record.notes}
                            maxLength={2048}
                            rows={2}
                            onBlur={(event: FocusEvent<HTMLTextAreaElement>) => {
                              if (event.currentTarget.value !== record.notes) {
                                updateUltra(
                                  updateUltraPhaseRecordMetadata(project.ultra, definition.number, record.id, { notes: event.currentTarget.value }),
                                  `Update Ultra phase ${definition.number} notes`
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                  {phaseIssues.map((issue) => (
                    <p key={`${issue.code}_${issue.recordId ?? "phase"}`} className={issue.severity === "error" ? "error-note" : "warning-note"}>
                      {issue.message}
                    </p>
                  ))}
                  <button type="button" onClick={() => initializePhase(definition.number)}>
                    <Plus size={14} />{t("ultra.addArtifact")}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
