# A note on performance

ECHOES runs as a real-time 3D scene in the browser. That means the experience can feel different from one computer to another, even when everyone opens the same build.

A few things make a noticeable difference:

- **Graphics hardware and drivers.** The browser asks the computer's GPU to draw the planets, terrain, spacecraft, lighting, and effects. Integrated graphics and older GPUs may need to work at lower quality than a recent dedicated GPU.
- **Browser support.** WebGL performance and stability can vary between browsers and graphics-driver combinations.
- **Display settings.** A high-resolution screen or a high device-pixel ratio can mean many more pixels to render every frame.
- **What else is running.** Other tabs, background applications, power-saving mode, and heat can all affect available CPU/GPU time.
- **Network and hosting.** A slow connection or a busy host can make the first visit and streamed assets take longer to arrive. Once those assets are loaded, however, the frame rate is mainly a rendering and device issue; changing hosts does not automatically make the 3D scene run faster.

## What we can and cannot promise

We work on the parts that belong to us: scene complexity, texture sizes, loading strategy, rendering quality, and graceful fallbacks. ECHOES includes adaptive quality controls so it can reduce rendering cost when the device is struggling.

At the same time, we cannot promise a fixed frame rate on every computer or browser. A smooth result on one test machine is not a guarantee for every visitor, and a slow result on an older or heavily loaded device does not by itself tell us whether the cause is the application, the browser, or the hardware.

We do not want to use hardware as an excuse, either. If the scene is unnecessarily expensive, assets are too large, or a bug makes performance worse, that is ours to investigate and improve. If you run into a problem, the browser, device, graphics hardware, approximate screen resolution, and the part of the experience where it happens are useful details to include in a report.

## What our current measurements mean

The repository includes a machine-readable snapshot in [PERFORMANCE_BENCHMARKS.csv](../PERFORMANCE_BENCHMARKS.csv). It records results from a particular browser run, not a universal promise:

- The recorded machine reported an Intel HD Graphics 530 GPU and 16 GB of device memory.
- One solar-system sample recorded 49 FPS, with a 33.6 ms 95th-percentile frame time.
- A separate six-second sample recorded 60 FPS after the renderer had reduced its pixel ratio to 0.225.
- The same recorded release run reports 55 browser scenarios executed, one failed scenario, one console error, and no failed network requests.

Those numbers need context: they are snapshots from one setup and one run. The reduced pixel ratio in the second sample also means that the 60 FPS result should not be read as 60 FPS at native display resolution. We keep the raw figures visible so we do not turn a test result into a bigger claim than it supports.

Our goal is to make ECHOES as smooth and accessible as we can across a wide range of devices, while being honest about what we have actually tested.
