import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";

/**
 * Getting-started guide, shown in Settings.
 *
 * Grouped by task rather than by feature: someone opening this wants to know
 * how to do a thing, not what every panel is called. Each lesson lists the
 * literal steps, so it stays useful without screenshots that would go stale.
 */

interface Lesson {
  id: string;
  titleKey: TranslationKey;
  stepKeys: TranslationKey[];
}

const LESSONS: Lesson[] = [
  {
    id: "navigate",
    titleKey: "tutorial.navigate.title",
    stepKeys: [
      "tutorial.navigate.s1",
      "tutorial.navigate.s2",
      "tutorial.navigate.s3",
      "tutorial.navigate.s4"
    ]
  },
  {
    id: "pose",
    titleKey: "tutorial.pose.title",
    stepKeys: [
      "tutorial.pose.s1",
      "tutorial.pose.s2",
      "tutorial.pose.s3",
      "tutorial.pose.s4"
    ]
  },
  {
    id: "animate",
    titleKey: "tutorial.animate.title",
    stepKeys: [
      "tutorial.animate.s1",
      "tutorial.animate.s2",
      "tutorial.animate.s3",
      "tutorial.animate.s4"
    ]
  },
  {
    id: "world",
    titleKey: "tutorial.world.title",
    stepKeys: [
      "tutorial.world.s1",
      "tutorial.world.s2",
      "tutorial.world.s3"
    ]
  },
  {
    id: "mods",
    titleKey: "tutorial.mods.title",
    stepKeys: [
      "tutorial.mods.s1",
      "tutorial.mods.s2",
      "tutorial.mods.s3",
      "tutorial.mods.s4"
    ]
  },
  {
    id: "vfx",
    titleKey: "tutorial.vfx.title",
    stepKeys: ["tutorial.vfx.s1", "tutorial.vfx.s2", "tutorial.vfx.s3"]
  },
  {
    id: "export",
    titleKey: "tutorial.export.title",
    stepKeys: ["tutorial.export.s1", "tutorial.export.s2", "tutorial.export.s3"]
  }
];

/** Keyboard shortcuts, listed so they are discoverable without hunting. */
const SHORTCUTS: Array<{ keys: string; labelKey: TranslationKey }> = [
  { keys: "G", labelKey: "viewport.tool.move" },
  { keys: "R", labelKey: "viewport.tool.rotate" },
  { keys: "S", labelKey: "viewport.tool.scale" },
  { keys: "I", labelKey: "viewport.tool.keyframe" },
  { keys: "Esc", labelKey: "viewport.tool.select" }
];

export function TutorialSection() {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [openLesson, setOpenLesson] = useState<string | null>(LESSONS[0].id);

  return (
    <section className="tutorial-section">
      <h3><BookOpen size={15} /> {t("tutorial.title")}</h3>
      <p className="empty-note">{t("tutorial.intro")}</p>

      {LESSONS.map((lesson) => {
        const expanded = openLesson === lesson.id;
        return (
          <article key={lesson.id} className="tutorial-lesson">
            <button
              type="button"
              className="tutorial-lesson-toggle"
              aria-expanded={expanded}
              onClick={() => setOpenLesson(expanded ? null : lesson.id)}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {t(lesson.titleKey)}
            </button>
            {expanded ? (
              <ol className="tutorial-steps">
                {lesson.stepKeys.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ol>
            ) : null}
          </article>
        );
      })}

      <h4>{t("tutorial.shortcuts")}</h4>
      <ul className="tutorial-shortcuts">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.keys}>
            <kbd>{shortcut.keys}</kbd>
            <span>{t(shortcut.labelKey)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
