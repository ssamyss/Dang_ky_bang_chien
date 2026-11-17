/* Màn hình đăng nhập / đăng ký */
function authView(){
  const reg=authMode==="register",first=S&&S.first;
  return `<div class="auth card"><div class="seal" aria-hidden="true">${TRI}</div><h1>IMMORTAL</h1><div class="tag">逆水寒 · Nghịch Thủy Hàn</div>
  <p class="mute">${reg?"Tạo tài khoản thành viên mới. Tài khoản cần được Admin hoặc quản trị viên duyệt trước khi dùng.":"Đăng nhập để báo danh bang chiến."}</p>
  ${notice?`<p class="okmsg" role="status">${notice}</p>`:""}<form id="f"><label for="u">Tên tài khoản</label><input id="u" autocomplete="username" required maxlength="24" placeholder="Nên đặt trùng tên nhân vật trong game">
  <label for="p">Mật khẩu</label><input id="p" type="password" autocomplete="${reg?"new-password":"current-password"}" required minlength="6">
  ${reg&&S&&S.needCode?`<label for="c">Mã mời của bang</label><input id="c" required>`:""}
  <div class="err" id="e" role="alert"></div><button class="btn" style="width:100%;margin-top:8px">${reg?"Tạo tài khoản":"Đăng nhập"}</button></form>
  <p style="margin-top:16px;text-align:center" class="mute">${reg?"Đã có tài khoản?":"Chưa có tài khoản?"} <a href="#" id="sw">${reg?"Đăng nhập":"Đăng ký"}</a></p></div>`;
}
document.addEventListener("submit",async e=>{
  if(e.target.id!=="f")return;e.preventDefault();const err=document.getElementById("e"),c=document.getElementById("c");
  try{await api("POST",authMode==="register"?"/api/register":"/api/login",{name:document.getElementById("u").value,pass:document.getElementById("p").value,code:c&&c.value});
    if(authMode==="register"){notice="Đăng ký thành công! Tài khoản đang chờ Admin hoặc quản trị viên duyệt. Sau khi được duyệt bạn có thể đăng nhập.";authMode="login";return render()}
    notice="";await load();animate=true;render()}catch(x){err.textContent=x.message}});
document.addEventListener("click",e=>{if(e.target.id==="sw"){e.preventDefault();authMode=authMode==="login"?"register":"login";notice="";render()}});
