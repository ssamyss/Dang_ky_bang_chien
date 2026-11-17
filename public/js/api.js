/* Gọi server, tải dữ liệu, thông báo và vòng làm mới 5 giây */
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2400)}
async function w(fn,ok){try{await fn();if(ok)toast(ok)}catch(e){toast("Không lưu được: "+(e&&(e.message||e.code)||"lỗi"))}}
function refresh(){if(dragging)return;const a=document.activeElement;if(a&&a.matches&&a.matches("input,textarea,select"))return;render()}

async function api(m,u,b){const r=await fetch(u,{method:m,headers:{"Content-Type":"application/json"},body:b?JSON.stringify(b):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"Lỗi máy chủ");return j}
function apply(j){S=j;WD=j.war;if(!j.me){state="auth";ME=null;return}ME=String(j.me.id);MYNAME=j.me.name;OWNER=j.me.role==="owner";ADMIN=j.me.role!=="member";const had=state==="ok",old=teams[ME];reg=j.reg;teams=j.teams;evs=j.events;state="ok";if(had&&!ADMIN&&teams[ME]&&teams[ME]!==old)toast("Bạn vừa được xếp vào "+squadName(teams[ME]))}
async function load(){try{apply(await api("GET","/api/state"))}catch(e){}}
const act=(fn,ok)=>w(async()=>{await fn();await load();render()},ok);
async function init(){await load();render();setInterval(async()=>{if(state==="ok"&&!document.hidden){await load();refresh()}},5000)}
