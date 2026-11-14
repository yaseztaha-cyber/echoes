# ECHOES Spatial Audio Implementation

## Audio Engine Architecture

### Core System
- Centralized audio manager in `src/lib/audio.ts`
- Uses Web Audio API (AudioContext, GainNode, PannerNode, BiquadFilter)
- No external audio libraries or frameworks
- All sounds generated programmatically (oscillators, noise buffers) — no downloaded audio files
- Spatial audio via HRTF panning model with inverse distance attenuation

### Audio Graph
```
AudioContext
  └── masterGain (global mute/volume)
       ├── envGain (environmental effects, default 0.3)
       ├── mechGain (mechanical sounds, default 0.4)
       ├── commGain (communications, default 0.6)
       └── uiGain (interface feedback, default 0.25)
```

### Spatial Audio
- `createSpatialPanner(x, y, z, maxDistance)` — creates a PannerNode with HRTF panning
- `updateListenerPosition(x, y, z, fx, fy, fz)` — updates AudioListener position (camera)
- Distance attenuation: inverse model, refDistance=5, rolloff=1.5

### Browser Autoplay Handling
- Audio context initialized on first user gesture (unlockAudio)
- If suspended, context is resumed
- If audio unavailable, application continues without sound
- Audio settings panel allows manual enable/disable

## Audio Asset Inventory

All sounds are generated programmatically. No downloaded audio files.

| ID | Name | Category | Source | Authentic | Description |
|---|---|---|---|---|---|
| ui-select | UI Select | INTERFACE | generated | No | Subtle triangle tone (880Hz, 0.07s) |
| ui-open | UI Open | INTERFACE | generated | No | Rising sine tone (300→520Hz) |
| ui-close | UI Close | INTERFACE | generated | No | Falling sine tone (520→300Hz) |
| ui-confirm | UI Confirm | INTERFACE | generated | No | Two-tone confirmation (660+990Hz) |
| ui-data | UI Data | INTERFACE | generated | No | Square wave data blip |
| ui-event | UI Event | INTERFACE | generated | No | Sine tone (440→330Hz) |
| ui-source | UI Source | INTERFACE | generated | No | Triangle tone (740→980Hz) |
| ui-shutter | UI Shutter | INTERFACE | generated | No | Square wave shutter click |
| mars-wind-subtle | Mars Wind (subtle) | ENVIRONMENT | generated | No | Low-pass filtered noise — labelled as ECHOES interpretation |
| rover-wheel | Rover Wheel | MECHANICAL | generated | No | Brief noise burst |
| rover-arm | Rover Arm | MECHANICAL | generated | No | Sawtooth sweep |
| instrument-activate | Instrument Activate | INSTRUMENT | generated | No | Sine tone (1000→1400Hz) |
| launch-ignition | Launch Ignition | LAUNCH | generated | No | Low-frequency rumble + noise |
| comm-beep | Communication Beep | COMMUNICATION | generated | No | Square wave beep |
| comm-static | Communication Static | COMMUNICATION | generated | No | Filtered noise for radio static |

## Authentic vs Reconstructed Sounds

**All sounds in the current implementation are generated (synthesized).**

No authentic NASA recordings have been integrated. This is because:
- The application has no network access to download audio files
- All sounds are procedurally generated using Web Audio API

**Authenticity classification:**
- Interface sounds: Generated (not authentic)
- Environment sounds: Generated (not authentic — labelled as ECHOES interpretation)
- Mechanical sounds: Generated (not authentic — labelled as ECHOES interpretation)
- Launch sounds: Generated (not authentic — labelled as ECHOES interpretation)
- Communication sounds: Generated (not authentic — labelled as ECHOES interpretation)

**Historical audio recordings:** None integrated. The system is designed to support them (commGain channel, AUDIO_ASSET_MANIFEST structure) but no actual NASA audio files have been downloaded or attributed.

## Environment Profiles

| Environment | Ambient | Wind | Mechanical | Comm | Notes |
|---|---|---|---|---|---|
| Space | No | No | No | Yes | Silence by default — space is silent |
| Moon | No | No | Yes | Yes | No atmospheric wind — Moon has no atmosphere |
| Mars | No | Yes (subtle) | Yes | Yes | Wind is ECHOES interpretation, not real recording |
| Earth | Yes | Yes | Yes | Yes | Appropriate natural ambience |
| Venus | No | No | Yes | Yes | No atmospheric wind simulation |
| Gas Giant | No | No | No | Yes | Silence for gas giants |

## Hardware Sound Profiles

| Hardware | Sounds | Trigger |
|---|---|---|
| Rover (MER) | Wheel movement, arm movement, instrument activation | On inspection, on interaction |
| Lander (InSight) | Deployment, instrument activation | On inspection |
| Apollo LM | Equipment handling, communication | On inspection |
| Voyager | Interior electronics, communication | On inspection |

## Mission-Stage Triggers

Sound events are triggered by:
- Chapter navigation (prev/next/play/pause)
- UI interactions (select, open, close, confirm)
- Instrument selection and activation
- Journey open/close
- Media viewing

## Audio Settings

- Global mute toggle
- Master volume (0-1)
- Environment volume (0-1, default 0.3)
- Mechanical volume (0-1, default 0.4)
- Communication volume (0-1, default 0.6)
- UI volume (0-1, default 0.25)
- No music volume channel (music is not part of this feature)

## Browser Compatibility

- Uses Web Audio API (AudioContext, GainNode, PannerNode, BiquadFilter)
- Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- Autoplay policy: Audio context initialized on first user gesture
- Graceful degradation: Application works normally with audio disabled

## Tests

No automated audio tests implemented. Audio testing requires browser interaction and manual verification.

## Remaining Limitations

1. No authentic NASA audio recordings integrated (no network access to download)
2. No spatial audio wired to 3D camera position (listener position not updated)
3. No historical communication recordings
4. No per-mission sound profiles (all use same generated sounds)
5. No audio loading/caching system (all sounds generated on demand)
6. No reduced-audio mode beyond mute toggle
7. No audio visualization or waveform display
8. Environment sounds are triggered manually, not automatically by scene state
