# Phase 16.7 - Screen And Cinematic VFX

Eight native screen/cinematic presets extend the built-in recipe catalog:
screen flash, camera shake, glitch, cinematic bars, bloom, vignette, freeze,
and color drain. Each evaluates through the shared prepared frame and consumes
the same resolved parameters in React viewport and Canvas export composition.

Freeze holds animation sampling while global VFX time continues and is bypassed
when final export excludes VFX. Shake uses deterministic frame/frequency input;
glitch uses deterministic slices; bars, bloom, vignette, flash, and color drain
honor all exposed parameters in both paths. Audio continues during freeze.

The 4,097-effect repair optimization remains lossless: the first legacy edit
enriches every effect, while later commands preserve validated unchanged native
objects and resynchronize only changed records.
