import type { MineMotionProject } from "../../project/ProjectFile";
import type { StoryboardCard } from "../ShotTypes";

export function synchronizeStoryboard(project: MineMotionProject): MineMotionProject {
  const existingByShot = new Map(
    project.production.storyboard
      .filter((card): card is StoryboardCard & { shotId: string } => Boolean(card.shotId))
      .map((card) => [card.shotId, card])
  );
  const freeCards = project.production.storyboard.filter((card) => card.shotId === null);
  const shotCards = [...project.production.shots]
    .filter((shot) => shot.enabled && shot.activeTake)
    .sort((a, b) => a.startFrame - b.startFrame || a.name.localeCompare(b.name))
    .map((shot): StoryboardCard => {
      const existing = existingByShot.get(shot.id);
      return {
        id: existing?.id ?? `storyboard_${shot.id}`,
        shotId: shot.id,
        title: shot.name,
        notes: existing?.notes || shot.notes,
        durationFrames: shot.endFrame - shot.startFrame + 1,
        cameraId: shot.cameraId,
        status: shot.status,
        referenceImage: existing?.referenceImage ?? shot.thumbnail ?? shot.referenceImages[0]
      };
    });
  return {
    ...project,
    production: {
      ...project.production,
      storyboard: [...shotCards, ...freeCards]
    }
  };
}
