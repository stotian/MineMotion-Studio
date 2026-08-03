import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const ACTING_AND_MOTION_CAPTURE_PROGRAM = defineUltraProgram({
  "id": "acting-and-motion-capture",
  "arc": "acting",
  "program": "Acting and motion capture",
  "problem": "turning licensed reference footage into editable stylized performance with confidence and correction data",
  "fixture": "dialogue performance take",
  "inspiration": "Community mocap workflow plus MineMotion stylization",
  "strategy": "timeline",
  "sourceCore": "src/ultra/programs/ActingAndMotionCaptureEngine.ts",
  "maximumOperations": 11,
  "maximumResourceUnits": 10752,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 331,
      "title": "Webcam reference capture",
      "operatorId": "acting.and.motion.capture.webcam.reference.capture",
      "testId": "P331_WEBCAM_REFERENCE_CAPTURE_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Webcam reference capture typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for webcam reference capture"
      ]
    },
    {
      "phase": 332,
      "title": "Video reference sync",
      "operatorId": "acting.and.motion.capture.video.reference.sync",
      "testId": "P332_VIDEO_REFERENCE_SYNC_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Video reference sync typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for video reference sync"
      ]
    },
    {
      "phase": 333,
      "title": "Body pose solve",
      "operatorId": "acting.and.motion.capture.body.pose.solve",
      "testId": "P333_BODY_POSE_SOLVE_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Body pose solve typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for body pose solve"
      ]
    },
    {
      "phase": 334,
      "title": "Hand pose solve",
      "operatorId": "acting.and.motion.capture.hand.pose.solve",
      "testId": "P334_HAND_POSE_SOLVE_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Hand pose solve typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for hand pose solve"
      ]
    },
    {
      "phase": 335,
      "title": "Face solve",
      "operatorId": "acting.and.motion.capture.face.solve",
      "testId": "P335_FACE_SOLVE_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Face solve typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for face solve"
      ]
    },
    {
      "phase": 336,
      "title": "Lip sync",
      "operatorId": "acting.and.motion.capture.lip.sync",
      "testId": "P336_LIP_SYNC_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Lip sync typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for lip sync"
      ]
    },
    {
      "phase": 337,
      "title": "Eye blink synthesis",
      "operatorId": "acting.and.motion.capture.eye.blink.synthesis",
      "testId": "P337_EYE_BLINK_SYNTHESIS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Eye blink synthesis typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for eye blink synthesis"
      ]
    },
    {
      "phase": 338,
      "title": "Gaze targeting",
      "operatorId": "acting.and.motion.capture.gaze.targeting",
      "testId": "P338_GAZE_TARGETING_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Gaze targeting typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for gaze targeting"
      ]
    },
    {
      "phase": 339,
      "title": "Emotion beats",
      "operatorId": "acting.and.motion.capture.emotion.beats",
      "testId": "P339_EMOTION_BEATS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Emotion beats typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for emotion beats"
      ]
    },
    {
      "phase": 340,
      "title": "Gesture suggestions",
      "operatorId": "acting.and.motion.capture.gesture.suggestions",
      "testId": "P340_GESTURE_SUGGESTIONS_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Gesture suggestions typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for gesture suggestions"
      ]
    },
    {
      "phase": 341,
      "title": "Performance takes",
      "operatorId": "acting.and.motion.capture.performance.takes",
      "testId": "P341_PERFORMANCE_TAKES_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Performance takes typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for performance takes"
      ]
    },
    {
      "phase": 342,
      "title": "Mocap cleanup",
      "operatorId": "acting.and.motion.capture.mocap.cleanup",
      "testId": "P342_MOCAP_CLEANUP_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Mocap cleanup typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for mocap cleanup"
      ]
    },
    {
      "phase": 343,
      "title": "Contact correction",
      "operatorId": "acting.and.motion.capture.contact.correction",
      "testId": "P343_CONTACT_CORRECTION_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Contact correction typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for contact correction"
      ]
    },
    {
      "phase": 344,
      "title": "Retarget confidence",
      "operatorId": "acting.and.motion.capture.retarget.confidence",
      "testId": "P344_RETARGET_CONFIDENCE_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Retarget confidence typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for retarget confidence"
      ]
    },
    {
      "phase": 345,
      "title": "Acting continuity",
      "operatorId": "acting.and.motion.capture.acting.continuity",
      "testId": "P345_ACTING_CONTINUITY_ACCEPTANCE",
      "evidence": "visual",
      "deliverables": [
        "Acting continuity typed contract, reversible command and deterministic evaluator",
        "Acting and motion capture workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for acting continuity"
      ]
    }
  ]
});
