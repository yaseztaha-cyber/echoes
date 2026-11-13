import * as THREE from 'three';
import type { Chapter, QualityProfile, SceneDef } from '../data/types';
import { SCENES } from '../data/scenes';
import { QUALITY, detectQuality } from '../core/quality';
import { CameraController } from './CameraController';
import { SurfaceWorld } from './SurfaceWorld';
import { LaunchWorld } from './LaunchWorld';
import { SpaceWorld } from './SpaceWorld';
import type { World } from './World';

export interface ProjectedMarker { label: string; sub?: string; x: number; y: number; visible: boolean }

/**
 * Owns the renderer, a PRIVATE THREE.Scene and the active World. Nothing is added to any host scene graph,
 * and every GPU resource it creates is released in dispose().
 */
export class SceneController {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: CameraController;
  private world?: World;
  private def?: SceneDef;
  private quality: QualityProfile;
  private qualityId: 'low' | 'medium' | 'high';
  private ro: ResizeObserver;
  private w = 1; private h = 1;
  private v = new THREE.Vector3();
  currentSceneId = '';
  get currentSceneDef() { return this.def; }
  onMarkers?: (m: ProjectedMarker[]) => void;
  contextLost = false;

  constructor(private container: HTMLElement, initial: 'auto' | 'low' | 'medium' | 'high') {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;outline:none';
    canvas.tabIndex = 0;
    container.appendChild(canvas);
    // probe the GPU first for the adaptive default
    const probe = canvas.getContext('webgl2') || canvas.getContext('webgl');
    this.qualityId = initial === 'auto' ? detectQuality(probe) : initial;
    this.quality = QUALITY[this.qualityId];
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.quality.antialias, powerPreference: 'high-performance', alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = this.quality.shadows; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.contextLost = true; });
    canvas.addEventListener('webglcontextrestored', () => { this.contextLost = false; });
    this.camera = new CameraController(canvas);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
  }

  get qualityProfile() { return this.quality; }
  get qualityLevel() { return this.qualityId; }
  get info() { return { calls: this.renderer.info.render.calls, tris: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries, textures: this.renderer.info.memory.textures }; }

  resize() {
    const r = this.container.getBoundingClientRect();
    this.w = Math.max(2, Math.floor(r.width)); this.h = Math.max(2, Math.floor(r.height));
    // 1080p-first: never render more than 1920×1080 backing pixels
    let dpr = Math.min(window.devicePixelRatio || 1, this.quality.pixelRatioCap);
    if (this.w * dpr > 1920) dpr = 1920 / this.w;
    this.renderer.setPixelRatio(Math.max(0.5, dpr));
    this.renderer.setSize(this.w, this.h, false);
    this.camera.resize(this.w, this.h);
  }

  private build(def: SceneDef, chapter: Chapter): World {
    switch (def.kind) {
      case 'launch': return new LaunchWorld(this.quality, chapter.duration);
      case 'cruise': return new SpaceWorld('cruise', this.quality);
      case 'approach': return new SpaceWorld('approach', this.quality);
      default: return new SurfaceWorld(def, this.quality, chapter.duration);
    }
  }

  /** Build (or rebuild) the world for a chapter's scene. Previous world's GPU resources are disposed first. */
  async loadScene(chapter: Chapter, force = false) {
    if (!force && this.currentSceneId === chapter.sceneId && this.world) return;
    const def = SCENES[chapter.sceneId];
    this.disposeWorld();
    await new Promise((r) => setTimeout(r, 16)); // let the curtain paint before the heavy build
    this.def = def; this.currentSceneId = chapter.sceneId;
    this.world = this.build(def, chapter);
    this.world.apply(this.scene);
    this.scene.add(this.world.group);
    this.camera.setFree(false);
    this.world.update(0, 0, this.camera.camera.position);
  }

  private disposeWorld() {
    if (!this.world) return;
    this.scene.remove(this.world.group);
    this.world.dispose(); this.world = undefined;
    this.scene.fog = null;
  }

  async setQuality(id: 'low' | 'medium' | 'high', chapter: Chapter) {
    if (id === this.qualityId) return;
    this.qualityId = id; this.quality = QUALITY[id];
    this.renderer.shadowMap.enabled = this.quality.shadows;
    this.renderer.shadowMap.needsUpdate = true;
    this.resize();
    await this.loadScene(chapter, true);
  }

  setInteractive(v: boolean) { this.camera.setInteractive(v); }
  enterFree() { if (this.world) this.camera.setFree(true, this.world); }
  resumeCinematic() { this.camera.setFree(false); }
  setFrameShift(f: number) { this.camera.setFrameShift(f); }

  render(t: number, dt: number) {
    if (!this.world || !this.def || this.contextLost) return;
    this.camera.update(this.def, this.world, t, dt);
    this.world.update(t, dt, this.camera.camera.position);
    this.renderer.render(this.scene, this.camera.camera);
    if (this.onMarkers) {
      const out: ProjectedMarker[] = [];
      for (const m of this.world.markers) {
        this.v.copy(m.world).project(this.camera.camera);
        const visible = t >= m.showAt && this.v.z < 1 && Math.abs(this.v.x) < 0.95 && Math.abs(this.v.y) < 0.9;
        out.push({ label: m.label, sub: m.sub, x: (this.v.x * 0.5 + 0.5) * this.w, y: (-this.v.y * 0.5 + 0.5) * this.h, visible });
      }
      this.onMarkers(out);
    }
  }

  dispose() {
    this.ro.disconnect();
    this.disposeWorld();
    this.camera.dispose();
    const canvas = this.renderer.domElement;
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }
}
