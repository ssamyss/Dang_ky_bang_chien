/* Dựng trang, gắn sự kiện, điều hướng và khởi động */
function render(){
  const app=document.getElementById("app");
  if(state==="load")return app.innerHTML=`<div class="card" style="margin-top:8vh"><h2>Đang tải dữ liệu bang…</h2><p class="mute">Nếu quá lâu, hãy tải lại trang.</p></div>`;
  if(state==="auth")return app.innerHTML=authView();
  const tabs=[["tong-quan","Tổng quan"],["bao-danh","Báo danh"],...(ADMIN?[["xep-team","Xếp team"],["su-kien","Sự kiện"]]:[]),...(ADMIN?[["thanh-vien","Thành viên"+((S.pending||[]).length?`<span class="badge">${S.pending.length}</span>`:"")]]:[])];
  if(!tabs.some(t=>t[0]===tab))tab="tong-quan";
  app.innerHTML=`<header class="top"><div class="brand"><div class="logo" aria-hidden="true">${TRI}</div><div><h1>IMMORTAL</h1><div class="tag">逆水寒 · Nghịch Thủy Hàn</div></div></div><div class="who"><span class="mute">Xin chào, <b>${esc(MYNAME)}</b></span><span class="role ${ADMIN?"admin":""}">${roleName()}</span><button class="btn ghost sm" id="out">Đăng xuất</button></div></header>
  <nav class="main" aria-label="Chức năng">${tabs.map(t=>`<a href="#${t[0]}" ${t[0]===tab?'aria-current="page"':""}>${t[1]}</a>`).join("")}<span class="ind"></span></nav>
  <main class="${animate&&!window.gsap?"enter":""}${ADMIN?" adm":""}">${({"tong-quan":overview,"bao-danh":checkin,"xep-team":arrange,"su-kien":events,"thanh-vien":members})[tab]()}</main>`;
  bind();
  moveInd();
  if(animate)animateIn();
  animate=false;
  if(flash){const el=[...document.querySelectorAll(".mem")].find(x=>x.dataset.uid===flash);if(el&&window.gsap&&!RM)gsap.fromTo(el,{scale:1.2,boxShadow:"0 0 0 5px rgba(216,180,106,.55)"},{scale:1,boxShadow:"0 0 0 0 rgba(216,180,106,0)",duration:.8,ease:"elastic.out(1,.45)"});flash=null}
  if(flashSq){const sq=document.querySelector('[data-sq="'+flashSq+'"]');if(sq&&sq.classList.contains("full")&&window.gsap&&!RM)gsap.fromTo(sq,{scale:1.04},{scale:1,duration:.9,ease:"elastic.out(1,.4)"});flashSq=null}
}

function bind(){
  const q=s=>document.querySelector(s);
  if(q("#sc"))q("#sc").onchange=e=>{const v=e.target.value,sp=q("#sp");sp.setAttribute("style","--sc:"+SCH[v][1]);sp.innerHTML=ico(v,"lg");if(window.gsap&&!RM)gsap.fromTo(sp.firstChild,{scale:.4,rotate:-25},{scale:1,rotate:0,duration:.55,ease:"back.out(2.2)"})};
  if(q("#pf"))q("#pf").oninput=e=>{const v=e.target.value.toLowerCase();document.querySelectorAll(".prm").forEach(l=>{l.hidden=!l.textContent.toLowerCase().includes(v)})};
  document.querySelectorAll("[data-ok]").forEach(b=>b.onclick=()=>act(()=>api("POST","/api/approve",{user_id:b.dataset.ok,ok:true}),"Đã duyệt thành viên"));
  document.querySelectorAll("[data-no]").forEach(b=>b.onclick=()=>{if(confirm("Từ chối và xoá đăng ký này?"))act(()=>api("POST","/api/approve",{user_id:b.dataset.no,ok:false}),"Đã từ chối đăng ký")});
  document.querySelectorAll("[data-du]").forEach(b=>b.onclick=()=>{if(confirm("Xoá tài khoản "+b.dataset.n+"? Dữ liệu báo danh của người này cũng bị xoá."))act(()=>api("DELETE","/api/users/"+b.dataset.du),"Đã xoá tài khoản")});
  if(q("#out"))q("#out").onclick=async()=>{await api("POST","/api/logout").catch(()=>{});state="auth";animate=true;await load();render()};
  if(q("#rf"))q("#rf").onsubmit=e=>{e.preventDefault();act(()=>api("POST","/api/reg",{char:q("#cn").value.trim(),school:q("#sc").value,go:q('input[name=go]:checked').value==="1"}),"Đã lưu báo danh")};
  initDnD();
  document.querySelectorAll("[data-dg]").forEach(c=>c.onchange=()=>act(()=>api("POST","/api/role",{user_id:c.dataset.dg,role:c.checked?"dg":"member"}),"Đã cập nhật quyền"));
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{if(ADMIN&&confirm("Xoá sự kiện này?"))act(()=>api("DELETE","/api/events/"+b.dataset.del),"Đã xoá sự kiện")});
  if(q("#ef"))q("#ef").onsubmit=e=>{e.preventDefault();act(()=>api("POST","/api/events",{title:q("#et").value.trim(),date:q("#ed").value,desc:q("#ex").value.trim()}),"Đã đăng sự kiện")};
}

function route(){const h=location.hash.slice(1);if(["tong-quan","bao-danh","xep-team","su-kien","thanh-vien"].includes(h))tab=h;animate=true;render()}
window.addEventListener("hashchange",route);route();init();
