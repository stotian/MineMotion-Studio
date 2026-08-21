import { describe, expect, it } from "vitest";
import { createInitialProject } from "../../project/ProjectStore";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import {
  loadProjectAutosave,
  saveProjectAutosave,
  type ProjectAutosaveStorage
} from "../../project/ProjectAutosave";
import { createEffectInstance } from "../../effects/EffectRegistry";
import type { ImportedWorldSummary, MineMotionProject } from "../../project/ProjectFile";
import type { ImportedChunkData } from "../../minecraft/import/MinecraftChunkTypes";
import { createFilmStarter } from "./FilmStarter";
import { buildStudioRenderPlan } from "./StudioRenderPipeline";

// Jalon 3 — Parcours film complet.
//
// Une seule fixture composite (façon TD-044) exerce le seam transversal du
// parcours film : monde borné importé, plusieurs rigs mis en scène, plans
// générés, éclairage/ciel/post appliqués, animation d'acteurs, et VFX. Elle
// vérifie ensuite que les plans de rendu preview, final et compositing sont
// produits de façon déterministe et survivent à JSON, package, autosave et
// export schéma 9 guardé. Aucune promesse de codec, d'installateur ou de rendu
// pixel réel (WebGL est absent en environnement de test) : on vérifie les plans.

function boundedWorldChunk(chunkZ: number): ImportedChunkData {
  return {
    id: `overworld:0,${chunkZ}`,
    dimension: "overworld",
    regionX: 0,
    regionZ: 0,
    chunkX: 0,
    chunkZ,
    minY: -64,
    maxY: 319,
    sectionsRead: 1,
    blocks: [
      { id: "stone", minecraftName: "minecraft:stone", x: 0, y: 63, z: chunkZ },
      { id: "grass_block", minecraftName: "minecraft:grass_block", x: 1, y: 64, z: chunkZ }
    ],
    unknownBlocks: {},
    warnings: [],
    contentFingerprint: `chunk-0-${chunkZ}`
  };
}

function boundedWorld(): ImportedWorldSummary {
  const chunks = [boundedWorldChunk(0), boundedWorldChunk(1)];
  return {
    sourceName: "Film Journey World",
    levelDatFound: true,
    levelName: "Film Journey",
    dimensions: [{ id: "overworld", label: "Overworld", regionFiles: ["region/r.0.0.mca"], estimatedChunks: chunks.length }],
    selectedDimension: "overworld",
    importedChunks: chunks,
    cachedMesh: {
      embedded: true,
      generatedAt: "2026-08-21T00:00:00.000Z",
      chunkCount: chunks.length,
      blockCount: chunks.reduce((total, chunk) => total + chunk.blocks.length, 0)
    },
    importedAt: "2026-08-21T00:00:00.000Z",
    notes: []
  };
}

// Assemble the full film journey once and reuse it across the assertions.
function buildFilmJourney(): MineMotionProject {
  const seeded: MineMotionProject = { ...createInitialProject(), world: boundedWorld() };

  // Multiple rigs staged, shots generated, and an environment look (sky,
  // lighting mood, post-processing, cinematic bars) applied in one pass. The
  // dialogue mode with staged actors also writes real animation tracks.
  const starter = createFilmStarter(seeded, {
    mode: "dialogue",
    lookId: "storm-battle",
    secondsPerShot: 1,
    stageActors: true
  });

  const firstShot = starter.project.production.shots[0];
  const heroId = starter.project.scene.characters[0].id;

  // Real authored rig animation on the authoritative global track (TD-028): a
  // right-arm rotation swing across the opening shot.
  const animated: MineMotionProject = {
    ...starter.project,
    animation: {
      ...starter.project.animation,
      tracks: [
        ...starter.project.animation.tracks,
        {
          id: "track_film_journey_arm",
          targetId: heroId,
          property: "bone.rotation.rightArm",
          keyframes: [
            { frame: firstShot.startFrame, value: [0, 0, 0], interpolation: "ease-in-out" },
            { frame: firstShot.endFrame, value: [45, 0, 12], interpolation: "ease-in-out" }
          ]
        }
      ]
    }
  };

  // A VFX effect authored on the first shot's frame.
  const withVfx: MineMotionProject = {
    ...animated,
    effects: {
      instances: [
        {
          ...createEffectInstance("shockwave", {
            id: "effect_film_journey",
            startFrame: firstShot.startFrame
          }),
          durationFrames: Math.max(1, firstShot.endFrame - firstShot.startFrame)
        }
      ]
    }
  };

  // Approve every active take so the render pipeline plans them, and request the
  // beauty/characters/vfx passes that final and compositing separate.
  return {
    ...withVfx,
    production: {
      ...withVfx.production,
      shots: withVfx.production.shots.map((shot) => ({
        ...shot,
        enabled: true,
        activeTake: true,
        rejected: false,
        approved: true,
        status: "approved" as const,
        renderPasses: ["beauty", "characters", "vfx"] as const
      }))
    }
  };
}

describe("Film journey composite (jalon 3)", () => {
  it("assembles a bounded world, multiple rigs, shots, lighting, animation and VFX", () => {
    const project = buildFilmJourney();

    // Bounded world imported and embedded.
    expect(project.world?.importedChunks).toHaveLength(2);
    expect(project.world?.importedChunks?.[0].blocks.length).toBeGreaterThan(0);

    // Multiple rigs staged.
    expect(project.scene.characters.length).toBeGreaterThanOrEqual(2);

    // Shots, storyboard and a camera timeline lane generated.
    expect(project.production.shots.length).toBeGreaterThan(0);
    expect(project.production.storyboard.length).toBe(project.production.shots.length);
    expect(
      project.animation.timelineTracks.find((lane) => lane.type === "camera")?.items.length
    ).toBe(project.production.shots.length);

    // Environment lit: sky, lighting mood and post-processing preset applied.
    expect(project.lighting.presetId).toBe("storm-fight");
    expect(project.sky.preset).toBe("Storm");
    expect(project.postProcessing.presetId).toBe("stormy-contrast");

    // Actors animated: real global animation tracks written by staging.
    expect(project.animation.tracks.length).toBeGreaterThan(0);

    // VFX authored on the timeline (its schema 10 native record is attached at
    // serialization time and checked in the persistence test below).
    expect(project.effects.instances).toHaveLength(1);
    expect(project.effects.instances[0].type).toBe("shockwave");
  });

  it("produces deterministic preview, final and compositing render plans", () => {
    const project = buildFilmJourney();
    const shotCount = project.production.shots.length;

    const preview = buildStudioRenderPlan(project, "preview", "approved");
    const final = buildStudioRenderPlan(project, "final", "approved");
    const compositing = buildStudioRenderPlan(project, "compositing", "approved");

    // Preview: one lightweight beauty job per shot, WebM draft.
    expect(preview.jobs).toHaveLength(shotCount);
    expect(preview.jobs.every((job) => job.settings.format === "webm_video")).toBe(true);
    expect(preview.jobs.every((job) => job.settings.quality === "draft")).toBe(true);

    // Final: every requested pass per shot, high-quality PNG sequences.
    expect(final.jobs).toHaveLength(shotCount * 3);
    expect(final.jobs.every((job) => job.settings.format === "png_sequence")).toBe(true);
    expect(final.jobs.every((job) => job.settings.quality === "high")).toBe(true);

    // Compositing: the same passes without cinematic bars or audio, ready to
    // recombine downstream.
    expect(compositing.jobs.length).toBeGreaterThan(0);
    expect(compositing.jobs.every((job) => job.settings.includeCinematicBars === false)).toBe(true);
    expect(compositing.jobs.every((job) => job.settings.includeAudio === false)).toBe(true);

    // No shot silently dropped from any profile.
    expect(preview.skippedShotIds).toEqual([]);
    expect(final.skippedShotIds).toEqual([]);
    expect(compositing.skippedShotIds).toEqual([]);
  });

  it("survives JSON, package, autosave and guarded schema 9 without losing the journey", () => {
    const project = buildFilmJourney();

    // Schema 10 JSON round-trip preserves world, rigs, shots, VFX and look.
    const reloaded = ProjectSerializer.parse(ProjectSerializer.serialize(project));
    expect(reloaded.schemaVersion).toBe(10);
    expect(reloaded.world?.importedChunks).toHaveLength(2);
    expect(reloaded.scene.characters.length).toBe(project.scene.characters.length);
    expect(reloaded.production.shots).toHaveLength(project.production.shots.length);
    expect(reloaded.effects.instances[0].nativeVfx).toBeTruthy();
    expect(reloaded.lighting.presetId).toBe("storm-fight");

    // Reloaded project still plans the same preview/final/compositing outputs.
    expect(buildStudioRenderPlan(reloaded, "preview", "approved").jobs).toHaveLength(
      buildStudioRenderPlan(project, "preview", "approved").jobs.length
    );
    expect(buildStudioRenderPlan(reloaded, "final", "approved").jobs).toHaveLength(
      buildStudioRenderPlan(project, "final", "approved").jobs.length
    );

    // Portable package stores the world once and restores it from the cache.
    const packageData = createMineMotionPackageData(project);
    expect(packageData.project.world?.importedChunks).toEqual([]);
    const fromPackage = PackageReader.parse(JSON.stringify(packageData));
    expect(fromPackage.world?.importedChunks).toEqual(project.world?.importedChunks);
    expect(fromPackage.effects.instances[0].nativeVfx).toBeTruthy();

    // Browser autosave round-trip.
    const storage = createMemoryStorage();
    saveProjectAutosave(storage, project);
    const restored = loadProjectAutosave(storage);
    expect(restored?.project.production.shots).toHaveLength(project.production.shots.length);
    expect(restored?.project.world?.importedChunks).toHaveLength(2);

    // Guarded schema 9 export keeps the standard-preset VFX representable.
    const legacy = JSON.parse(ProjectSerializer.serializeLegacyV9(project)) as {
      schemaVersion: number;
      effects: { instances: unknown[] };
    };
    expect(legacy.schemaVersion).toBe(9);
    expect(legacy.effects.instances).toHaveLength(1);
  });
});

function createMemoryStorage(): ProjectAutosaveStorage & Pick<Storage, "removeItem"> {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    }
  };
}
