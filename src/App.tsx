import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AssetManager } from "./assets/AssetManager";
import { ObjImporter } from "./assets/ObjImporter";
import { Animator } from "./animation/Animator";
import { addTransformKeyframes, setCurrentFrame } from "./animation/Timeline";
import { WorldImporter } from "./minecraft/WorldImporter";
import type { MineMotionProject, TransformData } from "./project/ProjectFile";
import { ProjectSerializer } from "./project/ProjectSerializer";
import {
  createCharacter,
  createInitialProject,
  createObjEntity,
  createSceneCamera,
  findObject,
  updateObjectTransform
} from "./project/ProjectStore";
import { type SkyPresetId } from "./renderer/SkySystem";
import { Viewport } from "./renderer/Viewport";
import { TopBar } from "./ui/TopBar";
import { InspectorPanel } from "./ui/inspector/InspectorPanel";
import { OutlinerPanel } from "./ui/outliner/OutlinerPanel";
import { TimelinePanel } from "./ui/timeline/TimelinePanel";

export function App() {
  const [project, setProject] = useState<MineMotionProject>(() =>
    createInitialProject()
  );
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    project.scene.characters[0]?.id ?? null
  );
  const [status, setStatus] = useState(
    "Ready. Demo terrain and default Steve rig loaded."
  );
  const [lookThroughCameraRequest, setLookThroughCameraRequest] = useState(0);

  const worldInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  const objInputRef = useRef<HTMLInputElement | null>(null);
  const lastPlaybackTimeRef = useRef<number | null>(null);

  const displayProject = useMemo(
    () => Animator.sampleProject(project, project.animation.currentFrame),
    [project]
  );

  useEffect(() => {
    if (!project.animation.isPlaying) {
      lastPlaybackTimeRef.current = null;
      return;
    }

    let animationFrame = 0;
    const tick = (time: number) => {
      setProject((currentProject) => {
        const lastTime = lastPlaybackTimeRef.current ?? time;
        lastPlaybackTimeRef.current = time;
        const elapsedSeconds = (time - lastTime) / 1000;
        const frameStep = elapsedSeconds * currentProject.animation.fps;
        const nextFrame = currentProject.animation.currentFrame + frameStep;
        const reachedEnd = nextFrame >= currentProject.animation.durationFrames;

        return {
          ...currentProject,
          animation: {
            ...currentProject.animation,
            currentFrame: reachedEnd
              ? currentProject.animation.durationFrames
              : Math.round(nextFrame),
            isPlaying: reachedEnd ? false : currentProject.animation.isPlaying
          }
        };
      });
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [project.animation.isPlaying]);

  const handleSelectObject = useCallback((objectId: string | null) => {
    setSelectedObjectId(objectId);
  }, []);

  const handleNewProject = () => {
    const nextProject = createInitialProject();
    setProject(nextProject);
    setSelectedObjectId(nextProject.scene.characters[0]?.id ?? null);
    setStatus("New project created.");
  };

  const handleSaveProject = () => {
    const raw = ProjectSerializer.serialize(project);
    const blob = new Blob([raw], { type: "application/json" });
    const link = document.createElement("a");
    const filename = `${project.projectName
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "minemotion-project"}.mmsproj`;
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus(`Project saved as ${filename}.`);
  };

  const handleLoadProject = () => {
    projectInputRef.current?.click();
  };

  const handleProjectFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const loadedProject = ProjectSerializer.parse(await file.text());
      setProject(loadedProject);
      setSelectedObjectId(loadedProject.scene.characters[0]?.id ?? null);
      setStatus(`Loaded project ${loadedProject.projectName}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load project.");
    }
  };

  const handleOpenWorld = () => {
    worldInputRef.current?.click();
  };

  const handleWorldSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;

    const importedWorld = await WorldImporter.importFromFileList(files);
    setProject((currentProject) => ({
      ...currentProject,
      world: importedWorld
    }));
    setSelectedObjectId("world");
    setStatus(
      `World scan complete: ${importedWorld.sourceName}, ${importedWorld.dimensions
        .map((dimension) => `${dimension.label} ${dimension.regionFiles.length}`)
        .join(", ")} region files.`
    );
  };

  const handleAddCharacter = () => {
    const character = createCharacter(
      `Character ${project.scene.characters.length + 1}`,
      [project.scene.characters.length * 1.5, 1.05, 0]
    );
    setProject((currentProject) => ({
      ...currentProject,
      scene: {
        ...currentProject.scene,
        characters: [...currentProject.scene.characters, character]
      }
    }));
    setSelectedObjectId(character.id);
    setStatus(`Added ${character.name}.`);
  };

  const handleAddCamera = () => {
    const camera = createSceneCamera(
      `Camera ${project.scene.cameras.length + 1}`
    );
    setProject((currentProject) => ({
      ...currentProject,
      scene: {
        ...currentProject.scene,
        cameras: [...currentProject.scene.cameras, camera]
      }
    }));
    setSelectedObjectId(camera.id);
    setStatus(`Added ${camera.name}.`);
  };

  const handleImportObj = () => {
    objInputRef.current?.click();
  };

  const handleObjSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const imported = await ObjImporter.fromFile(file);
      setProject((currentProject) => {
        const { project: withAsset, asset } = AssetManager.addObjAsset(
          currentProject,
          imported.name,
          imported.rawObj
        );
        const entity = createObjEntity(asset.id, imported.name);
        setSelectedObjectId(entity.id);
        return {
          ...withAsset,
          scene: {
            ...withAsset.scene,
            importedObjects: [...withAsset.scene.importedObjects, entity]
          }
        };
      });
      setStatus(
        imported.warnings.length
          ? `Imported OBJ with warning: ${imported.warnings.join(" ")}`
          : `Imported OBJ ${imported.name}.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import OBJ.");
    }
  };

  const handleUpdateTransform = (
    objectId: string,
    transform: TransformData
  ) => {
    setProject((currentProject) =>
      updateObjectTransform(currentProject, objectId, transform)
    );
  };

  const handleAddKeyframe = () => {
    if (!selectedObjectId || selectedObjectId === "world") {
      setStatus("Select a character, camera, light, or OBJ before keyframing.");
      return;
    }

    const lookup = findObject(project, selectedObjectId);
    if (!lookup) {
      setStatus("Selected object is not keyframeable.");
      return;
    }

    setProject((currentProject) =>
      addTransformKeyframes(
        currentProject,
        selectedObjectId,
        currentProject.animation.currentFrame
      )
    );
    setStatus(
      `Transform keyframe added for ${lookup.entity.name} at frame ${project.animation.currentFrame}.`
    );
  };

  const handleSkyChange = (preset: SkyPresetId, customColor: string) => {
    setProject((currentProject) => ({
      ...currentProject,
      sky: {
        preset,
        customColor
      }
    }));
    setStatus(`Sky preset set to ${preset}.`);
  };

  const handleSetFrame = (frame: number) => {
    setProject((currentProject) => ({
      ...currentProject,
      animation: setCurrentFrame(currentProject.animation, frame)
    }));
  };

  const handleSetFps = (fps: number) => {
    setProject((currentProject) => ({
      ...currentProject,
      animation: {
        ...currentProject.animation,
        fps: Math.min(120, Math.max(1, Math.round(fps || 1)))
      }
    }));
  };

  const handleTogglePlayback = () => {
    setProject((currentProject) => ({
      ...currentProject,
      animation: {
        ...currentProject.animation,
        currentFrame:
          currentProject.animation.currentFrame >=
          currentProject.animation.durationFrames
            ? 0
            : currentProject.animation.currentFrame,
        isPlaying: !currentProject.animation.isPlaying
      }
    }));
  };

  const handleLookThroughCamera = () => {
    if (findObject(project, selectedObjectId)?.entity.type !== "camera") {
      setStatus("Select a scene camera first.");
      return;
    }
    setLookThroughCameraRequest((value) => value + 1);
    setStatus("Viewport moved to selected camera position.");
  };

  return (
    <main className="app-shell">
      <TopBar
        projectName={project.projectName}
        isPlaying={project.animation.isPlaying}
        onNewProject={handleNewProject}
        onOpenWorld={handleOpenWorld}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onAddCharacter={handleAddCharacter}
        onAddCamera={handleAddCamera}
        onImportObj={handleImportObj}
        onTogglePlayback={handleTogglePlayback}
      />
      <div className="workspace">
        <OutlinerPanel
          project={project}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
        />
        <Viewport
          project={displayProject}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
          lookThroughCameraRequest={lookThroughCameraRequest}
        />
        <InspectorPanel
          project={project}
          selectedObjectId={selectedObjectId}
          onUpdateTransform={handleUpdateTransform}
          onAddKeyframe={handleAddKeyframe}
          onSkyChange={handleSkyChange}
          onLookThroughCamera={handleLookThroughCamera}
        />
      </div>
      <TimelinePanel
        project={project}
        selectedObjectId={selectedObjectId}
        onSetFrame={handleSetFrame}
        onSetFps={handleSetFps}
        onTogglePlayback={handleTogglePlayback}
        onAddKeyframe={handleAddKeyframe}
      />
      <div className="status-bar">{status}</div>
      <input
        ref={worldInputRef}
        className="hidden-input"
        type="file"
        multiple
        {...{ webkitdirectory: "", directory: "" }}
        onChange={handleWorldSelected}
      />
      <input
        ref={projectInputRef}
        className="hidden-input"
        type="file"
        accept=".mmsproj,.minemotion,.json,application/json"
        onChange={handleProjectFileSelected}
      />
      <input
        ref={objInputRef}
        className="hidden-input"
        type="file"
        accept=".obj"
        onChange={handleObjSelected}
      />
    </main>
  );
}

