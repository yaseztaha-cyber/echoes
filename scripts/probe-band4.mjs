import { chromium } from "playwright-core";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
try {
  await page.goto("http://localhost:4173/", { waitUntil: "load", timeout: 60000 });
  await sleep(4000);
  const info = await page.evaluate(() => {
    const scene = window.__echoesScene;
    if (!scene) return "no scene bridge";
    let band = null;
    scene.traverse((o) => { if (o.isMesh && o.material?.map && o.material.side === 1) band = o; });
    if (!band) return "no band mesh";
    const t = band.material.map;
    return {
      format: t.format,
      type: t.type,
      colorSpace: t.colorSpace,
      flipY: t.flipY,
      unpackAlignment: t.unpackAlignment,
      isCompressedTexture: t.isCompressedTexture,
      mipmaps: Array.isArray(t.mipmaps) ? t.mipmaps.length : null,
      mip0Bytes: t.mipmaps[0] ? (t.mipmaps[0].data.byteLength ?? t.mipmaps[0].data?.length ?? null) : null,
      imageKeys: t.image ? Object.keys(t.image) : null,
      imageTag: t.image ? (t.image.tag ?? t.image.baseType ?? null) : null,
      width: t.source?.data?.width ?? t.image?.width ?? null,
      generateMipmaps: t.generateMipmaps,
      premultiplyAlpha: t.premultiplyAlpha,
      userDataKeys: Object.keys(t.userData ?? {}),
      materialTransparent: band.material.transparent,
      materialAlpha: band.material.opacity,
      blending: band.material.blending,
    };
  });
  console.log(JSON.stringify(info, null, 1));
} finally {
  await browser.close();
}
