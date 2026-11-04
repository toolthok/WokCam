# WokCam v0.5 — recovery build

Tablet-first, local-first storyboard and motion preview. This build restores the dark application UI while keeping the light minimalist video canvas preset, and adds a separate reference-video workspace.

## Available
- Storyboard scenes, duration and scene properties.
- Text, card and circle elements with entrance/continuous motion controls.
- Canvas preview, playback speed, timeline, local save and JSON import/export.
- Separate reference video upload (not production footage).
- Six evenly sampled frames within a selected time range.
- Manual visual-DNA notes, local preset library and JSON export.
- Optional GitHub Contents API sync for `presets/reference-library.json`; token is not persisted.

## Run
Host on GitHub Pages or another static HTTPS host. `file://` is not supported for ES modules/service workers.

## Tablet flow
Choose a reference clip → set start/end → capture six frames → write observations → save/export preset → build storyboard scenes.

## GitHub
Use a fine-grained token scoped to the target repository with Contents read/write permission. Enter token only in the password field. Never share it in chat or commit it.

## Limitations
- Frame sampling depends on browser codec support; MP4/H.264 is the safest input.
- Six frames are samples only; no automatic AI visual interpretation.
- Presets store notes and timestamps, not video or frame image blobs.
- GitHub sync needs network and suitable token permission.
- This build is still a storyboard/motion preview; final MP4/WebM rendering is not implemented.
- v6 voice-over transcription/timestamp pipeline is not yet integrated into this v0.4-based editor.
