# Platform support

Targeted validation baselines are Windows 10 22H2 x64, macOS 13 on Apple Silicon and Intel, and Ubuntu 22.04 LTS x64 or compatible distributions. **No platform is currently claimed as supported** until its native artifact completes the full installer smoke matrix.

The source and CI pipelines target these systems. A successful compile alone is not a support claim. Results are recorded in `distribution/smoke-matrix.json`; only a complete result may change `supportClaimed` in `distribution/platform-support.json`.
