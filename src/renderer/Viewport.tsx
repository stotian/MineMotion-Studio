import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { CameraEntity, MineMotionProject, TransformData } from "../project/ProjectFile";
import type { ViewportSettings } from "../settings/AppSettings";
import { findObject } from "../project/ProjectStore";
import { parseRigBoneSelection } from "../rigs/RigSelection";
import {
  SceneRenderer,
  type TransformMode,
  type ViewportOrientation
} from "./SceneRenderer";
import { ViewportGizmo } from "./ViewportGizmo";
import { EditorHeader, EditorMenu } from "../ui/shell/EditorHeader";
import { createPostProcessingStyles } from "../rendering/postprocessing/PostProcessingPipeline";
import { isSafeVfxColor } from "../vfx/core/VfxParameter";
import {
  getPreparedCameraShakeOffset,
  getPreparedVfxNumber,
  getPreparedVfxString,
  prepareProjectVfxFrame,
  shouldIncludeProjectVfx
} from "../vfx/runtime/VfxProjectFrame";
import { useLocalization } from "../localization/LocalizationContext";
import type { TranslationKey } from "../localization/LocalizationTypes";
import { createOptimizationRecommendationReport } from "../performance/OptimizationRecommendations";
import type { SampledMotionPath } from "../rigs/motion/MotionPathSampler";
import type { RendererMetricsSnapshot } from "../performance/RendererMetrics";
import {
  Activity,
  Boxes,
  Maximize,
  Maximize2,
  KeyRound,
  MousePointer2,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import type { BuildSequenceSettings } from "../experimental/buildsequencer/BuildSequenceTypes";
import { useExperimentalFeature } from "../experimental/useExperimentalFeature";
import { BuildSequencerControls } from "../ui/experimental/BuildSequencerControls";

interface ViewportProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string | null) => void;
  lookThroughCameraRequest: number;
  resetCameraRequest: number;
  focusWorldRequest: number;
  viewportSettings: ViewportSettings;
  motionPath: SampledMotionPath | null;
  /** Applies a viewport gizmo drag to the project. */
  onTransformObject: (objectId: string, transform: TransformData) => void;
  /** Applies a viewport rotate-gizmo drag on a rig bone. */
  onRotateBone: (
    characterId: string,
    boneId: string,
    rotationDegrees: [number, number, number]
  ) => void;
  /** Keys the current selection at the playhead (Blender's "I"). */
  onAddKeyframe: () => void;
}

export function Viewport({
  project,
  selectedObjectId,
  onSelectObject,
  lookThroughCameraRequest,
  resetCameraRequest,
  focusWorldRequest,
  viewportSettings,
  motionPath,
  onTransformObject,
  onRotateBone,
  onAddKeyframe
}: ViewportProps) {
  // Experimental Build Sequencer reveal is session-only viewport state.
  const [buildReveal, setBuildReveal] = useState<BuildSequenceSettings | null>(null);
  const buildSequencerEnabled = useExperimentalFeature("build-sequencer");
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<SceneRenderer | null>(null);
  const [metrics, setMetrics] = useState<RendererMetricsSnapshot | null>(null);
  const [metricsHidden, setMetricsHidden] = useState(false);
  const [orientation, setOrientation] = useState<ViewportOrientation | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>("select");
  const boneSelected = Boolean(parseRigBoneSelection(selectedObjectId));
  // Blender shows "<collection> | <active object>" under the view label.
  const selectedName = useMemo(() => {
    if (!selectedObjectId) return t("common.none");
    // findObject matches whole entities; a bone selection resolves to its owner.
    const ownerId = parseRigBoneSelection(selectedObjectId)?.characterId ?? selectedObjectId;
    return findObject(project, ownerId)?.entity.name ?? t("common.none");
  }, [project, selectedObjectId, t]);

  const optimizationReport = useMemo(
    () => metrics ? createOptimizationRecommendationReport(metrics, "draft") : null,
    [metrics]
  );
  const handleMetrics = useCallback((snapshot: RendererMetricsSnapshot) => {
    setMetrics(snapshot);
  }, []);
  const handleOrientation = useCallback((next: ViewportOrientation) => {
    setOrientation(next);
  }, []);
  // Held in a ref so a new callback identity never tears down the renderer.
  const transformObjectRef = useRef(onTransformObject);
  transformObjectRef.current = onTransformObject;
  const handleTransformObject = useCallback(
    (objectId: string, transform: TransformData) => {
      transformObjectRef.current(objectId, transform);
    },
    []
  );
  const rotateBoneRef = useRef(onRotateBone);
  rotateBoneRef.current = onRotateBone;
  const addKeyframeRef = useRef(onAddKeyframe);
  addKeyframeRef.current = onAddKeyframe;
  const handleRotateBone = useCallback(
    (characterId: string, boneId: string, rotation: [number, number, number]) => {
      rotateBoneRef.current(characterId, boneId, rotation);
    },
    []
  );
  const handlePickAxis = useCallback((axis: "x" | "y" | "z", sign: 1 | -1) => {
    rendererRef.current?.viewAlongAxis(axis, sign);
  }, []);

  // Blender's G/R/S shortcuts, ignored while typing in a field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      if (key === "i") {
        event.preventDefault();
        addKeyframeRef.current();
        return;
      }
      const mode = ({
        g: "translate",
        r: "rotate",
        s: "scale",
        escape: "select"
      } as const)[key];
      if (!mode) return;
      event.preventDefault();
      setTransformMode(mode);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    rendererRef.current?.setTransformMode(transformMode);
  }, [transformMode]);

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) {
      return;
    }

    rendererRef.current = new SceneRenderer({
      container: containerRef.current,
      onSelectObject,
      onMetrics: handleMetrics,
      onOrientation: handleOrientation,
      onTransformObject: handleTransformObject,
      onRotateBone: handleRotateBone
    });

    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [
    handleMetrics,
    handleOrientation,
    handleRotateBone,
    handleTransformObject,
    onSelectObject
  ]);

  useEffect(() => {
    rendererRef.current?.renderProject(
      project,
      selectedObjectId,
      viewportSettings,
      motionPath,
      buildReveal
    );
  }, [buildReveal, motionPath, project, selectedObjectId, viewportSettings]);

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
      aria-label={t("viewport.ariaLabel")}
    >
      {/* Blender's 3D View header: mode, then View/Select/Add/Object. */}
      <EditorHeader
        icon={Boxes}
        label={t("viewport.ariaLabel")}
        menus={
          <>
            <select
              className="viewport-mode"
              value="object"
              onChange={() => undefined}
              aria-label={t("viewport.mode")}
            >
              <option value="object">{t("viewport.mode.object")}</option>
              <option value="pose">{t("viewport.mode.pose")}</option>
            </select>
            <EditorMenu label={t("viewport.menu.view")} />
            <EditorMenu label={t("viewport.menu.select")} />
            <EditorMenu label={t("viewport.menu.add")} />
            <EditorMenu label={t("viewport.menu.object")} />
          </>
        }
      >
        <div className="viewport-shading" role="group" aria-label={t("viewport.shading")}>
          {(["wireframe", "solid", "material", "rendered"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`shading-ball shading-${mode}${mode === "solid" ? " is-active" : ""}`}
              aria-label={t(`viewport.shading.${mode}`)}
              title={t(`viewport.shading.${mode}`)}
            />
          ))}
        </div>
      </EditorHeader>
      <div className="viewport-body">
      <div className="viewport-info">
        <span className="viewport-info-view">
          {project.renderSettings.renderPreviewEnabled
            ? t("status.renderPreview")
            : t("viewport.perspective")}
        </span>
        <span className="viewport-info-scene">
          {project.renderSettings.renderPreviewEnabled
            ? t("viewport.activeCamera", {
                name: project.scene.cameras.find((camera) => camera.id === project.activeCameraId)?.name ??
                  t("common.none")
              })
            : `${project.projectName} | ${selectedName}`}
        </span>
        {project.world?.importedChunks?.length ? (
          <span className="viewport-info-scene">
            {localization.plural({ one: "viewport.importedChunks.one", other: "viewport.importedChunks.other" }, project.world.importedChunks.length)}
          </span>
        ) : null}
      </div>
      <div className="viewport-tools" role="toolbar" aria-label={t("viewport.tools")}>
        {([
          { mode: "select", icon: MousePointer2, key: "viewport.tool.select" },
          { mode: "translate", icon: Move, key: "viewport.tool.move" },
          { mode: "rotate", icon: RotateCw, key: "viewport.tool.rotate" },
          { mode: "scale", icon: Maximize2, key: "viewport.tool.scale" }
        ] as const).map(({ mode, icon: Icon, key }) => {
          // A rig bone stores only a rotation, so move/scale cannot apply to it.
          const disabled = boneSelected && (mode === "translate" || mode === "scale");
          const active = boneSelected && transformMode !== "select"
            ? mode === "rotate"
            : transformMode === mode;
          return (
            <button
              key={mode}
              type="button"
              className={active ? "is-active" : undefined}
              aria-pressed={active}
              disabled={disabled}
              aria-label={t(key)}
              title={disabled ? t("viewport.tool.boneRotateOnly") : t(key)}
              onClick={() => setTransformMode(mode)}
            >
              <Icon size={16} />
            </button>
          );
        })}
        <div className="viewport-tools-separator" />
        <button
          type="button"
          aria-label={t("viewport.tool.keyframe")}
          title={t("viewport.tool.keyframe")}
          onClick={onAddKeyframe}
        >
          <KeyRound size={16} />
        </button>
      </div>
      <ViewportGizmo
        orientation={orientation}
        label={t("viewport.gizmo")}
        onPickAxis={handlePickAxis}
      />
      <div className="viewport-nav-stack">
        <button
          type="button"
          aria-label={t("viewport.zoomIn")}
          title={t("viewport.zoomIn")}
          onClick={() => rendererRef.current?.dolly(0.8)}
        >
          <ZoomIn size={15} />
        </button>
        <button
          type="button"
          aria-label={t("viewport.zoomOut")}
          title={t("viewport.zoomOut")}
          onClick={() => rendererRef.current?.dolly(1.25)}
        >
          <ZoomOut size={15} />
        </button>
        <button
          type="button"
          aria-label={t("viewport.frameAll")}
          title={t("viewport.frameAll")}
          onClick={() => rendererRef.current?.focusImportedWorld()}
        >
          <Maximize size={15} />
        </button>
      </div>
      {buildSequencerEnabled && (
        <BuildSequencerControls
          hasWorld={Boolean(project.world?.importedChunks?.length)}
          value={buildReveal}
          onChange={setBuildReveal}
          timelineFrames={project.animation.durationFrames}
        />
      )}
      <div
        ref={containerRef}
        className="viewport-canvas"
        style={{
          ...postProcessingStyles.canvasStyle,
          filter: `${String(postProcessingStyles.canvasStyle.filter ?? "")} ${colorDrainFilter}`.trim() || undefined,
          ...shakeStyle
        }}
      />
      {project.performanceSettings.showDiagnostics &&
        !project.renderSettings.renderPreviewEnabled &&
        metrics && !metricsHidden && (
          <div className="viewport-performance-metrics" aria-live="off">
            <button
              type="button"
              className="viewport-metrics-close"
              aria-label={t("viewport.metrics.hide")}
              onClick={() => setMetricsHidden(true)}
            >×</button>
            <span>
              {t("viewport.metrics.frame", {
                fps: localization.formatNumber(roundOne(metrics.frame.fps)),
                average: localization.formatNumber(
                  roundOne(metrics.frame.averageFrameMs)
                ),
                p95: localization.formatNumber(
                  roundOne(metrics.frame.p95FrameMs)
                )
              })}
            </span>
            <span>
              {t("viewport.metrics.renderer", {
                calls: localization.formatNumber(metrics.renderer.calls),
                triangles: localization.formatNumber(metrics.renderer.triangles),
                textures: localization.formatNumber(metrics.renderer.textures)
              })}
            </span>
            <span>
              {t("viewport.metrics.scene", {
                objects: localization.formatNumber(metrics.project.sceneObjects),
                chunks: localization.formatNumber(metrics.project.importedChunks),
                active: localization.formatNumber(metrics.project.activeEffects),
                effects: localization.formatNumber(metrics.project.effects)
              })}
            </span>
            <span>
              {t("viewport.metrics.culling", {
                visible: localization.formatNumber(metrics.culling.visible),
                tested: localization.formatNumber(metrics.culling.tested),
                frustum: localization.formatNumber(
                  metrics.culling.frustumCulled
                ),
                distance: localization.formatNumber(
                  metrics.culling.distanceCulled
                ),
                layer: localization.formatNumber(metrics.culling.layerCulled),
                chunksVisible: localization.formatNumber(
                  metrics.culling.chunksVisible
                ),
                chunks: localization.formatNumber(
                  metrics.culling.chunksTested
                )
              })}
            </span>
            <span>
              {t("viewport.metrics.startupMemory", {
                startup: localization.formatNumber(roundOne(metrics.startupMs)),
                memory: metrics.heap
                  ? formatMegabytes(metrics.heap.usedBytes, (value) => localization.formatNumber(value))
                  : t("viewport.metrics.unavailable")
              })}
            </span>
            {optimizationReport && (
              <span
                className={`performance-budget-status ${optimizationReport.evaluation.status}`}
              >
                {t("viewport.metrics.budget", {
                  profile: t("viewport.metrics.profile.draft"),
                  status: t(
                    `viewport.metrics.status.${optimizationReport.evaluation.status}` as TranslationKey
                  )
                })}
              </span>
            )}
            {optimizationReport?.recommendations.map((recommendation) => (
              <span
                key={recommendation.metric}
                className={`performance-recommendation ${recommendation.severity}`}
              >
                {t(
                  `viewport.metrics.recommendation.${recommendation.code}` as TranslationKey
                )}
              </span>
            ))}
          </div>
        )}
      {project.performanceSettings.showDiagnostics &&
        !project.renderSettings.renderPreviewEnabled &&
        metrics && metricsHidden && (
          <button
            type="button"
            className="viewport-metrics-show"
            aria-label={t("viewport.metrics.show")}
            onClick={() => setMetricsHidden(false)}
          >
            <Activity size={13} />
          </button>
        )}
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
      </div>
    </section>
  );
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatMegabytes(
  bytes: number,
  formatNumber: (value: number) => string
): string {
  return `${formatNumber(roundOne(bytes / (1024 * 1024)))} MB`;
}
