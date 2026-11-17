/* Hiệu ứng: GSAP, kéo thả, đếm ngược, thanh tab trượt, tuyết rơi, ảnh nền */
function countUp(){document.querySelectorAll("[data-count]").forEach(el=>{const n=+el.dataset.count,s=el.dataset.suffix||"",o={v:0};gsap.to(o,{v:n,duration:1.2,ease:"power2.out",onUpdate:()=>{el.textContent=Math.round(o.v)+s}})})}
function gfrom(sel,vars){if(document.querySelector(sel))gsap.from(sel,vars)}
function animateIn(){
  if(RM)return;
  if(window.gsap){
    if(!window._hd&&document.querySelector(".logo")){window._hd=1;gsap.from(".logo",{scale:0,rotate:-140,duration:.9,ease:"back.out(1.7)"});gsap.from(".brand h1",{y:26,opacity:0,duration:.8,delay:.1,ease:"power3.out"});gsap.from(".tag",{opacity:0,letterSpacing:"0.7em",duration:1.3,delay:.2,ease:"power2.out"});gsap.from(".who>*",{y:-14,opacity:0,stagger:.08,duration:.6,delay:.3})}
    gfrom("main .card",{y:28,opacity:0,duration:.65,stagger:.09,ease:"power3.out",clearProps:"transform,opacity"});
    gfrom("main .bar i",{scaleX:0,duration:1,delay:.25,stagger:.08,ease:"power2.out"});
    gfrom("main .mem",{scale:.7,opacity:0,y:12,duration:.45,stagger:{each:.018,amount:.7},ease:"back.out(1.8)",delay:.2,clearProps:"transform,opacity"});
    gfrom("main .stat",{x:-18,opacity:0,duration:.5,stagger:.1,delay:.15,ease:"power2.out"});
    countUp();
  }else document.querySelectorAll("main .card").forEach((c,k)=>c.style.setProperty("--d",k*80+"ms"));
}
function initDnD(){
  if(!ADMIN||!window.Sortable)return;
  document.querySelectorAll(".slist").forEach(el=>new Sortable(el,{group:"squads",animation:220,easing:"cubic-bezier(.2,.7,.2,1)",ghostClass:"sortable-ghost",chosenClass:"sortable-chosen",dragClass:"sortable-drag",delay:120,delayOnTouchOnly:true,
    onStart:()=>{dragging=true},
    onMove:e=>{if(e.to!==e.from&&e.to.dataset.squad&&e.to.children.length>=SQCAP)return false},
    onEnd:e=>{dragging=false;if(e.to===e.from)return;const u=e.item.dataset.uid,k=e.to.dataset.squad;
      k?teams[u]=k:delete teams[u];flash=u;flashSq=k||null;render();
      (async()=>{try{await api("POST","/api/team",{user_id:u,team:k||null})}catch(err){toast(err.message)}await load();render()})()}}));
}

let lastX=null,lastW=0;
function moveInd(){const n=document.querySelector("nav.main"),a=n&&n.querySelector("a[aria-current=page]"),i=n&&n.querySelector(".ind");if(!a||!i)return;
  const x=a.offsetLeft,w=a.offsetWidth;
  if(window.gsap&&!RM&&lastX!==null){gsap.set(i,{x:lastX,width:lastW});gsap.to(i,{x,width:w,duration:.55,ease:"power3.out"})}else if(window.gsap)gsap.set(i,{x,width:w});
  lastX=x;lastW=w}
function cdHtml(){
  const t=new Date(WD+"T20:00:00+07:00").getTime(),d=t-Date.now();
  if(d<=0)return Date.now()<t+2*36e5?`<div class="live">⚔ Bang chiến đang diễn ra!</div>`:`<div class="mute">Bang chiến tuần này đã kết thúc. Chờ đợt báo danh tiếp theo.</div>`;
  const s=Math.floor(d/1e3),v=[["ngày",Math.floor(s/86400)],["giờ",Math.floor(s%86400/3600)],["phút",Math.floor(s%3600/60)],["giây",s%60]];
  return v.map(([l,n])=>`<div class="u"><b>${String(n).padStart(2,"0")}</b><span>${l}</span></div>`).join("")}
const cdCard=()=>`<div class="card cd"><div class="cdl">Đếm ngược tới bang chiến</div><div class="cdt" data-cd>${cdHtml()}</div></div>`;
setInterval(()=>{const el=document.querySelector("[data-cd]");if(el&&!document.hidden)el.innerHTML=cdHtml()},1000);
window.addEventListener("resize",()=>{lastX=null;moveInd()});
function initFx(){
  const cv=document.getElementById("fx");if(!cv||RM)return;const c=cv.getContext("2d");let W,H,P=[];
  const mk=()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2.2+.6,vy:Math.random()*.5+.25,vx:Math.random()*.4-.2,ph:Math.random()*6.28,petal:Math.random()<.2,a:Math.random()*.5+.3});
  const size=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;P=Array.from({length:Math.round(Math.min(70,W/18))},mk)};
  (function loop(){if(!document.hidden){c.clearRect(0,0,W,H);for(const p of P){p.ph+=.012;p.x+=p.vx+Math.sin(p.ph)*.35;p.y+=p.vy;if(p.y>H+10){p.y=-10;p.x=Math.random()*W}if(p.x>W+10)p.x=-10;if(p.x<-10)p.x=W+10;
    c.globalAlpha=p.a;c.beginPath();if(p.petal){c.fillStyle="#f2b6c0";c.ellipse(p.x,p.y,p.r*2.2,p.r*1.2,p.ph,0,6.283)}else if(document.documentElement.dataset.theme==="thuymac"){c.fillStyle="#7f9b6c";c.ellipse(p.x,p.y,p.r*2.8,p.r*.75,p.ph,0,6.283)}else{c.fillStyle="#dff1f7";c.arc(p.x,p.y,p.r,0,6.283)}c.fill()}}requestAnimationFrame(loop)})();
  addEventListener("resize",size);size();
  if(window.gsap&&matchMedia("(hover:hover)").matches)document.addEventListener("mousemove",e=>{const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
    gsap.to(".moon",{x:x*-34,y:y*-22,duration:1.4,ease:"power2.out"});gsap.to(".mount.far",{x:x*-16,duration:1.4,ease:"power2.out"});gsap.to(".mount.near",{x:x*-32,duration:1.4,ease:"power2.out"})});
}
initFx();
(()=>{const i=new Image();i.onload=()=>{const e=document.querySelector(".bgimg");e.style.backgroundImage="url(/img/bg.jpg)";e.classList.add("on")};i.src="/img/bg.jpg"})();
/* Phong cảnh Thủy Mặc: tre (sinh ra bằng code) và chuyển động nhẹ của cảnh */
function buildBamboo(){
  const g=document.getElementById("bamboo");if(!g||g.childNodes.length)return;
  const NS="http://www.w3.org/2000/svg";let s=7;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  const mk=(d,at)=>{const p=document.createElementNS(NS,"path");p.setAttribute("d",d);for(const k in at)p.setAttribute(k,at[k]);g.appendChild(p)};
  [[1318,330],[1352,240],[1388,380],[1420,300],[1288,430]].forEach(([x,top],i)=>{
    mk(`M${x} 905L${x+(r()*8-4)} ${top}`,{stroke:i%2?"#355241":"#2c4636","stroke-width":7+r()*3,"stroke-linecap":"round",fill:"none"});
    for(let y=880;y>top+30;y-=48+r()*18){
      mk(`M${x-5.5} ${y}h11`,{stroke:"#1a2c21","stroke-width":2.2});
      if(r()<.6){const side=r()<.5?-1:1;for(let k=0;k<3;k++){const len=34+r()*26,x2=x+side*len*Math.cos((18+k*20)*Math.PI/180),y2=y-len*Math.sin((14+k*16)*Math.PI/180)+8;
        mk(`M${x} ${y}Q${(x+x2)/2} ${y-14-k*4} ${x2} ${y2}`,{stroke:"#3d6a4b","stroke-width":3.2,"stroke-linecap":"round",fill:"none",opacity:.85})}}
    }
  });
}
function sceneAnim(){
  if(RM||!window.gsap||!document.querySelector(".scene"))return;
  gsap.fromTo("#cranes",{x:-420},{x:1900,duration:80,repeat:-1,ease:"none"});
  gsap.to("#cranes",{y:14,duration:3.2,yoyo:true,repeat:-1,ease:"sine.inOut"});
  gsap.to("#boat",{y:3,rotation:1.4,svgOrigin:"1010 862",duration:2.6,yoyo:true,repeat:-1,ease:"sine.inOut"});
  gsap.to("#scarf",{rotation:7,svgOrigin:"180 462",duration:1.1,yoyo:true,repeat:-1,ease:"sine.inOut"});
  gsap.to("#bamboo",{rotation:1.6,svgOrigin:"1360 900",duration:3.8,yoyo:true,repeat:-1,ease:"sine.inOut"});
  gsap.to("#pine",{rotation:.8,svgOrigin:"70 500",duration:4.4,yoyo:true,repeat:-1,ease:"sine.inOut"});
  gsap.to(".moon",{scale:1.05,duration:4.5,yoyo:true,repeat:-1,ease:"sine.inOut"});
}
buildBamboo();sceneAnim();
