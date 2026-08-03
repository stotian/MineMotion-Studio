# Next-generation priority matrix

Scores use 1 (weak) to 5 (strong). Maintenance, security and risk are scored with 5 meaning easier/safer/lower risk. Weighted score: user value 25%, feasibility 20%, differentiation 15%, maintenance 10%, performance 10%, security 10%, risk 10%.

| Candidate | Value | Feasibility | Difference | Maintenance | Performance | Security | Risk | Weighted /5 | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Procedural Minecraft crowds | 4 | 5 | 4 | 4 | 4 | 5 | 4 | **4.35** | promoted experimentally |
| Physics/simulation authoring | 4 | 3 | 4 | 2 | 2 | 5 | 2 | 3.25 | defer until simulation core |
| AI assistance | 4 | 2 | 3 | 2 | 3 | 1 | 1 | 2.55 | defer: privacy, cost, nondeterminism |
| Mocap | 4 | 2 | 3 | 2 | 3 | 3 | 2 | 2.85 | defer until retargeting/import evidence |
| Collaboration | 4 | 1 | 3 | 1 | 3 | 1 | 1 | 2.20 | reject for stable-core roadmap |
| Advanced rendering backend | 3 | 2 | 4 | 2 | 2 | 4 | 2 | 2.75 | defer until WebGPU backend is real |
| Community marketplace | 3 | 2 | 3 | 1 | 4 | 2 | 1 | 2.35 | defer until moderation/signing exist |

Procedural crowds win because they reuse deterministic local scene/rig data, provide immediate cinematic value, require no service or personal data, and can be bounded to protect renderer budgets.
