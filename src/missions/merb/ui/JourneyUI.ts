import { CHAPTERS, TOTAL_DURATION } from '../data/chapters';
import { kindLabel } from '../data/media';
import type { Chapter, MediaEntry, Plate } from '../data/types';
import type { JourneyController } from '../core/JourneyController';
import { CSS } from './styles';

const ICON = {
  play: '<svg viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z"/></svg>',
  pause: '<svg viewBox="0 0 16 16"><path d="M3 2h3.5v12H3zM9.5 2H13v12H9.5z"/></svg>',
  prev: '<svg viewBox="0 0 16 16"><path d="M3 2h2v12H3zM14 2v12L6 8z"/></svg>',
  next: '<svg viewBox="0 0 16 16"><path d="M11 2h2v12h-2zM2 2l8 6-8 6z"/></svg>',
  replay: '<svg viewBox="0 0 16 16"><path d="M8 2.5a5.5 5.5 0 1 1-5.2 7.3l1.5-.5A4 4 0 1 0 5.2 5.4L7 7H2V2l1.6 1.6A5.5 5.5 0 0 1 8 2.5z"/></svg>',
};
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const fmtDate = (iso: string) => { const d = new Date(iso + 'T12:00:00Z'); return isNaN(+d) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }); };

interface PlateView { idx: number; plate: Plate; node: HTMLElement; video?: HTMLVideoElement; entry: MediaEntry; shown: boolean; removing?: boolean }

/** The documentary interface layer: editorial type, plates, ruler, inspector. Pure DOM, no framework. */
export class JourneyUI {
  private root: HTMLElement; private ui: HTMLElement; private style: HTMLStyleElement;
  private q = <T extends HTMLElement>(s: string) => this.root.querySelector(s) as T;
  private plates = new Map<number, PlateView>();
  private videos = new Map<number, HTMLVideoElement>();
  private narrIdx = -1; private lastChapterId = '';
  private segs: HTMLElement[] = []; private fills: HTMLElement[] = [];
  private lbVideo?: HTMLVideoElement; private lbWasPlaying = false;
  private unsub: Array<() => void> = []; private timers: number[] = [];
  private drawerManual: boolean | null = null;
  private toastT = 0; private markerEls: HTMLElement[] = [];
  private keyHandler: (e: KeyboardEvent) => void;

  constructor(private host: HTMLElement, private c: JourneyController, showIntro: boolean) {
    this.style = document.createElement('style'); this.style.textContent = CSS; this.style.dataset.merb = '1'; document.head.appendChild(this.style);
    this.root = host;
    host.classList.add('merb'); host.tabIndex = 0;
    this.ui = el('div', 'ui'); host.appendChild(this.ui);
    this.build(showIntro);
    this.bind();
    this.keyHandler = (e) => this.onKey(e);
    host.addEventListener('keydown', this.keyHandler);
    host.addEventListener('pointerdown', () => host.focus({ preventScroll: true }), true);
    c.audio.onChange = () => this.syncControls();
    c.scene.onMarkers = (m) => this.updateMarkers(m);
    c.scene.camera.onFreeChange = (f) => host.classList.toggle('has-hint', !f && c.mode === 'interactive');
  }

  /* -------------------------------- construction -------------------------------- */
  private build(showIntro: boolean) {
    const u = this.ui;
    u.innerHTML = `
      <div class="shade"></div>
      <header class="top"><div class="brand hit"><b>Opportunity · MER-B</b><span>Mars Exploration Rover · 2003 – 2019</span></div>
        <div class="tools hit">
          <div class="seg2"><button class="chip" data-mode="cinematic">Cinematic</button><button class="chip" data-mode="interactive">Interactive</button></div>
          <button class="chip" data-act="index">Chapters</button>
          <button class="chip" data-act="drawer">Inspect</button>
          <button class="chip" data-act="sound" aria-label="Toggle archival audio">Sound on</button>
          <button class="chip" data-act="quality" title="Render quality (adaptive)">Auto</button>
          <button class="chip" data-act="fs" aria-label="Fullscreen">⛶</button>
        </div></header>
      <div class="markers"></div>
      <div class="lower"><div class="title"><div class="no"><i></i><span class="label no-t"></span></div><div class="date"></div><h1 class="serif"></h1></div>
      <div class="narr serif"></div>
      <div class="prov"></div></div>
      <ul class="facts"></ul>
      <div class="plates"></div>
      <div class="free-hint">Drag to orbit · scroll to zoom · rover keeps moving</div>
      <aside class="drawer"></aside>
      <footer class="bar hit">
        <div class="transport">
          <button class="small" data-act="prev" aria-label="Previous chapter">${ICON.prev}</button>
          <button class="round" data-act="play" aria-label="Play or pause">${ICON.play}</button>
          <button class="small" data-act="next" aria-label="Next chapter">${ICON.next}</button>
          <button class="small" data-act="replay" aria-label="Replay chapter">${ICON.replay}</button>
          <div class="clock"></div>
        </div>
        <div class="ruler"></div><div class="tip"></div>
      </footer>
      <div class="ov index"><button class="close" data-act="closeov">Close</button><div class="label">Eighteen chapters · one rover</div><ol></ol></div>
      <div class="ov lb"><button class="close" data-act="closeov">Close</button><div class="lbm"></div><div class="cap"></div></div>
      <div class="ov intro ${showIntro ? 'open' : ''}"><div class="label" style="color:#d9733f">NASA · JPL · Mars Exploration Rover B</div><h2 class="serif">Opportunity</h2>
        <p class="serif">From a night launch at Cape Canaveral to a dust storm in Perseverance Valley — a 90-sol mission that lasted 5,111 sols. Real NASA photographs and archival video, set in a reconstructed 3D Mars.</p>
        <div class="row"><button class="btn pri" data-act="startCine">▶ &nbsp;Play the journey</button><button class="btn" data-act="startInter">Explore the timeline</button></div>
        <small>3D scenes are reconstructions and are labelled as such. Archival audio only — no music. Mars scenes are silent: Opportunity carried no microphone.</small></div>
      <div class="ov end"><div class="label" style="color:#d9733f">February 13, 2019</div><h2 class="serif">Opportunity remains on Mars.</h2>
        <p class="serif">A 90-sol mission became 5,111 sols and 45.16 kilometers of driving. Images: NASA/JPL-Caltech and NASA/KSC, used under NASA’s media usage guidelines.</p>
        <div class="row"><button class="btn pri" data-act="restart">Replay from the beginning</button><button class="btn" data-act="index">Chapters</button></div></div>
      <div class="curtain"><div></div></div><div class="toast"></div>`;
    // ruler
    const ruler = this.q<HTMLElement>('.ruler');
    CHAPTERS.forEach((ch, i) => {
      const s = el('div', 'rs'); s.style.flex = `${ch.duration} 1 0`; s.dataset.i = String(i);
      s.innerHTML = `<span>${esc(ch.rulerLabel)}</span><div class="tr"><i></i></div>`;
      ruler.appendChild(s); this.segs.push(s); this.fills.push(s.querySelector('i') as HTMLElement);
    });
    // index
    const ol = this.q<HTMLElement>('.index ol');
    CHAPTERS.forEach((ch, i) => { const li = el('li'); li.innerHTML = `<button data-go="${i}"><span class="nn">${String(ch.number).padStart(2, '0')}</span><span class="tt serif">${esc(ch.title)}</span><span class="dd">${esc(ch.dateLabel)}</span></button>`; ol.appendChild(li); });
  }

  private bind() {
    const r = this.root, c = this.c;
    r.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const a = t.closest('[data-act]') as HTMLElement | null, g = t.closest('[data-go]') as HTMLElement | null, m = t.closest('[data-mode]') as HTMLElement | null, seg = t.closest('.rs') as HTMLElement | null, lb = t.closest('[data-media]') as HTMLElement | null;
      if (m) { c.setMode(m.dataset.mode as 'cinematic' | 'interactive'); if (m.dataset.mode === 'interactive') { this.drawerManual = null; } this.syncControls(); return; }
      if (g) { this.openOv(null); void c.seekToChapter(Number(g.dataset.go), true); return; }
      if (lb) { this.openLightbox(lb.dataset.media!); return; }
      if (seg) { const i = Number(seg.dataset.i); if (i === c.index && c.mode === 'interactive') { const b = seg.getBoundingClientRect(); c.seekTime(((e.clientX - b.left) / b.width) * c.chapter.duration); } else void c.seekToChapter(i, c.playing || c.mode === 'cinematic'); return; }
      if (!a) return;
      switch (a.dataset.act) {
        case 'play': c.toggle(); break;
        case 'next': void c.next(); break;
        case 'prev': void c.prev(); break;
        case 'replay': void c.replay(); break;
        case 'sound': c.setAudioEnabled(!c.audio.isEnabled()); this.toast(c.audio.isEnabled() ? 'Archival audio on — space and Mars scenes remain silent' : 'Audio off — the film plays in silence'); break;
        case 'index': this.openOv('index'); break;
        case 'drawer': this.drawerManual = !r.classList.contains('drawer-open'); this.syncControls(); break;
        case 'fs': if (document.fullscreenElement) void document.exitFullscreen(); else void r.requestFullscreen?.(); break;
        case 'quality': { const order = ['low', 'medium', 'high'] as const; const next = order[(order.indexOf(c.scene.qualityLevel) + 1) % 3]; this.toast(`Quality: ${next}`); void c.setQualityLevel(next); break; }
        case 'closeov': this.openOv(null); break;
        case 'startCine': r.querySelector('.intro')!.classList.remove('open'); c.setMode('cinematic'); c.play(); break;
        case 'startInter': r.querySelector('.intro')!.classList.remove('open'); c.setMode('interactive'); this.drawerManual = true; this.syncControls(); break;
        case 'restart': r.querySelector('.end')!.classList.remove('open'); void c.seekToChapter(0, true); break;
      }
    });
    const tip = this.q<HTMLElement>('.tip'), ruler = this.q<HTMLElement>('.ruler');
    ruler.addEventListener('pointermove', (e) => {
      const s = (e.target as HTMLElement).closest('.rs') as HTMLElement | null; if (!s) return;
      const ch = CHAPTERS[Number(s.dataset.i)], rb = this.q<HTMLElement>('.bar').getBoundingClientRect(), sb = s.getBoundingClientRect();
      tip.innerHTML = `<b>${String(ch.number).padStart(2, '0')} · ${esc(ch.dateLabel)}</b>${esc(ch.title)}`;
      tip.style.left = `${sb.left - rb.left + sb.width / 2}px`; tip.classList.add('v');
    });
    ruler.addEventListener('pointerleave', () => tip.classList.remove('v'));
    this.unsub.push(c.on((e) => {
      switch (e.type) {
        case 'chapter': this.onChapter(e.chapter, e.index); break;
        case 'time': this.onTime(e.chapterTime, e.chapter); break;
        case 'state': this.syncControls(); break;
        case 'transition': this.q('.curtain').classList.toggle('on', e.active); this.q('.curtain div').textContent = e.active ? `Chapter ${String(e.chapter.number).padStart(2, '0')} · ${e.chapter.title}` : ''; break;
        case 'ended': this.q('.end').classList.add('open'); break;
        case 'quality': this.toast(`Quality adjusted: ${e.level}`); this.syncControls(); break;
      }
    }));
    this.syncControls();
  }

  private onKey(e: KeyboardEvent) {
    const c = this.c;
    if (e.key === ' ') { e.preventDefault(); c.toggle(); }
    else if (e.key === 'ArrowRight') void c.next();
    else if (e.key === 'ArrowLeft') void c.prev();
    else if (e.key === 'r') void c.replay();
    else if (e.key === 'm') c.setAudioEnabled(!c.audio.isEnabled());
    else if (e.key === 'i') this.openOv('index');
    else if (e.key === 'Escape') this.openOv(null);
  }

  private openOv(which: 'index' | null) { this.root.querySelector('.index')!.classList.toggle('open', which === 'index'); if (!which) this.closeLightbox(); }
  private toast(msg: string) { const t = this.q<HTMLElement>('.toast'); t.textContent = msg; t.classList.add('v'); clearTimeout(this.toastT); this.toastT = window.setTimeout(() => t.classList.remove('v'), 2600); }

  /* ----------------------------------- state ----------------------------------- */
  private syncControls() {
    const c = this.c, r = this.root;
    r.classList.toggle('playing', c.playing); r.classList.toggle('interactive', c.mode === 'interactive');
    this.q<HTMLElement>('[data-act=play]').innerHTML = c.playing ? ICON.pause : ICON.play;
    r.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.mode === c.mode));
    const snd = this.q<HTMLElement>('[data-act=sound]'); snd.textContent = c.audio.locked ? 'Sound blocked' : c.audio.isEnabled() ? 'Sound on' : 'Sound off'; snd.classList.toggle('on', c.audio.isEnabled() && !c.audio.locked);
    this.q<HTMLElement>('[data-act=quality]').textContent = c.scene.qualityLevel;
    const open = this.drawerManual ?? (c.mode === 'interactive' && !r.querySelector('.intro.open'));
    r.classList.toggle('drawer-open', open); this.q('[data-act=drawer]').classList.toggle('on', open);
    r.classList.toggle('has-hint', c.mode === 'interactive' && !c.scene.camera.isFree);
    // compose the 3D world away from the plates / drawer
    c.scene.setFrameShift(open ? 0.1 : this.plates.size ? 0.12 : 0);
    this.videos.forEach((v) => { /* keep playback state in sync */ if (!c.playing && !v.paused) v.pause(); });
  }

  private onChapter(ch: Chapter, index: number) {
    this.lastChapterId = ch.id; this.narrIdx = -1;
    // tear down previous plates + videos
    this.plates.forEach((p) => this.removePlate(p, true)); this.plates.clear();
    this.videos.forEach((v) => this.releaseVideo(v)); this.videos.clear();
    this.root.classList.remove('has-hint');
    const title = this.q<HTMLElement>('.title');
    title.classList.remove('settled');
    title.innerHTML = `<div class="no"><i></i><span class="label">Chapter ${String(ch.number).padStart(2, '0')} / ${CHAPTERS.length}</span></div><div class="date">${esc(ch.dateLabel)}</div><h1 class="serif">${esc(ch.title)}</h1>`;
    this.q<HTMLElement>('.narr').innerHTML = '';
    this.q<HTMLElement>('.facts').innerHTML = ch.facts.map((f, i) => `<li style="animation-delay:${0.6 + i * 0.25}s"><b>${esc(f.label)}</b><span>${esc(f.value)}</span><em class="${f.status}" title="${f.status === 'documented' ? 'Documented mission data' : 'Reconstruction'}"></em></li>`).join('');
    const def = this.c.scene.currentSceneDef;
    this.q<HTMLElement>('.prov').innerHTML = `${def ? '◇ ' + esc(def.provenance) : ''}${ch.silenceNote ? ' · ' + esc(ch.silenceNote) : ''}`;
    this.segs.forEach((s, i) => { s.classList.toggle('cur', i === index); s.classList.toggle('done', i < index); this.fills[i].style.width = i < index ? '100%' : '0'; });
    this.renderDrawer(ch);
    // prepare videos lazily (metadata only)
    ch.plates.forEach((p, i) => {
      const e = this.c.manifest.get(p.mediaId); if (e.mediaType !== 'video') return;
      const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'metadata'; v.setAttribute('playsinline', '');
      this.c.manifest.setStatus(e.id, 'loading');
      v.addEventListener('canplay', () => this.c.manifest.setStatus(e.id, 'ready'));
      v.addEventListener('error', () => this.c.manifest.setStatus(e.id, 'error'));
      v.src = e.url; this.c.audio.attach(v, e); this.videos.set(i, v);
    });
    this.syncControls();
  }

  private renderDrawer(ch: Chapter) {
    const m = this.c.manifest, d = this.q<HTMLElement>('.drawer');
    const media = m.forChapter(ch.id);
    const mk = (mid?: string, label = 'View source media') => mid ? `<button class="lnk" data-media="${esc(mid)}">${label}</button>` : '';
    d.innerHTML = `<div class="label" style="color:#d9733f">Chapter ${String(ch.number).padStart(2, '0')} · ${esc(ch.dateLabel)}</div><h3 class="serif">${esc(ch.title)}</h3>
      <h4 class="label">Milestones</h4>${ch.milestones.map((x) => `<div class="ms"><div class="d">${esc(x.date)}</div><div class="n serif">${esc(x.title)}</div><p>${esc(x.text)}</p>${mk(x.mediaId)}</div>`).join('')}
      ${ch.discoveries.length ? `<h4 class="label">Scientific findings</h4>${ch.discoveries.map((x) => `<div class="ms"><div class="n serif">${esc(x.title)}</div><p>${esc(x.text)}</p>${mk(x.mediaId, 'Inspect evidence')}</div>`).join('')}` : ''}
      <h4 class="label">Archive · ${media.length} items</h4><div class="thumbs">${media.map((e) => { const thumb = e.poster ?? (e.mediaType === 'image' ? e.url : ''); return `<button data-media="${esc(e.id)}" aria-label="${esc(e.title)}">${thumb ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(thumb)}" alt="">` : ''}${e.mediaType === 'video' ? '<div class="play">▶</div>' : ''}<span>${esc(kindLabel(e.kind))}</span></button>`; }).join('')}</div>
      <h4 class="label">Reading this scene</h4><p style="font-size:11.5px;line-height:1.6;color:#9c8f7e">Filled orange dot = documented mission data. Hollow dot = reconstruction. Archive items are original NASA media; nothing here is AI-generated.</p>`;
  }

  private onTime(t: number, ch: Chapter) {
    if (ch.id !== this.lastChapterId) return;
    const i = this.c.index, f = this.fills[i];
    if (f) f.style.width = `${(t / ch.duration) * 100}%`;
    let elapsed = 0; for (let k = 0; k < i; k++) elapsed += CHAPTERS[k].duration; elapsed += t;
    this.q<HTMLElement>('.clock').textContent = `${mmss(elapsed)} / ${mmss(TOTAL_DURATION)}`;
    if (t > 5.5) this.q('.title').classList.add('settled'); else this.q('.title').classList.remove('settled');
    // narration
    let ni = -1; ch.narration.forEach((n, k) => { if (t >= n.at && t < n.at + n.dur) ni = k; });
    if (ni !== this.narrIdx) { this.narrIdx = ni; this.q<HTMLElement>('.narr').innerHTML = ni >= 0 ? `<span>${esc(ch.narration[ni].text)}</span>` : ''; }
    // plates
    ch.plates.forEach((p, k) => {
      const active = t >= p.at && t < p.at + p.dur, pv = this.plates.get(k);
      if (active && !pv) this.addPlate(ch, p, k, t);
      else if (!active && pv && !pv.removing) { pv.removing = true; this.removePlate(pv, false); this.plates.delete(k); this.syncShift(); }
      else if (pv && pv.video) this.syncVideo(pv, t);
    });
  }

  private syncShift() { const open = this.root.classList.contains('drawer-open'); this.c.scene.setFrameShift(open ? 0.1 : this.plates.size ? 0.12 : 0); }

  private fit(node: HTMLElement, w: number, h: number, frame: string) {
    const vw = this.root.clientWidth, vh = this.root.clientHeight;
    const maxW = frame === 'wide' ? vw * 0.62 : vw * 0.43, maxH = vh * (frame === 'wide' ? 0.6 : 0.5);
    const k = Math.min(maxW / w, maxH / h, 1.8);
    const fw = Math.round(w * k), fh = Math.round(h * k);
    const fig = node.querySelector('.fig') as HTMLElement; fig.style.width = fw + 'px'; fig.style.height = fh + 'px';
    node.style.setProperty('--w', fw + 'px'); node.style.setProperty('--cw', Math.max(260, fw) + 'px');
  }

  private addPlate(ch: Chapter, p: Plate, idx: number, t: number) {
    const entry = this.c.manifest.get(p.mediaId); const frame = p.frame ?? 'right';
    const node = el('div', `plate f-${frame}`);
    const fig = el('div', 'fig'); node.appendChild(fig);
    const view: PlateView = { idx, plate: p, node, entry, shown: false };
    const cap = el('figcaption');
    const sim = entry.kind === 'simulation' || entry.kind === 'animation';
    cap.innerHTML = `<span class="k">Fig. ${String(idx + 1).padStart(2, '0')} · ${esc(kindLabel(entry.kind))}</span><span class="t">${esc(entry.title.length > 96 ? entry.title.slice(0, 94) + '…' : entry.title)}</span><span class="c ${sim ? 'sim' : ''}">${esc(entry.credit)} · ${esc(fmtDate(entry.date))}</span>`;
    node.appendChild(cap);
    this.plates.set(idx, view);
    const show = (w: number, h: number) => { if (view.removing || !this.plates.has(idx)) return; this.fit(node, w, h, frame); this.q('.plates').appendChild(node); requestAnimationFrame(() => node.classList.add('in')); view.shown = true; this.syncShift(); };
    if (entry.mediaType === 'image') {
      const img = new Image(); img.alt = entry.title; img.referrerPolicy = 'no-referrer';
      const kb = { push: 'kbPush', 'drift-left': 'kbL', 'drift-right': 'kbR', still: 'kbS' }[p.motion ?? 'push'];
      img.style.setProperty('--kb', kb); img.style.setProperty('--d', `${p.dur + 1}s`);
      fig.appendChild(img);
      this.c.manifest.setStatus(entry.id, 'loading');
      img.onload = () => { this.c.manifest.setStatus(entry.id, 'ready'); show(img.naturalWidth, img.naturalHeight, ); };
      img.onerror = () => { this.c.manifest.setStatus(entry.id, 'error'); this.plates.delete(idx); }; // never show an empty plate
      img.src = entry.url;
    } else {
      const v = this.videos.get(idx); if (!v) { this.plates.delete(idx); return; }
      view.video = v; fig.appendChild(v);
      const ready = () => { if (!view.shown && !view.removing) { show(v.videoWidth || 1280, v.videoHeight || 720); this.syncVideo(view, this.c.chapterTime); this.c.audio.fade(v, 1); } };
      if (v.readyState >= 3) ready(); else { v.addEventListener('canplay', ready, { once: true }); v.preload = 'auto'; this.seekVideo(view, t); }
      v.addEventListener('error', () => { this.plates.delete(idx); node.remove(); }, { once: true });
    }
    void ch;
  }

  private seekVideo(pv: PlateView, t: number) {
    const v = pv.video!, clip = pv.plate.clip ?? [0, pv.plate.dur];
    const want = Math.min(clip[1], clip[0] + Math.max(0, t - pv.plate.at));
    if (Math.abs(v.currentTime - want) > 0.7 || v.readyState === 0) { try { v.currentTime = want; } catch { /* metadata pending */ } }
  }

  private syncVideo(pv: PlateView, t: number) {
    const v = pv.video!; if (!pv.shown) return;
    this.seekVideo(pv, t);
    if (this.c.playing) { if (v.paused) void this.c.audio.play(v); } else if (!v.paused) v.pause();
    const left = pv.plate.at + pv.plate.dur - t; if (left < 0.8) this.c.audio.fade(v, 0);
  }

  private removePlate(pv: PlateView, instant: boolean) {
    pv.removing = true;
    if (pv.video) { pv.video.pause(); this.c.audio.fade(pv.video, 0); }
    pv.node.classList.remove('in');
    const done = () => { pv.node.remove(); if (pv.video) { /* keep element for possible replay within chapter */ } };
    if (instant) done(); else this.timers.push(window.setTimeout(done, 750));
  }

  private releaseVideo(v: HTMLVideoElement) { try { v.pause(); } catch { /* ignore */ } this.c.audio.detach(v); v.removeAttribute('src'); v.load(); v.remove(); }

  /* ---------------------------------- lightbox ---------------------------------- */
  private openLightbox(id: string) {
    const e = this.c.manifest.get(id), lb = this.q<HTMLElement>('.lb'), box = lb.querySelector('.lbm') as HTMLElement, cap = lb.querySelector('.cap') as HTMLElement;
    this.lbWasPlaying = this.c.playing; this.c.pause();
    this.videos.forEach((v) => v.pause());
    box.innerHTML = '';
    if (e.mediaType === 'image') { const i = new Image(); i.className = 'media'; i.src = e.url; i.alt = e.title; i.referrerPolicy = 'no-referrer'; box.appendChild(i); }
    else {
      const v = document.createElement('video'); v.className = 'media'; v.controls = true; v.playsInline = true; v.src = e.url; if (e.poster) v.poster = e.poster;
      this.c.audio.attach(v, e); this.c.audio.fade(v, 1);
      const start = CHAPTERS.flatMap((c) => c.plates).find((p) => p.mediaId === id)?.clip?.[0] ?? 0;
      v.addEventListener('loadedmetadata', () => { if (start) v.currentTime = start; }, { once: true });
      box.appendChild(v); this.lbVideo = v; void this.c.audio.play(v);
    }
    const st = this.c.manifest.getStatus(id);
    cap.innerHTML = `<b class="serif">${esc(e.title)}</b>${esc(e.caption)}<div class="meta">${esc(kindLabel(e.kind))} · ${esc(e.credit)} · ${esc(fmtDate(e.date))}<br>Source: <a href="${esc(e.sourcePage)}" target="_blank" rel="noopener">${esc(e.sourcePage.replace('https://', ''))}</a><br>${e.mediaType === 'video' ? 'Audio: ' + esc(e.audioNote ?? '') + '<br>' : ''}Status: ${st} · ${esc(e.license.split('.')[0])}</div>`;
    lb.classList.add('open');
  }
  private closeLightbox() {
    const lb = this.q<HTMLElement>('.lb'); if (!lb.classList.contains('open')) return;
    lb.classList.remove('open');
    if (this.lbVideo) { this.c.audio.detach(this.lbVideo); this.lbVideo.pause(); this.lbVideo.removeAttribute('src'); this.lbVideo.load(); this.lbVideo = undefined; }
    (lb.querySelector('.lbm') as HTMLElement).innerHTML = '';
    if (this.lbWasPlaying) this.c.play();
  }

  /* ----------------------------------- markers ----------------------------------- */
  private updateMarkers(ms: Array<{ label: string; sub?: string; x: number; y: number; visible: boolean }>) {
    const box = this.q<HTMLElement>('.markers');
    while (this.markerEls.length < ms.length) { const m = el('div', 'mk'); box.appendChild(m); this.markerEls.push(m); }
    this.markerEls.forEach((m, i) => {
      const d = ms[i]; if (!d) { m.classList.remove('v'); return; }
      if (m.dataset.l !== d.label) { m.dataset.l = d.label; m.innerHTML = `<b>${esc(d.label)}</b>${d.sub ? `<i>${esc(d.sub)}</i>` : ''}`; }
      m.style.left = `${d.x}px`; m.style.top = `${d.y}px`; m.classList.toggle('v', d.visible);
    });
  }

  destroy() {
    this.unsub.forEach((u) => u()); this.timers.forEach((t) => clearTimeout(t));
    this.videos.forEach((v) => this.releaseVideo(v)); this.videos.clear();
    this.closeLightbox();
    this.host.removeEventListener('keydown', this.keyHandler);
    this.c.scene.onMarkers = undefined; this.c.audio.onChange = undefined;
    this.ui.remove(); this.style.remove();
    this.host.classList.remove('merb', 'playing', 'interactive', 'drawer-open', 'has-hint');
    this.host.removeAttribute('tabindex');
  }
}
