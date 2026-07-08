import { useEffect, useMemo, useRef } from "react";
import type { CameraEntity, MineMotionProject } from "../project/ProjectFile";
import { findObject } from "../project/ProjectStore";
import { SceneRenderer } from "./SceneRenderer";

interface ViewportProps {
  project: MineMotionProject;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string | null) => void;
  lookThroughCameraRequest: number;
}

export function Viewport({
  project,
  selectedObjectId,
  onSelectObject,
  lookThroughCameraRequest
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
    rendererRef.current?.renderProject(project, selectedObjectId);
  }, [project, selectedObjectId]);

  const selectedCamera = useMemo(() => {
    const lookup = findObject(project, selectedObjectId);
    if (lookup?.entity.type === "camera") {
      return lookup.entity as CameraEntity;
    }
    return null;
  }, [project, selectedObjectId]);

  useEffect(() => {
    if (lookThroughCameraRequest > 0 && selectedCamera) {
      rendererRef.current?.lookThroughCamera(selectedCamera);
    }
  }, [lookThroughCameraRequest, selectedCamera]);

  return (
    <section className="viewport-shell" aria-label="3D viewport">
      <div className="viewport-toolbar">
        <span>Perspective</span>
        <span>Orbit: drag</span>
        <span>Pan: right drag</span>
        <span>Zoom: wheel</span>
      </div>
      <div ref={containerRef} className="viewport-canvas" />
    </section>
  );
}

