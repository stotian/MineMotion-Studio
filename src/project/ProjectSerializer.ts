import { sanitizeAudioClips } from "../audio/AudioSerializer";
import { createAudioTimelineItems } from "../audio/AudioTrack";
import { sanitizeEffects } from "../effects/EffectSerializer";
import { createEffectTimelineItems } from "../effects/EffectTimelineTrack";
import {
  withPostProcessingDefaults
} from "../rendering/postprocessing/PostProcessingPresets";
import type {
  MineMotionProject,
  TimelineItem,
  TimelineTrackLane
} from "./ProjectFile";
import {
  createDefaultProjectSettings,
  createDefaultRenderSettings,
  createDefaultTimelineTracks
} from "./ProjectStore";

const CURRENT_SCHEMA_VERSION = 3;

type UnknownProject = Omit<Partial<MineMotionProject>, "schemaVersion"> & {
  schemaVersion?: number;
  [key: string]: unknown;
};

export class ProjectSerializer {
  static serialize(project: MineMotionProject): string {
    const updatedProject: MineMotionProject = {
      ...project,
      metadata: {
        ...project.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    return JSON.stringify(updatedProject, null, 2);
  }

  static parse(raw: string): MineMotionProject {
    const parsed = JSON.parse(raw) as UnknownProject;

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Project file is not a JSON object.");
    }

    if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      return ProjectSerializer.migrate(parsed);
    }

    const project = ProjectSerializer.withV3Defaults(parsed);
    ProjectSerializer.assertValidProject(project);
    return project;
  }

  private static migrate(parsed: UnknownProject): MineMotionProject {
    if (parsed.schemaVersion === 1) {
      ProjectSerializer.assertLegacyCoreData(parsed);
      const migratedV2 = ProjectSerializer.withV2CompatibilityDefaults(parsed);
      const migratedV3 = ProjectSerializer.withV3Defaults(migratedV2);
      ProjectSerializer.assertValidProject(migratedV3);
      return migratedV3;
    }

    if (parsed.schemaVersion === 2) {
      const migratedV3 = ProjectSerializer.withV3Defaults(parsed);
      ProjectSerializer.assertValidProject(migratedV3);
      return migratedV3;
    }

    if (parsed.schemaVersion === undefined) {
      throw new Error("Unsupported project file: missing schemaVersion.");
    }

    throw new Error(
      `Unsupported project schema version: ${String(parsed.schemaVersion)}.`
    );
  }

  private static withV2CompatibilityDefaults(
    project: UnknownProject
  ): UnknownProject {
    const settings = createDefaultProjectSettings();
    return {
      ...project,
      schemaVersion: 2,
      projectSettings: {
        ...settings,
        projectName: project.projectName ?? settings.projectName,
        fps: project.animation?.fps ?? settings.fps,
        durationFrames:
          project.animation?.durationFrames ?? settings.durationFrames,
        defaultSkyPreset: project.sky?.preset ?? settings.defaultSkyPreset,
        worldSourcePath: project.world?.sourcePath ?? ""
      }
    };
  }

  private static withV3Defaults(project: UnknownProject): MineMotionProject {
    const settingsDefaults = createDefaultProjectSettings();
    const effects = sanitizeEffects(project.effects?.instances);
    const audioClips = sanitizeAudioClips(project.audio?.clips);
    const activeCameraId =
      project.activeCameraId ?? project.scene?.cameras?.[0]?.id ?? "";
    const projectSettings = {
      ...settingsDefaults,
      ...project.projectSettings,
      projectName:
        project.projectSettings?.projectName ??
        project.projectName ??
        settingsDefaults.projectName,
      fps:
        project.projectSettings?.fps ??
        project.animation?.fps ??
        settingsDefaults.fps,
      durationFrames:
        project.projectSettings?.durationFrames ??
        project.animation?.durationFrames ??
        settingsDefaults.durationFrames
    };

    return {
      ...(project as MineMotionProject),
      schemaVersion: 3,
      projectName: projectSettings.projectName,
      projectSettings,
      activeCameraId,
      scene: {
        characters: (project.scene?.characters ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        })),
        cameras: (project.scene?.cameras ?? []).map((entity, index) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {},
          focalLength: entity.focalLength ?? 35,
          near: entity.near ?? 0.1,
          far: entity.far ?? 1000,
          active:
            entity.active ??
            (activeCameraId === ""
              ? index === 0
              : entity.id === activeCameraId)
        })),
        importedObjects: (project.scene?.importedObjects ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        })),
        lights: (project.scene?.lights ?? []).map((entity) => ({
          ...entity,
          locked: entity.locked ?? false,
          metadata: entity.metadata ?? {}
        }))
      },
      assets: {
        obj: project.assets?.obj ?? []
      },
      effects: {
        instances: effects
      },
      audio: {
        clips: audioClips
      },
      postProcessing: withPostProcessingDefaults(project.postProcessing),
      renderSettings: {
        ...createDefaultRenderSettings(),
        ...project.renderSettings
      },
      animation: {
        fps: projectSettings.fps,
        durationFrames: projectSettings.durationFrames,
        currentFrame: project.animation?.currentFrame ?? 0,
        isPlaying: project.animation?.isPlaying ?? false,
        tracks: project.animation?.tracks ?? [],
        timelineTracks: ProjectSerializer.withTimelineDefaults(
          project.animation?.timelineTracks,
          effects,
          audioClips
        )
      },
      metadata: {
        createdAt: project.metadata?.createdAt ?? new Date().toISOString(),
        updatedAt: project.metadata?.updatedAt ?? new Date().toISOString(),
        appVersion: "0.2.0"
      }
    };
  }

  private static withTimelineDefaults(
    tracks: TimelineTrackLane[] | undefined,
    effects: MineMotionProject["effects"]["instances"],
    audioClips: MineMotionProject["audio"]["clips"]
  ): TimelineTrackLane[] {
    const defaultTracks = createDefaultTimelineTracks();
    const effectItems: TimelineItem[] = createEffectTimelineItems(effects).map(
      (item) => ({
        id: `item_${item.effectId}`,
        type: "effect",
        label: item.effectId,
        targetId: item.effectId,
        effectId: item.effectId,
        startFrame: item.startFrame,
        durationFrames: item.durationFrames
      })
    );
    const audioItems: TimelineItem[] = createAudioTimelineItems(audioClips).map(
      (item) => ({
        id: `item_${item.clipId}`,
        type: "audio",
        label: item.clipId,
        targetId: item.clipId,
        audioClipId: item.clipId,
        startFrame: item.startFrame,
        durationFrames: item.durationFrames
      })
    );

    const hydratedDefaults = defaultTracks.map((track) => {
      if (track.type === "effect") return { ...track, items: effectItems };
      if (track.type === "audio") return { ...track, items: audioItems };
      return track;
    });

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return hydratedDefaults;
    }

    return hydratedDefaults.map((defaultTrack) => ({
      ...defaultTrack,
      ...(tracks.find((track) => track.id === defaultTrack.id) ?? {}),
      items:
        defaultTrack.type === "effect"
          ? effectItems
          : defaultTrack.type === "audio"
            ? audioItems
            : (tracks.find((track) => track.id === defaultTrack.id)?.items ?? [])
    }));
  }

  private static assertLegacyCoreData(project: UnknownProject): void {
    if (!project.scene || !project.animation || !project.assets) {
      throw new Error("Project file is missing required scene data.");
    }
  }

  private static assertValidProject(
    project: Partial<MineMotionProject>
  ): asserts project is MineMotionProject {
    if (project.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      throw new Error("Project file did not migrate to current schema.");
    }

    if (!project.projectName) {
      throw new Error("Project file is missing projectName.");
    }

    if (!project.projectSettings) {
      throw new Error("Project file is missing projectSettings.");
    }

    if (!project.scene || !project.animation || !project.assets) {
      throw new Error("Project file is missing required scene data.");
    }

    if (!project.effects || !project.audio || !project.postProcessing) {
      throw new Error("Project file is missing Phase 2 cinematic data.");
    }

    if (!project.renderSettings) {
      throw new Error("Project file is missing render settings.");
    }

    if (!Array.isArray(project.animation.tracks)) {
      throw new Error("Project file animation.tracks must be an array.");
    }

    if (!Array.isArray(project.animation.timelineTracks)) {
      throw new Error("Project file animation.timelineTracks must be an array.");
    }
  }
}
