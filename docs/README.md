# WokCam v0.5 documentation

## Architecture
Static PWA; browser-side processing; local project persistence; GitHub optional for preset synchronization.

## Modules
- `src/app.js`: main storyboard app.
- `src/storyboard-engine.js`: scene data model.
- `src/composition-engine.js`: canvas renderer.
- `src/motion-engine.js`: motion calculations.
- `src/reference-studio.js`: isolated reference video input, frame sampling, notes, local preset storage and GitHub sync.

## Persistence
- Storyboard project: `aes_v04_project` in localStorage.
- Reference preset metadata: `wokcam_reference_presets_v1` in localStorage.
- GitHub PAT: held in the password input only; not written by app code to storage.
- Video/frame URLs are temporary object URLs. Source video is never uploaded automatically.

## Reference analysis
The user chooses a clip and time range. Six evenly spaced timestamps are sought using the HTML video element. Canvas extracts JPEG previews. Notes capture composition, typography, palette, pacing, transitions and motion. This is manual analysis, not AI recognition.

## GitHub sync
Contents API file: `presets/reference-library.json`. Push reads current SHA before PUT; pull merges by preset ID. Token needs repository Contents permission.

## Known limitations
No AI interpretation, no final video renderer, and no v6 ASR integration in this build. Codec compatibility depends on Android Chrome.
