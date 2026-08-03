import { useMemo, useState } from "react";
import { Activity, Plus, RefreshCw } from "lucide-react";
import type { MineMotionProject } from "../../project/ProjectFile";
import { bakeSimulation } from "../../simulation/SimulationBake";
import { resetSimulation, storeSimulationBake, upsertSimulation } from "../../simulation/SimulationController";
import { createSimulationDefinition } from "../../simulation/SimulationSerializer";
import type { SimulationKind, SimulationQuality } from "../../simulation/SimulationTypes";
import { useLocalization } from "../../localization/LocalizationContext";

interface Props {
  project: MineMotionProject;
  onProjectChange: (project: MineMotionProject, label: string) => void;
}

const KINDS: SimulationKind[] = ["debris", "particle-collision", "cloth", "shockwave", "crowd-path", "camera-noise", "wind"];

export function SimulationWorkspaceSection({ project, onProjectChange }: Props) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [kind, setKind] = useState<SimulationKind>("debris");
  const [quality, setQuality] = useState<SimulationQuality>("draft");
  const [bakingId, setBakingId] = useState<string | null>(null);
  const targets = useMemo(() => [...project.scene.characters, ...project.scene.cameras].map((entity) => entity.id), [project.scene.cameras, project.scene.characters]);
  const update = (simulations: MineMotionProject["simulations"], label: string) => onProjectChange({ ...project, simulations, metadata: { ...project.metadata, updatedAt: new Date().toISOString() } }, label);
  const add = () => {
    const definition = createSimulationDefinition(kind, { quality, startFrame: project.animation.currentFrame, endFrame: Math.min(project.animation.durationFrames, project.animation.currentFrame + project.animation.fps * 3), targetIds: targets });
    update(upsertSimulation(project.simulations, definition), "Create simulation");
  };
  const bake = async (id: string) => {
    const definition = project.simulations.definitions.find((entry) => entry.id === id); if (!definition) return;
    setBakingId(id);
    try { update(storeSimulationBake(project.simulations, await bakeSimulation(definition, { fps: project.animation.fps })), "Bake simulation"); }
    finally { setBakingId(null); }
  };
  return (
    <section className="simulation-workspace-section">
      <h3><Activity size={16} />{t("simulation.title")}</h3>
      <p>{t("simulation.readOnly")}</p>
      <div className="production-toolbar compact">
        <select value={kind} onChange={(event) => setKind(event.target.value as SimulationKind)}>{KINDS.map((value) => <option value={value} key={value}>{t(`simulation.kind.${value}`)}</option>)}</select>
        <select value={quality} onChange={(event) => setQuality(event.target.value as SimulationQuality)}><option value="draft">{t("simulation.quality.draft")}</option><option value="final">{t("simulation.quality.final")}</option></select>
        <button type="button" onClick={add}><Plus size={14} />{t("simulation.add")}</button>
      </div>
      <div className="simulation-definition-list">
        {project.simulations.definitions.map((definition) => {
          const bakeRecord = project.simulations.bakes.find((entry) => entry.simulationId === definition.id);
          return <article key={definition.id}><strong>{definition.name}</strong><span>{definition.kind} · {definition.quality} · {definition.startFrame}–{definition.endFrame}</span><small>{bakeRecord ? t("simulation.samples", { count: bakeRecord.samples.length }) : t("simulation.notBaked")}</small><button type="button" disabled={bakingId === definition.id} onClick={() => void bake(definition.id)}>{bakingId === definition.id ? t("simulation.baking") : t("simulation.bake")}</button><button type="button" onClick={() => update(resetSimulation(project.simulations, definition.id), "Reset simulation")}><RefreshCw size={13} />{t("simulation.reset")}</button></article>;
        })}
      </div>
    </section>
  );
}
