# Phase 20.16 — WebGPU experimental policy

WebGPU capability detection is not renderer selection.

The versioned backend policy keeps the current production path explicit:

1. use WebGL2 when available;
2. otherwise use the existing WebGL fallback;
3. record WebGPU only as experimental evidence;
4. never silently select WebGPU;
5. fail honestly when WebGPU is present but no production WebGL backend exists.

A future WebGPU renderer must implement feature parity, deterministic fallback,
resource ownership, export compatibility, and benchmark acceptance before this
policy can select it.
