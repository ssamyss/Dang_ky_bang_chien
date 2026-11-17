/* Giao diện từng tab: tổng quan, báo danh, xếp đội, sự kiện, thành viên */
function memberOverview(){const m=reg[ME];return `${cdCard()}<div class="card"><h2>Bang chiến 20:00 thứ Bảy, ${fmtDate(WD)}</h2><div class="stats"><div class="stat"><b>${m?(m.go?"Có":"Không"):"Chưa"}</b><span class="mute">báo danh của bạn</span></div>${m?`<div class="stat" ${sc(m.school)}><b class="nm">${ico(m.school)}${esc(m.school)}</b><span class="mute">phái đang chơi</span></div>`:""}${m&&m.go?`<div class="stat"><b>${squadName(teams[ME]||"")}</b><span class="mute">đội của bạn</span></div>`:""}</div><a class="btn" style="text-decoration:none;display:inline-block" href="#bao-danh">${m?"Sửa báo danh":"Báo danh ngay"}</a></div>${mateCard()}`}
function mateCard(){const t=teams[ME];if(!t||!reg[ME]||!reg[ME].go)return"";const ms=Object.entries(reg).filter(([u])=>teams[u]===t);
  return `<div class="card"><h2>${squadName(t)} <span class="mute">${ms.length}/${SQCAP} người</span></h2><p class="mute">Đồng đội của bạn trong bang chiến.</p><div class="mates">${ms.map(([u,x])=>mem(u,x)).join("")}</div></div>`}
function members(){
  const pend=S.pending||[],canDel=u=>u.role!=="owner"&&(OWNER||u.role==="member")&&String(u.id)!==ME;
  const chip=u=>u.role==="owner"?`<span class="role admin">Admin</span>`:u.role==="dg"?`<span class="role">Quản trị viên</span>`:"";
  return `<div class="card"><h2>Chờ duyệt${pend.length?` (${pend.length})`:""}</h2>${pend.length?`<p class="mute">Kiểm tra xem người đăng ký có đúng là thành viên bang không rồi duyệt hoặc từ chối.</p>`+pend.map(u=>`<div class="row"><b>${esc(u.name)}</b><span style="display:flex;gap:6px"><button class="btn sm" data-ok="${u.id}">Duyệt</button><button class="btn danger" data-no="${u.id}">Từ chối</button></span></div>`).join(""):`<p class="empty">Không có tài khoản nào đang chờ duyệt.</p>`}</div>
  <div class="card"><h2>Thành viên (${S.users.length})</h2><input id="pf" placeholder="Tìm thành viên…" aria-label="Tìm thành viên" style="margin-bottom:8px">
  ${S.users.map(u=>`<div class="row prm"><span>${esc(u.name)}${reg[u.id]?` <span class="mute">(${esc(reg[u.id].char)})</span>`:""} ${chip(u)}</span><span style="display:flex;gap:12px;align-items:center">${OWNER&&u.role!=="owner"?`<label class="rad" style="margin:0"><input type="checkbox" data-dg="${u.id}" ${u.role==="dg"?"checked":""}> Quản trị viên</label>`:""}${canDel(u)?`<button class="btn danger" data-du="${u.id}" data-n="${esc(u.name)}">Xoá</button>`:""}</span></div>`).join("")}</div>`;
}
function overview(){
  if(!ADMIN)return memberOverview();
  const all=Object.values(reg),go=all.filter(x=>x.go).length,mine=reg[ME];
  const assigned=TEAMS.reduce((a,t)=>a+bigCount(t[0]),0);
  const today=ymd(new Date()),next=evs.filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const st=(n,l)=>`<div class="stat"><b data-count="${n}">${n}</b><span class="mute">${l}</span></div>`;
  const np=(S.pending||[]).length;
  return `${cdCard()}${np?`<div class="card"><h2>Chờ duyệt <span class="badge">${np}</span></h2><p>${np} tài khoản mới đang chờ duyệt. <a href="#thanh-vien">Duyệt ngay</a></p></div>`:""}<div class="card"><h2>Bang chiến 20:00 thứ Bảy, ${fmtDate(WD)}</h2>
  <div class="stats">${st(all.length,"đã báo danh")}${st(go,"có tham gia")}${st(all.length-go,"không tham gia")}${st(go-assigned,"chưa xếp đội")}</div>
  ${OWNER?"":`<p class="mute">Báo danh của bạn: <b>${mine?(mine.go?"Có tham gia":"Không tham gia"):"Chưa báo danh"}</b> · <a href="#bao-danh">${mine?"Sửa báo danh":"Báo danh ngay"}</a></p>`}</div>
  <div class="card"><h2>Số lượng thành viên các team</h2>${TEAMS.map(([b,n,cap])=>{const c=bigCount(b);return `<div class="tstat"><div style="display:flex;justify-content:space-between"><b>${n}</b><span class="${c>=cap?"full":"mute"}"><b data-count="${c}" data-suffix="/${cap}">${c}/${cap}</b></span></div><div class="bar ${c>=cap?"full":""}" aria-hidden="true"><i style="width:${Math.min(100,c/cap*100)}%"></i></div></div>`}).join("")}<a href="#xep-team">Đi tới xếp team</a></div>
  <div class="card"><h2>Sự kiện sắp tới</h2>${next?`<p><b>${esc(next.title)}</b> – ${fmtDate(next.date)}</p><p class="mute">${esc(next.desc||"")}</p>`:`<p class="empty">Chưa có sự kiện nào.</p>`}</div>`;
}
function checkin(){
  const m=reg[ME]||{},list=Object.entries(reg),pend=S.users.filter(u=>!reg[u.id]);
  const bySchool=SCHOOLS.map(s=>[s,list.filter(([,x])=>x.go&&x.school===s).length]);
  return `${OWNER?"":`<div class="card"><h2>Báo danh bang chiến ${fmtDate(WD)}</h2>
  <form id="rf"><label for="cn">Tên nhân vật</label><input id="cn" required maxlength="24" value="${esc(m.char||"")}">
  <label for="sc">Phái đang chơi</label><div class="schrow"><select id="sc" required>${SCHOOLS.map(s=>`<option ${s===m.school?"selected":""}>${s}</option>`).join("")}</select><span id="sp" ${sc(m.school||SCHOOLS[0])}>${ico(m.school||SCHOOLS[0],"lg")}</span></div>
  <fieldset><legend>Trạng thái</legend><label class="rad"><input type="radio" name="go" value="1" ${m.go!==false?"checked":""}> Có tham gia</label><label class="rad"><input type="radio" name="go" value="0" ${m.go===false?"checked":""}> Không tham gia</label></fieldset>
  <button class="btn" style="margin-top:12px">${reg[ME]?"Cập nhật báo danh":"Gửi báo danh"}</button></form></div>`}
  ${ADMIN?`<div class="card"><h2>Tổng hợp</h2><p>Có: <b>${list.filter(([,x])=>x.go).length}</b> · Không: <b>${list.filter(([,x])=>!x.go).length}</b></p>
  <div class="chips">${bySchool.map(([s,n])=>`<span class="chip" ${sc(s)}>${ico(s,"sm")}${s}: <b>${n}</b></span>`).join("")}</div></div>
  <div class="card"><h2>Danh sách báo danh (${list.length})</h2>${list.length?`<div class="scroll"><table><thead><tr><th>Nhân vật</th><th>Phái</th><th>Trạng thái</th></tr></thead><tbody>${list.map(([u,x])=>`<tr class="${u===ME?"me":""}"><td>${esc(x.char)}</td><td><span class="nm" ${sc(x.school)}>${ico(x.school)}${esc(x.school)}</span></td><td>${x.go?"Có":"Không"}</td></tr>`).join("")}</tbody></table></div>`:`<p class="empty">Chưa có ai báo danh.</p>`}${pend.length?`<p class="mute" style="margin-top:12px">Chưa báo danh: ${pend.map(u=>esc(u.name)).join(", ")}</p>`:""}</div>`:""}`;
}
const bigCount=b=>SQUADS.filter(s=>s.big===b).reduce((a,s)=>a+count(s.key),0);
const mem=(u,x)=>`<div class="mem ${u===ME?"me":""}" data-uid="${esc(u)}" ${sc(x.school)}><span class="nm">${ico(x.school)}<span>${esc(x.char)}</span></span><span class="mute">${esc(x.school)}</span></div>`;
function arrange(){
  const going=Object.entries(reg).filter(([,x])=>x.go),valid=new Set(SQUADS.map(s=>s.key));
  const inSq=k=>going.filter(([u])=>teams[u]===k),pool=going.filter(([u])=>!valid.has(teams[u]));
  return `<p class="mute">${ADMIN?"Kéo thả thành viên vào từng đội, mỗi đội 6 người. Kéo về “Chưa xếp” để gỡ khỏi đội.":"Danh sách đội do đương gia sắp xếp."}</p>
  ${ADMIN?`<div class="card pool"><h2>Chưa xếp (${pool.length})</h2><div class="slist" data-squad="" data-empty="${going.length?"Đã xếp hết mọi người":"Chưa có ai báo danh tham gia"}">${pool.map(([u,x])=>mem(u,x)).join("")}</div></div>`:""}
  ${TEAMS.map(([b,n,cap])=>{const c=bigCount(b);return `<div class="card big"><h2>${n} <span class="${c>=cap?"full":"mute"}">${c}/${cap}</span></h2><div class="bar ${c>=cap?"full":""}" aria-hidden="true"><i style="width:${Math.min(100,c/cap*100)}%"></i></div>
  <div class="squads">${SQUADS.filter(s=>s.big===b).map(s=>{const m=inSq(s.key),full=m.length>=SQCAP;return `<div class="squad ${full?"full":""}" data-sq="${s.key}"><h3>Đội ${s.n} <span class="${full?"full":"mute"}">${m.length}/${SQCAP}</span></h3><div class="slist" data-squad="${s.key}" data-empty="${ADMIN?"Kéo thả vào đây":"Chưa có ai"}">${m.map(([u,x])=>mem(u,x)).join("")}</div></div>`}).join("")}</div></div>`}).join("")}
`;
}
function events(){
  const t=ymd(new Date()),ev=[...evs].sort((a,b)=>a.date.localeCompare(b.date));
  return `${ADMIN?`<div class="card"><h2>Tạo sự kiện</h2><form id="ef"><label for="et">Tên sự kiện</label><input id="et" required maxlength="60">
  <label for="ed">Ngày</label><input id="ed" type="date" required min="${t}"><label for="ex">Mô tả</label><textarea id="ex" rows="2" maxlength="200"></textarea>
  <button class="btn" style="margin-top:12px">Đăng sự kiện</button></form></div>`:""}
  <div class="card"><h2>Sự kiện của bang</h2>${ADMIN?"":'<p class="mute">Chỉ xem. Đương gia sẽ đăng sự kiện mới.</p>'}${ev.length?ev.map(e=>`<div class="row" style="align-items:flex-start"><div><b>${esc(e.title)}</b> ${e.date<t?'<span class="mute">(đã qua)</span>':""}<div class="mute">${fmtDate(e.date)}</div><div>${esc(e.desc||"")}</div></div>
  ${ADMIN?`<button class="btn danger" data-del="${esc(e.id)}">Xoá</button>`:""}</div>`).join(""):`<p class="empty">Chưa có sự kiện nào.</p>`}</div>`;
}
