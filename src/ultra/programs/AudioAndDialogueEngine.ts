import { defineUltraProgram } from "./UltraProgramRuntimeEngine";

export const AUDIO_AND_DIALOGUE_PROGRAM = defineUltraProgram({
  "id": "audio-and-dialogue",
  "arc": "audio",
  "program": "Audio and dialogue",
  "problem": "editing synchronized dialogue, ambience and effects with clear loudness and delivery controls",
  "fixture": "dialogue-heavy cinematic scene",
  "inspiration": "Blender/NLE audio patterns plus MineMotion handoff",
  "strategy": "timeline",
  "sourceCore": "src/ultra/programs/AudioAndDialogueEngine.ts",
  "maximumOperations": 11,
  "maximumResourceUnits": 13312,
  "maximumSelection": 4096,
  "supportsPreview": true,
  "requiresConfirmation": false,
  "phases": [
    {
      "phase": 406,
      "title": "Audio waveform cache",
      "operatorId": "audio.and.dialogue.audio.waveform.cache",
      "testId": "P406_AUDIO_WAVEFORM_CACHE_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Audio waveform cache typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for audio waveform cache"
      ]
    },
    {
      "phase": 407,
      "title": "Multitrack mixer",
      "operatorId": "audio.and.dialogue.multitrack.mixer",
      "testId": "P407_MULTITRACK_MIXER_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Multitrack mixer typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for multitrack mixer"
      ]
    },
    {
      "phase": 408,
      "title": "Clip gain envelopes",
      "operatorId": "audio.and.dialogue.clip.gain.envelopes",
      "testId": "P408_CLIP_GAIN_ENVELOPES_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Clip gain envelopes typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for clip gain envelopes"
      ]
    },
    {
      "phase": 409,
      "title": "Spatial audio",
      "operatorId": "audio.and.dialogue.spatial.audio",
      "testId": "P409_SPATIAL_AUDIO_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Spatial audio typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for spatial audio"
      ]
    },
    {
      "phase": 410,
      "title": "Doppler preview",
      "operatorId": "audio.and.dialogue.doppler.preview",
      "testId": "P410_DOPPLER_PREVIEW_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Doppler preview typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for doppler preview"
      ]
    },
    {
      "phase": 411,
      "title": "Reverb zones",
      "operatorId": "audio.and.dialogue.reverb.zones",
      "testId": "P411_REVERB_ZONES_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Reverb zones typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for reverb zones"
      ]
    },
    {
      "phase": 412,
      "title": "Noise cleanup notes",
      "operatorId": "audio.and.dialogue.noise.cleanup.notes",
      "testId": "P412_NOISE_CLEANUP_NOTES_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Noise cleanup notes typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for noise cleanup notes"
      ]
    },
    {
      "phase": 413,
      "title": "Dialogue take management",
      "operatorId": "audio.and.dialogue.dialogue.take.management",
      "testId": "P413_DIALOGUE_TAKE_MANAGEMENT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Dialogue take management typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for dialogue take management"
      ]
    },
    {
      "phase": 414,
      "title": "Automatic silence detection",
      "operatorId": "audio.and.dialogue.automatic.silence.detection",
      "testId": "P414_AUTOMATIC_SILENCE_DETECTION_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Automatic silence detection typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for automatic silence detection"
      ]
    },
    {
      "phase": 415,
      "title": "Transcript import",
      "operatorId": "audio.and.dialogue.transcript.import",
      "testId": "P415_TRANSCRIPT_IMPORT_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Transcript import typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for transcript import"
      ]
    },
    {
      "phase": 416,
      "title": "Subtitle authoring",
      "operatorId": "audio.and.dialogue.subtitle.authoring",
      "testId": "P416_SUBTITLE_AUTHORING_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Subtitle authoring typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for subtitle authoring"
      ]
    },
    {
      "phase": 417,
      "title": "Phoneme markers",
      "operatorId": "audio.and.dialogue.phoneme.markers",
      "testId": "P417_PHONEME_MARKERS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Phoneme markers typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for phoneme markers"
      ]
    },
    {
      "phase": 418,
      "title": "Audio ducking",
      "operatorId": "audio.and.dialogue.audio.ducking",
      "testId": "P418_AUDIO_DUCKING_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Audio ducking typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for audio ducking"
      ]
    },
    {
      "phase": 419,
      "title": "Loudness validation",
      "operatorId": "audio.and.dialogue.loudness.validation",
      "testId": "P419_LOUDNESS_VALIDATION_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Loudness validation typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for loudness validation"
      ]
    },
    {
      "phase": 420,
      "title": "Audio export stems",
      "operatorId": "audio.and.dialogue.audio.export.stems",
      "testId": "P420_AUDIO_EXPORT_STEMS_ACCEPTANCE",
      "evidence": "interoperability",
      "deliverables": [
        "Audio export stems typed contract, reversible command and deterministic evaluator",
        "Audio and dialogue workspace integration with search, shortcuts and context guidance",
        "Diagnostics, resource budget, fallback behavior and migration coverage for audio export stems"
      ]
    }
  ]
});
