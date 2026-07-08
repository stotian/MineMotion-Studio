import type { AppSettings } from "../settings/AppSettings";
import type { MineMotionProject } from "../project/ProjectFile";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: "starter" | "animation" | "cinematic" | "mood";
  create: (settings?: AppSettings) => MineMotionProject;
}

