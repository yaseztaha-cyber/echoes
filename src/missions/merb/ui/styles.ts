/** All selectors are namespaced under .merb so the module cannot restyle its host. Injected on mount, removed on destroy. */
export const CSS = `
.merb{position:relative;width:100%;height:100%;overflow:hidden;background:#070605;color:#efe6d8;font-family:'Helvetica Neue',Inter,Arial,sans-serif;-webkit-font-smoothing:antialiased;user-select:none;outline:none}
.merb *{box-sizing:border-box}
.merb button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}
.merb button:focus-visible{outline:1px solid #d9733f;outline-offset:3px}
.merb .ui{position:absolute;inset:0;pointer-events:none}
.merb .ui>*{pointer-events:none}
.merb .ui .hit,.merb .ui .hit *{pointer-events:auto}
.merb .shade{background:linear-gradient(180deg,rgba(7,6,5,.55) 0,rgba(7,6,5,0) 16%,rgba(7,6,5,0) 48%,rgba(7,6,5,.78) 100%);position:absolute;inset:0}
.merb .serif{font-family:'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif}
.merb .label{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#b9ab98}
/* top */
.merb .top{z-index:6;position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:flex-start;padding:22px 32px}
.merb .brand{display:flex;flex-direction:column;gap:5px}
.merb .brand b{font-weight:500;letter-spacing:.34em;font-size:12px;text-transform:uppercase}
.merb .brand span{font-size:10px;letter-spacing:.22em;color:#9c8f7e;text-transform:uppercase}
.merb .tools{display:flex;gap:6px;align-items:center}
.merb .chip{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;padding:9px 13px;border:1px solid rgba(239,230,216,.22);color:#d8cdbd;background:rgba(7,6,5,.5);transition:all .2s}
.merb .chip:hover{border-color:#d9733f;color:#fff}
.merb .chip.on{background:#efe6d8;color:#0a0807;border-color:#efe6d8}
.merb .seg2{display:flex}
.merb .seg2 .chip+.chip{margin-left:-1px}
/* title */
.merb .lower{position:absolute;left:44px;bottom:84px;max-width:min(56vw,820px);display:flex;flex-direction:column;gap:16px}
.merb .title{position:relative}
.merb .title .no{display:flex;gap:14px;align-items:center;color:#d9733f}
.merb .title .no i{display:block;width:44px;height:1px;background:#d9733f}
.merb .title .date{font-size:clamp(12px,1.25vw,20px);letter-spacing:.3em;text-transform:uppercase;color:#e8dccb;margin-top:12px;transition:all .9s}
.merb .title h1{font-weight:400;font-size:clamp(38px,6.2vw,112px);line-height:.94;letter-spacing:-.025em;margin:10px 0 0;text-shadow:0 2px 30px rgba(0,0,0,.55);transition:font-size 1.1s cubic-bezier(.2,.7,.2,1)}
.merb .title.settled h1{font-size:clamp(26px,3.1vw,56px)}
.merb .title.settled .date{color:#b9ab98}
.merb .title>*{animation:merbUp .9s cubic-bezier(.2,.7,.2,1) both}
.merb .title h1{animation-delay:.12s}
.merb .title .date{animation-delay:.05s}
@keyframes merbUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.merb .narr{position:relative;max-width:min(44vw,640px);min-height:58px;font-size:clamp(15px,1.35vw,22px);line-height:1.38;font-style:italic;color:#f3ead9;text-shadow:0 1px 14px rgba(0,0,0,.8)}
.merb .narr span{display:block;animation:merbFade .8s both}
@keyframes merbFade{from{opacity:0}to{opacity:1}}
.merb .facts{position:absolute;right:34px;bottom:100px;margin:0;padding:0;list-style:none;text-align:right;max-width:34vw}
.merb .facts li{font-size:11px;line-height:1.5;color:#e2d6c4;display:flex;gap:10px;justify-content:flex-end;align-items:baseline;padding:3px 0;border-bottom:1px solid rgba(239,230,216,.12);animation:merbFade 1s both}
.merb .facts li b{font-weight:400;letter-spacing:.18em;text-transform:uppercase;color:#9c8f7e;font-size:9.5px}
.merb .facts li em{font-style:normal;display:inline-block;width:6px;height:6px;border-radius:50%;margin-left:4px;flex:none;transform:translateY(-1px)}
.merb .facts li em.documented{background:#d9733f}
.merb .facts li em.reconstruction{border:1px solid #b9ab98}
.merb .prov{position:relative;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#85796a;max-width:60vw}
/* plates */
.merb .plate{position:absolute;opacity:0;transition:opacity .7s ease,transform 1.1s cubic-bezier(.2,.7,.2,1);transform:translateY(14px)}
.merb .plate.in{opacity:1;transform:none}
.merb .plate.f-right{right:44px;top:92px}
.merb .plate.f-left{left:44px;top:92px}
.merb .plate.f-wide{left:50%;top:84px;margin-left:calc(var(--w,60vw)/-2)}
.merb .plate .fig{position:relative;overflow:hidden;background:#000;box-shadow:0 30px 80px rgba(0,0,0,.55);outline:1px solid rgba(239,230,216,.18)}
.merb .plate .fig img,.merb .plate .fig video{display:block;width:100%;height:100%;object-fit:cover;transform-origin:50% 50%}
.merb .plate .fig img{animation:var(--kb,kbPush) var(--d,8s) ease-out both;animation-play-state:var(--ps,running)}
.merb:not(.playing) .plate .fig img{animation-play-state:paused}
@keyframes kbPush{from{transform:scale(1.0)}to{transform:scale(1.09)}}
@keyframes kbL{from{transform:scale(1.1) translateX(2.4%)}to{transform:scale(1.1) translateX(-2.4%)}}
@keyframes kbR{from{transform:scale(1.1) translateX(-2.4%)}to{transform:scale(1.1) translateX(2.4%)}}
@keyframes kbS{from{transform:scale(1)}to{transform:scale(1)}}
.merb .plate figcaption{margin-top:12px;display:grid;grid-template-columns:auto 1fr;gap:4px 14px;max-width:var(--cw,40vw);font-size:11px;line-height:1.45;color:#cfc3b1}
.merb .plate figcaption .k{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:#d9733f;grid-row:1}
.merb .plate figcaption .t{color:#efe6d8;font-size:12px;grid-row:1}
.merb .plate figcaption .c{grid-column:1/-1;color:#9c8f7e;font-size:10.5px}
.merb .plate figcaption .c.sim{color:#d9733f}
.merb .plate .buf{position:absolute;left:12px;top:10px;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#efe6d8;background:rgba(7,6,5,.7);padding:4px 7px}
/* markers */
.merb .mk{position:absolute;transform:translate(-4px,-100%);padding-bottom:10px;white-space:nowrap;opacity:0;transition:opacity .5s}
.merb .mk.v{opacity:1}
.merb .mk:before{content:'';position:absolute;left:3px;bottom:-3px;width:7px;height:7px;border:1px solid #efe6d8;border-radius:50%;background:rgba(7,6,5,.5)}
.merb .mk:after{content:'';position:absolute;left:6px;bottom:3px;width:1px;height:22px;background:rgba(239,230,216,.7)}
.merb .mk b{display:block;font-weight:500;font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin:0 0 3px 16px;transform:translateY(-22px);text-shadow:0 1px 8px #000}
.merb .mk i{display:block;font-style:normal;font-size:10px;color:#cdbfaa;margin-left:16px;transform:translateY(-22px);text-shadow:0 1px 8px #000}
/* bar */
.merb .bar{position:absolute;left:0;right:0;bottom:0;padding:0 32px 18px;display:flex;gap:22px;align-items:flex-end}
.merb .transport{display:flex;align-items:center;gap:6px}
.merb .round{width:44px;height:44px;border:1px solid rgba(239,230,216,.45);border-radius:50%;display:grid;place-items:center;background:rgba(7,6,5,.5);transition:all .2s}
.merb .round:hover{background:#efe6d8;color:#0a0807}
.merb .round svg{width:16px;height:16px;fill:currentColor}
.merb .small{width:32px;height:32px;display:grid;place-items:center;color:#cdbfaa;opacity:.85}
.merb .small:hover{opacity:1;color:#fff}
.merb .small svg{width:15px;height:15px;fill:currentColor}
.merb .clock{font-size:10.5px;letter-spacing:.14em;color:#b9ab98;min-width:88px;font-variant-numeric:tabular-nums}
.merb .ruler{flex:1;position:relative;height:46px;display:flex;gap:3px;align-items:flex-end}
.merb .rs{position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer}
.merb .rs .tr{height:4px;background:rgba(239,230,216,.2);position:relative;transition:height .15s,background .15s}
.merb .rs .tr i{position:absolute;left:0;top:0;bottom:0;background:#efe6d8;width:0}
.merb .rs.done .tr i{width:100%;background:#8f8272}
.merb .rs.cur .tr{height:6px;background:rgba(239,230,216,.28)}
.merb .rs.cur .tr i{background:#d9733f}
.merb .rs:hover .tr{height:8px;background:rgba(239,230,216,.4)}
.merb .rs span{font-size:9.5px;letter-spacing:.18em;color:#85796a;position:absolute;left:0;bottom:12px;white-space:nowrap}
.merb .rs.cur span{color:#e8dccb}
.merb .tip{position:absolute;bottom:72px;transform:translateX(-50%);background:#0b0907;border:1px solid rgba(239,230,216,.2);padding:9px 12px;font-size:11px;white-space:nowrap;opacity:0;transition:opacity .15s;pointer-events:none}
.merb .tip b{display:block;font-weight:400;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:#d9733f;margin-bottom:3px}
.merb .tip.v{opacity:1}
/* drawer */
.merb .drawer{position:absolute;right:0;top:0;bottom:0;width:min(380px,92vw);background:rgba(10,8,7,.94);border-left:1px solid rgba(239,230,216,.14);transform:translateX(102%);transition:transform .5s cubic-bezier(.2,.7,.2,1);padding:76px 26px 110px;overflow-y:auto;pointer-events:auto}
.merb.drawer-open .drawer{transform:none}
.merb.drawer-open .facts,.merb.drawer-open .plate.f-right{opacity:0;visibility:hidden}
.merb .bar{z-index:5}
.merb .drawer h3{font-weight:400;font-size:26px;line-height:1.05;margin:6px 0 4px;letter-spacing:-.01em}
.merb .drawer h4{margin:28px 0 10px;font-weight:400}
.merb .drawer .ms{padding:12px 0;border-top:1px solid rgba(239,230,216,.12)}
.merb .drawer .ms .d{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#d9733f}
.merb .drawer .ms .n{font-size:15px;margin:3px 0}
.merb .drawer .ms p{margin:0;font-size:12px;line-height:1.5;color:#b9ab98}
.merb .drawer .ms button.lnk{margin-top:8px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#efe6d8;border-bottom:1px solid #d9733f;padding-bottom:2px}
.merb .thumbs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.merb .thumbs button{position:relative;aspect-ratio:4/3;background:#17120f;overflow:hidden;outline:1px solid rgba(239,230,216,.14)}
.merb .thumbs img{width:100%;height:100%;object-fit:cover;opacity:.9}
.merb .thumbs button:hover img{opacity:1}
.merb .thumbs span{position:absolute;left:0;right:0;bottom:0;padding:14px 6px 5px;background:linear-gradient(transparent,rgba(0,0,0,.85));font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;text-align:left;color:#d8cdbd}
.merb .thumbs .play{position:absolute;inset:0;display:grid;place-items:center;font-size:22px;color:#fff;text-shadow:0 0 12px #000}
/* overlays */
.merb .ov{position:absolute;inset:0;background:rgba(7,6,5,.96);opacity:0;visibility:hidden;transition:opacity .5s,visibility .5s;pointer-events:none}
.merb .ov.open{opacity:1;visibility:visible;pointer-events:auto}
.merb .ov *{pointer-events:auto}
.merb .index{padding:90px 6vw 40px;overflow:auto}
.merb .index ol{list-style:none;margin:20px 0 0;padding:0;columns:2;column-gap:5vw}
.merb .index li{break-inside:avoid;border-top:1px solid rgba(239,230,216,.14)}
.merb .index li button{width:100%;text-align:left;display:grid;grid-template-columns:44px 1fr;gap:6px 14px;padding:16px 0}
.merb .index li button:hover .tt{color:#d9733f}
.merb .index .nn{font-size:12px;color:#d9733f;letter-spacing:.14em;padding-top:8px}
.merb .index .tt{font-size:clamp(20px,2.1vw,32px);line-height:1.05;transition:color .2s}
.merb .index .dd{grid-column:2;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#85796a}
.merb .index li.cur .nn:after{content:' ●'}
.merb .close{position:absolute;right:32px;top:24px;z-index:3;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;border:1px solid rgba(239,230,216,.3);padding:9px 14px}
.merb .lb{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:70px 6vw 40px}
.merb .lb .media{max-width:88vw;max-height:68vh;display:block;outline:1px solid rgba(239,230,216,.2);background:#000}
.merb .lb .cap{max-width:880px;text-align:left;width:100%;font-size:13px;line-height:1.55;color:#cdbfaa}
.merb .lb .cap b{display:block;font-weight:400;font-size:22px;color:#efe6d8;margin-bottom:6px}
.merb .lb .cap .meta{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#85796a;margin-top:10px;line-height:1.8}
.merb .lb .cap a{color:#e8dccb;border-bottom:1px solid #d9733f;text-decoration:none}
.merb .intro,.merb .end{display:flex;flex-direction:column;justify-content:flex-end;padding:0 44px 9vh;background:linear-gradient(90deg,rgba(7,6,5,.9) 0,rgba(7,6,5,.35) 70%,rgba(7,6,5,.1) 100%)}
.merb .end{background:rgba(7,6,5,.84);justify-content:center}
.merb .intro h2,.merb .end h2{font-weight:400;font-size:clamp(54px,10.5vw,190px);line-height:.88;letter-spacing:-.035em;margin:14px 0 0}
.merb .end h2{font-size:clamp(34px,5.5vw,96px);max-width:14ch}
.merb .intro p,.merb .end p{max-width:560px;font-size:clamp(14px,1.25vw,19px);line-height:1.5;color:#d8cdbd;margin:22px 0 0}
.merb .intro .row,.merb .end .row{display:flex;gap:12px;margin-top:30px;flex-wrap:wrap}
.merb .btn{font-size:11px;letter-spacing:.24em;text-transform:uppercase;padding:16px 26px;border:1px solid rgba(239,230,216,.5)}
.merb .btn.pri{background:#efe6d8;color:#0a0807;border-color:#efe6d8}
.merb .btn:hover{background:#d9733f;border-color:#d9733f;color:#0a0807}
.merb .intro small{display:block;margin-top:26px;font-size:10px;letter-spacing:.14em;color:#85796a;text-transform:uppercase;max-width:640px;line-height:1.7}
.merb .curtain{position:absolute;inset:0;background:#070605;opacity:0;transition:opacity .38s ease;pointer-events:none;display:grid;place-items:center}
.merb .curtain.on{opacity:1;pointer-events:auto}
.merb .curtain div{font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#85796a}
.merb .toast{position:absolute;left:50%;top:70px;transform:translateX(-50%);background:#0b0907;border:1px solid rgba(239,230,216,.25);padding:10px 16px;font-size:11px;letter-spacing:.1em;opacity:0;transition:opacity .4s;pointer-events:none}
.merb .toast.v{opacity:1}
.merb .free-hint{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#cdbfaa;opacity:0;transition:opacity .4s}
.merb.interactive.has-hint .free-hint{opacity:.9}
@media (max-width:900px){.merb .facts,.merb .prov{display:none}.merb .lower{left:20px}.merb .narr{max-width:90vw}.merb .top{padding:16px 18px}.merb .bar{padding:0 14px 12px;gap:10px}.merb .clock{display:none}.merb .index ol{columns:1}.merb .plate.f-right,.merb .plate.f-left{right:18px;left:auto;top:70px}}
@media (prefers-reduced-motion:reduce){.merb .plate .fig img{animation:none}.merb *{transition-duration:.01s!important}}
`;
