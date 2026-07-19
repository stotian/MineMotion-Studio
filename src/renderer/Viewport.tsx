import { type CSSProperties, useEffect, useMemo, useRef } from "react";
import type { CameraEntity, MineMotionProject } from "../project/ProjectFile";
import type { ViewportSettings } from "../settings/AppSettings";
import { findObject } from "../project/ProjectStore";
import { SceneRenderer } from "./SceneRenderer";
import { createPostProcessingStyles } from "../rendering/postprocessing/PostProcessingPipeline";
import { isSafeVfxColor } from "../vfx/core/VfxParameter";
import {
  getPreparedCameraShakeOffset,
  getPreparedVfxNumber,
  getPreparedVfxString,
  prepareProjectVfxFrame,
  shouldIncludeProjectVfx
} from "../vfx/runtime/VfxProjectFrame";

interface ViewportProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string | null) => void;
  lookThroughCameraRequest: number;
  resetCameraRequest: number;
  focusWorldRequest: number;
  viewportSettings: ViewportSettings;
}

export function Viewport({
  project,
  selectedObjectId,
  onSelectObject,
  lookThroughCameraRequest,
  resetCameraRequest,
  focusWorldRequest,
  viewportSettings
}: ViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<SceneRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) {
      return;
    }

    rendererRef.current = new SceneRenderer({
      container: containerRef.current,
      onSelectObject
    });

    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [onSelectObject]);

  useEffect(() => {
    rendererRef.current?.renderProject(project, selectedObjectId, viewportSettings);
  }, [project, selectedObjectId, viewportSettings]);

  const selectedCamera = useMemo(() => {
    const lookup = findObject(project, selectedObjectId);
    if (lookup?.entity.type === "camera") {
      return lookup.entity as CameraEntity;
    }
    return null;
  }, [project, selectedObjectId]);

  const activeCamera = useMemo(
    () => project.scene.cameras.find((camera) => camera.id === project.activeCameraId) ?? null,
    [project.activeCameraId, project.scene.cameras]
  );

  const preparedVfx = useMemo(
    () =>
      prepareProjectVfxFrame(project, {
        includeVfx: shouldIncludeProjectVfx(project),
        quality: project.renderSettings.renderPreviewEnabled
          ? "export"
          : "preview"
      }),
    [project]
  );
  const activeEffects = preparedVfx.ok ? preparedVfx.value.effects : [];

  const postProcessingStyles = useMemo(
    () => createPostProcessingStyles(project.postProcessing),
    [project.postProcessing]
  );

  const colorDrain = activeEffects.find((effect) => effect.type === "colorDrain");
  const colorDrainFilter = colorDrain
    ? `saturate(${Math.max(0, 1 - getPreparedVfxNumber(colorDrain, "alpha", 0.8) * getPreparedVfxNumber(colorDrain, "intensity", 1) * (1 - getPreparedVfxNumber(colorDrain, "saturation", 0)))})`
    : "";

  const shakeStyle = useMemo<CSSProperties>(() => {
    const { x, y } = getPreparedCameraShakeOffset(activeEffects);
    if (x === 0 && y === 0) return {};
    return {
      transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`
    };
  }, [activeEffects]);

  const flashStyle = useMemo<CSSProperties>(() => {
    const flash = activeEffects.find((effect) =>
      ["flash", "explosionFlash", "impactFrame", "hitStop", "nativeScreenFlash", "cinematicFreeze"].includes(effect.type)
    );
    if (!flash) return { opacity: 0 };
    const progress = flash.evaluation.progress;
    const alpha =
      getPreparedVfxNumber(flash, "alpha", 0.75) *
      (flash.type === "nativeScreenFlash" || flash.type === "cinematicFreeze"
        ? getPreparedVfxNumber(flash, "intensity", 1)
        : 1);
    const color = getPreparedVfxString(flash, "color", "#ffffff");
    return {
      opacity: Math.max(0, alpha * (1 - progress)),
      background: isSafeVfxColor(color) ? color : "#ffffff",
      mixBlendMode: flash.type === "impactFrame" ? "difference" : "screen"
    };
  }, [activeEffects]);

  const fogStyle = useMemo<CSSProperties>(() => {
    const fog = activeEffects.find((effect) => effect.type === "fogPulse");
    if (!fog && project.postProcessing.fogIntensity <= 0) {
      return { opacity: 0 };
    }
    const progress = fog?.evaluation.progress ?? 0;
    const fogColor = fog
      ? getPreparedVfxString(fog, "color", project.postProcessing.fogColor)
      : project.postProcessing.fogColor;
    const color = isSafeVfxColor(fogColor)
      ? fogColor
      : project.postProcessing.fogColor;
    const alpha =
      (fog
        ? getPreparedVfxNumber(
            fog,
            "alpha",
            project.postProcessing.fogIntensity
          )
        : project.postProcessing.fogIntensity) *
      (fog ? Math.sin(progress * Math.PI) : 1);
    return {
      opacity: Math.max(0, alpha),
      background: `radial-gradient(circle at center, ${color} 0%, transparent 68%)`
    };
  }, [activeEffects, project.postProcessing]);

  const barsStyle = useMemo<CSSProperties>(() => {
    const barsEffect = activeEffects.find(
      (effect) =>
        effect.type === "cinematicBars" || effect.type === "cinematicFrameBars"
    );
    const enabled = project.renderSettings.cinematicBarsEnabled || Boolean(barsEffect);
    if (!enabled) return { display: "none" };
    const style =
      (barsEffect
        ? getPreparedVfxString(
            barsEffect,
            "barStyle",
            project.renderSettings.cinematicBarsRatio
          )
        : project.renderSettings.cinematicBarsRatio);
    const nativeBars = barsEffect?.type === "cinematicFrameBars";
    const barColorValue = barsEffect
      ? getPreparedVfxString(barsEffect, "color", "#000000")
      : "#000000";
    return {
      "--bar-size": style === "16:9" ? "9%" : "14%",
      "--bar-color": isSafeVfxColor(barColorValue) ? barColorValue : "#000000",
      opacity: nativeBars
        ? Math.min(1, getPreparedVfxNumber(barsEffect, "alpha", 1) * getPreparedVfxNumber(barsEffect, "intensity", 1))
        : 1
    } as CSSProperties;
  }, [activeEffects, project.renderSettings]);

  const speedLinesVisible = activeEffects.some(
    (effect) => effect.type === "speedLines"
  );

  const bloomEffect = activeEffects.find((effect) => effect.type === "screenBloom");
  const bloomStyle = bloomEffect
    ? {
        opacity: Math.min(0.75, getPreparedVfxNumber(bloomEffect, "alpha", 0.35) * getPreparedVfxNumber(bloomEffect, "intensity", 1.3)),
        background: `radial-gradient(circle at center, ${getPreparedVfxString(bloomEffect, "color", "#fff4d6")} 0%, transparent ${Math.round(getPreparedVfxNumber(bloomEffect, "radius", 0.7) * 60)}%)`
      }
    : postProcessingStyles.overlayStyle;
  const vignetteEffect = activeEffects.find((effect) => effect.type === "nativeVignette");
  const vignetteStyle = vignetteEffect
    ? {
        opacity: Math.min(0.92, getPreparedVfxNumber(vignetteEffect, "alpha", 0.55) * getPreparedVfxNumber(vignetteEffect, "intensity", 1)),
        background: `radial-gradient(circle at center, transparent 44%, ${getPreparedVfxString(vignetteEffect, "color", "#000000")} 100%)`
      }
    : postProcessingStyles.vignetteStyle;
  const glitch = activeEffects.find((effect) => effect.type === "screenGlitch");
  const glitchStyle = glitch
    ? {
        opacity: Math.min(0.8, getPreparedVfxNumber(glitch, "alpha", 0.55)),
        transform: `translateX(${Math.sin(glitch.evaluation.frame * getPreparedVfxNumber(glitch, "frequency", 18) * 0.13) * getPreparedVfxNumber(glitch, "strength", 0.7) * getPreparedVfxNumber(glitch, "intensity", 1) * 8}px)`,
        boxShadow: `inset 5px 0 ${getPreparedVfxString(glitch, "secondaryColor", "#ff4fd8")}, inset -5px 0 ${getPreparedVfxString(glitch, "color", "#55eaff")}`
      }
    : postProcessingStyles.chromaticStyle;

  useEffect(() => {
    if (lookThroughCameraRequest > 0 && selectedCamera) {
      rendererRef.current?.lookThroughCamera(selectedCamera);
    }
  }, [lookThroughCameraRequest, selectedCamera]);

  useEffect(() => {
    if (project.renderSettings.renderPreviewEnabled && activeCamera) {
      rendererRef.current?.lookThroughCamera(activeCamera);
    }
  }, [activeCamera, project.renderSettings.renderPreviewEnabled]);

  useEffect(() => {
    if (resetCameraRequest > 0 && project.scene.cameras[0]) {
      rendererRef.current?.lookThroughCamera(project.scene.cameras[0]);
    }
  }, [resetCameraRequest, project.scene.cameras]);

  useEffect(() => {
    if (focusWorldRequest > 0) {
      rendererRef.current?.focusImportedWorld();
    }
  }, [focusWorldRequest]);

  return (
    <section
      className={`viewport-shell ${project.renderSettings.renderPreviewEnabled ? "render-preview" : ""}`}
      aria-label="3D viewport"
    >
      <div className="viewport-toolbar">
        <span>
          {project.renderSettings.renderPreviewEnabled
            ? "Render Preview"
            : "Perspective"}
        </span>
        {project.renderSettings.renderPreviewEnabled && (
          <span>
            Active camera:{" "}
            {project.scene.cameras.find((camera) => camera.id === project.activeCameraId)?.name ??
              "none"}
          </span>
        )}
        <span>Orbit: drag</span>
        <span>Pan: right drag</span>
        <span>Zoom: wheel</span>
        {project.world?.importedChunks?.length ? (
          <span>{project.world.importedChunks.length} imported chunks</span>
        ) : null}
      </div>
      <div
        ref={containerRef}
        className="viewport-canvas"
        style={{
          ...postProcessingStyles.canvasStyle,
          filter: `${String(postProcessingStyles.canvasStyle.filter ?? "")} ${colorDrainFilter}`.trim() || undefined,
          ...shakeStyle
        }}
      />
      <div className="post-bloom-overlay" style={bloomStyle} />
      <div className="post-chromatic-overlay" style={glitchStyle} />
      <div className="fog-overlay" style={fogStyle} />
      {speedLinesVisible && <div className="speed-lines-overlay" />}
      <div className="flash-overlay" style={flashStyle} />
      <div className="post-vignette-overlay" style={vignetteStyle} />
      <div className="post-grain-overlay" style={postProcessingStyles.grainStyle} />
      <div className="cinematic-bars-overlay" style={barsStyle}>
        <span />
        <span />
      </div>
    </section>
  );
}
