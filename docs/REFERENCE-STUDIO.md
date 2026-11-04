# Reference Studio

The reference input is separate from production footage. It samples six frames across a user-selected time range, displays temporary previews, and stores a text-based visual DNA preset.

Preset fields: schemaVersion, id, name, sourceVideo, segment.start/end, notes, frames[index/time], createdAt.

Frame images and source video are not stored in the preset. Token handling is page-memory only; do not store the token in project files. Recommended video input: MP4/H.264 for broad Android Chrome compatibility.
