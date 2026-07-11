import type { SceneEntity, TransformData } from "../scene/SceneTypes";
import type { FrameRange } from "../time/FrameTime";

export type MaybePromise<T> = T | Promise<T>;
export type Unsubscribe = () => void;

export interface SceneService<TEntity extends SceneEntity = SceneEntity> {
  listEntities(): readonly TEntity[];
  getEntity(id: string): TEntity | undefined;
  updateTransform(id: string, transform: TransformData): void;
  setVisibility(id: string, visible: boolean): void;
  subscribe(listener: () => void): Unsubscribe;
}

export interface TimelineService<TProject> {
  getCurrentFrame(): number;
  seek(frame: number): void;
  setPlaying(playing: boolean): void;
  sampleProject(project: TProject, frame: number): TProject;
  subscribe(listener: (frame: number) => void): Unsubscribe;
}

export interface RenderFrameRequest<TProject, TOptions = unknown> {
  project: TProject;
  frame: number;
  options: TOptions;
}

export interface RenderService<TProject, TOptions = unknown, TResult = unknown> {
  renderFrame(request: RenderFrameRequest<TProject, TOptions>): Promise<TResult>;
  dispose(): void;
}

export type VfxQuality = "draft" | "medium" | "high" | "final";

export interface VfxEvaluationContext {
  frame: number;
  fps: number;
  seed: string;
  quality: VfxQuality;
}

export interface VfxService<TInstance, TResult> {
  evaluate(instance: TInstance, context: VfxEvaluationContext): TResult;
  disposeInstance(id: string): void;
}

export interface AudioService<TClip, TOutput = unknown> {
  preview(clips: readonly TClip[], frame: number, fps: number): void;
  mixdown(clips: readonly TClip[], range: FrameRange, fps: number): Promise<TOutput>;
  stop(): void;
}

export interface AssetService<TAsset, TInput = unknown> {
  import(input: TInput): Promise<TAsset>;
  validate(asset: TAsset): readonly string[];
  release(id: string): void;
}

export interface ProjectService<TProject> {
  create(): TProject;
  serialize(project: TProject): string;
  parse(raw: string): TProject;
  validate(project: TProject): readonly string[];
}

export interface ExportService<TProject, TSettings, TResult = unknown> {
  validate(project: TProject, settings: TSettings): readonly string[];
  export(project: TProject, settings: TSettings): Promise<TResult>;
  cancel(): MaybePromise<void>;
}

export interface PluginService<TManifest, TExtension = unknown> {
  validateManifest(manifest: TManifest): readonly string[];
  registerManifest(manifest: TManifest): void;
  listExtensions(): readonly TExtension[];
  canExecuteExternalCode(): boolean;
}
