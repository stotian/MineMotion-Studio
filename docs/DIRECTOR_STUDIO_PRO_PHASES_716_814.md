# MineMotion Studio — real Studio Pro phases 716–814

This registry lists only distinct implemented operations with an existing source owner and a unique acceptance ID executed by `npm run verify:director`.

Current gate: **214 total real Director phases (601–814), 603 assertions**.

| Phase | Functional capability | Source owner | Acceptance ID |
|---:|---|---|---|
| 716 | Cinema camera profile: Ultra-wide 14 mm | `src/production/director/ProfessionalCamera.ts` | `director-camera-profile-ultra-wide-14` |
| 717 | Cinema camera profile: Establishing 18 mm | `src/production/director/ProfessionalCamera.ts` | `director-camera-profile-establishing-18` |
| 718 | Cinema camera profile: Wide 24 mm | `src/production/director/ProfessionalCamera.ts` | `director-camera-profile-wide-24` |
| 719 | Cinema camera profile: Documentary 28 mm | `src/production/director/ProfessionalCamera.ts` | `director-camera-profile-documentary-28` |
| 720 | Cinema camera profile: Natural 35 mm | `src/production/director/ProfessionalCamera.ts` | `director-camera-profile-natural-35` |
| 721 | Cinema camera profile: Standard 50 mm | `src/production/director/ProfessionalCamera.ts` | `director-camera-profile-standard-50` |
| 722 | Cinema camera profile: Portrait 85 mm | `src/production/director/ProfessionalCamera.ts` | `director-camera-profile-portrait-85` |
| 723 | Cinema camera profile: Telephoto 135 mm | `src/production/director/ProfessionalCamera.ts` | `director-camera-profile-telephoto-135` |
| 724 | Cinema camera profile: Action shutter 32 mm | `src/production/director/ProfessionalCamera.ts` | `director-camera-profile-action-32` |
| 725 | Cinema camera profile: Dream portrait 58 mm | `src/production/director/ProfessionalCamera.ts` | `director-camera-profile-dream-58` |
| 726 | Professional camera move: dolly-in | `src/production/director/ProfessionalCamera.ts` | `director-camera-move-dolly-in` |
| 727 | Professional camera move: dolly-out | `src/production/director/ProfessionalCamera.ts` | `director-camera-move-dolly-out` |
| 728 | Professional camera move: truck-left | `src/production/director/ProfessionalCamera.ts` | `director-camera-move-truck-left` |
| 729 | Professional camera move: truck-right | `src/production/director/ProfessionalCamera.ts` | `director-camera-move-truck-right` |
| 730 | Professional camera move: crane-up | `src/production/director/ProfessionalCamera.ts` | `director-camera-move-crane-up` |
| 731 | Professional camera move: orbit-clockwise | `src/production/director/ProfessionalCamera.ts` | `director-camera-move-orbit-clockwise` |
| 732 | Persistent subject focus target | `src/production/director/ProfessionalCamera.ts` | `director-camera-focus-target` |
| 733 | Automatic multi-subject framing | `src/production/director/ProfessionalCamera.ts` | `director-camera-auto-frame` |
| 734 | Animated subject tracking | `src/production/director/ProfessionalCamera.ts` | `director-camera-subject-tracking` |
| 735 | Shot horizon stabilization | `src/production/director/ProfessionalCamera.ts` | `director-camera-horizon-stabilize` |
| 736 | Half-star take rating | `src/production/director/TakeReview.ts` | `director-take-rate` |
| 737 | Favorite take toggle | `src/production/director/TakeReview.ts` | `director-take-favorite` |
| 738 | Reject take with reason | `src/production/director/TakeReview.ts` | `director-take-reject` |
| 739 | Restore rejected take | `src/production/director/TakeReview.ts` | `director-take-restore` |
| 740 | Approve and activate take | `src/production/director/TakeReview.ts` | `director-take-approve` |
| 741 | Choose highest-rated take | `src/production/director/TakeReview.ts` | `director-take-choose-best` |
| 742 | Persistent take review notes | `src/production/director/TakeReview.ts` | `director-take-note` |
| 743 | Add normalized review tag | `src/production/director/TakeReview.ts` | `director-take-tag-add` |
| 744 | Remove review tag | `src/production/director/TakeReview.ts` | `director-take-tag-remove` |
| 745 | Increment take revision | `src/production/director/TakeReview.ts` | `director-take-revision` |
| 746 | Normalize take naming | `src/production/director/TakeReview.ts` | `director-take-normalize-names` |
| 747 | Structured take comparison | `src/production/director/TakeReview.ts` | `director-take-compare` |
| 748 | Sort shots chronologically | `src/production/director/ShotBatchTools.ts` | `director-batch-sort` |
| 749 | Sequential shot renaming | `src/production/director/ShotBatchTools.ts` | `director-batch-rename` |
| 750 | Normalize shot output paths | `src/production/director/ShotBatchTools.ts` | `director-batch-output` |
| 751 | Apply render handles | `src/production/director/ShotBatchTools.ts` | `director-batch-handles` |
| 752 | Batch shot status | `src/production/director/ShotBatchTools.ts` | `director-batch-status` |
| 753 | Batch render passes | `src/production/director/ShotBatchTools.ts` | `director-batch-passes` |
| 754 | Enable only approved takes | `src/production/director/ShotBatchTools.ts` | `director-batch-approved-only` |
| 755 | Trim timeline to active shots | `src/production/director/ShotBatchTools.ts` | `director-batch-trim-timeline` |
| 756 | Rendered studio lighting rig: three-point | `src/production/director/StudioLightingRigs.ts` | `director-lighting-three-point` |
| 757 | Rendered studio lighting rig: moonlight | `src/production/director/StudioLightingRigs.ts` | `director-lighting-moonlight` |
| 758 | Rendered studio lighting rig: torch-circle | `src/production/director/StudioLightingRigs.ts` | `director-lighting-torch-circle` |
| 759 | Rendered studio lighting rig: portal-glow | `src/production/director/StudioLightingRigs.ts` | `director-lighting-portal-glow` |
| 760 | Rendered studio lighting rig: boss-reveal | `src/production/director/StudioLightingRigs.ts` | `director-lighting-boss-reveal` |
| 761 | Rendered studio lighting rig: silhouette | `src/production/director/StudioLightingRigs.ts` | `director-lighting-silhouette` |
| 762 | Rendered studio lighting rig: interior-window | `src/production/director/StudioLightingRigs.ts` | `director-lighting-interior-window` |
| 763 | Rendered studio lighting rig: arena | `src/production/director/StudioLightingRigs.ts` | `director-lighting-arena` |
| 764 | Remove generated studio lighting | `src/production/director/StudioLightingRigs.ts` | `director-lighting-remove` |
| 765 | Animation polish: breathing | `src/production/director/AnimationPolish.ts` | `director-polish-breathing` |
| 766 | Animation polish: weight-shift | `src/production/director/AnimationPolish.ts` | `director-polish-weight-shift` |
| 767 | Animation polish: look-left | `src/production/director/AnimationPolish.ts` | `director-polish-look-left` |
| 768 | Animation polish: look-right | `src/production/director/AnimationPolish.ts` | `director-polish-look-right` |
| 769 | Animation polish: anticipation | `src/production/director/AnimationPolish.ts` | `director-polish-anticipation` |
| 770 | Animation polish: follow-through | `src/production/director/AnimationPolish.ts` | `director-polish-follow-through` |
| 771 | Animation polish: recoil | `src/production/director/AnimationPolish.ts` | `director-polish-recoil` |
| 772 | Animation polish: settle | `src/production/director/AnimationPolish.ts` | `director-polish-settle` |
| 773 | Sequence continuity analysis | `src/production/director/ContinuityDirector.ts` | `director-continuity-analyze` |
| 774 | Repair 180-degree axis crossing | `src/production/director/ContinuityDirector.ts` | `director-continuity-repair-axis` |
| 775 | Normalize sequence lens continuity | `src/production/director/ContinuityDirector.ts` | `director-continuity-normalize-lens` |
| 776 | Align dialogue eyelines | `src/production/director/ContinuityDirector.ts` | `director-continuity-eyelines` |
| 777 | Mark intentional axis crossing | `src/production/director/ContinuityDirector.ts` | `director-continuity-mark-intentional` |
| 778 | Preview render plan for approved shots | `src/production/director/StudioRenderPipeline.ts` | `director-render-plan-preview` |
| 779 | Final image-sequence render plan | `src/production/director/StudioRenderPipeline.ts` | `director-render-plan-final` |
| 780 | Multilayer compositing render plan | `src/production/director/StudioRenderPipeline.ts` | `director-render-plan-compositing` |
| 781 | Deduplicated studio render enqueue | `src/production/director/StudioRenderPipeline.ts` | `director-render-enqueue-plan` |
| 782 | Render queue duplicate removal | `src/production/director/StudioRenderPipeline.ts` | `director-render-deduplicate` |
| 783 | Shot-ordered production render queue | `src/production/director/StudioRenderPipeline.ts` | `director-render-sort` |
| 784 | Active-shot queue prioritization | `src/production/director/StudioRenderPipeline.ts` | `director-render-prioritize-active` |
| 785 | Production render workload estimate | `src/production/director/StudioRenderPipeline.ts` | `director-render-estimate` |
| 786 | Render queue manifest export | `src/production/director/StudioRenderPipeline.ts` | `director-render-manifest` |
| 787 | Retry failed production renders | `src/production/director/StudioRenderPipeline.ts` | `director-render-retry-failed` |
| 788 | Cancel queued production renders | `src/production/director/StudioRenderPipeline.ts` | `director-render-cancel-queued` |
| 789 | Remove stale shot revisions from queue | `src/production/director/StudioRenderPipeline.ts` | `director-render-remove-stale` |
| 790 | One-step studio render queue action | `src/production/director/StudioRenderPipeline.ts` | `director-render-queue-action` |
| 791 | Synchronize queued jobs to edited shots | `src/production/director/StudioRenderPipeline.ts` | `director-render-sync-shots` |
| 792 | Holistic studio quality report | `src/production/director/StudioQualityControl.ts` | `director-quality-overall` |
| 793 | Per-shot camera quality evaluation | `src/production/director/StudioQualityControl.ts` | `director-quality-camera` |
| 794 | Take approval and review quality evaluation | `src/production/director/StudioQualityControl.ts` | `director-quality-takes` |
| 795 | Rendered lighting quality evaluation | `src/production/director/StudioQualityControl.ts` | `director-quality-lighting` |
| 796 | Sequence continuity quality evaluation | `src/production/director/StudioQualityControl.ts` | `director-quality-continuity` |
| 797 | Timeline audio quality evaluation | `src/production/director/StudioQualityControl.ts` | `director-quality-audio` |
| 798 | Shot render readiness evaluation | `src/production/director/StudioQualityControl.ts` | `director-quality-render` |
| 799 | Per-shot readiness scoring | `src/production/director/StudioQualityControl.ts` | `director-quality-shot-readiness` |
| 800 | Focus the lowest-quality shot | `src/production/director/StudioQualityControl.ts` | `director-quality-select-worst` |
| 801 | One-click studio quality auto-polish | `src/production/director/StudioQualityControl.ts` | `director-quality-auto-polish` |
| 802 | Promote quality-approved shots to ready | `src/production/director/StudioQualityControl.ts` | `director-quality-mark-ready` |
| 803 | Studio quality Markdown report export | `src/production/director/StudioQualityControl.ts` | `director-quality-export` |
| 804 | Capture non-destructive shot creative variant | `src/production/director/ShotCreativeVariants.ts` | `director-variant-capture` |
| 805 | Recapture an existing shot creative variant | `src/production/director/ShotCreativeVariants.ts` | `director-variant-update` |
| 806 | Apply camera, lighting and post variant | `src/production/director/ShotCreativeVariants.ts` | `director-variant-apply` |
| 807 | Duplicate a shot creative variant | `src/production/director/ShotCreativeVariants.ts` | `director-variant-duplicate` |
| 808 | Rename a shot creative variant | `src/production/director/ShotCreativeVariants.ts` | `director-variant-rename` |
| 809 | Annotate a shot creative variant | `src/production/director/ShotCreativeVariants.ts` | `director-variant-annotate` |
| 810 | Rate a shot creative variant | `src/production/director/ShotCreativeVariants.ts` | `director-variant-rate` |
| 811 | Apply highest-rated shot variant | `src/production/director/ShotCreativeVariants.ts` | `director-variant-choose-best` |
| 812 | Compare shot creative variants | `src/production/director/ShotCreativeVariants.ts` | `director-variant-compare` |
| 813 | Delete a shot creative variant | `src/production/director/ShotCreativeVariants.ts` | `director-variant-delete` |
| 814 | Export shot creative variant manifest | `src/production/director/ShotCreativeVariants.ts` | `director-variant-manifest` |

## Evidence boundary

These entries have source-level acceptance coverage. Full Vite/Tauri builds, interactive viewport review, WebGL/GPU profiling, native codec validation and rendered-film proof remain separate release evidence gates.
