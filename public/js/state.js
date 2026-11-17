/* Biến trạng thái dùng chung của ứng dụng */
let S=null,notice="",authMode="login",ME=null,MYNAME="",OWNER=false,ADMIN=false,state="load",reg={},teams={},evs=[],tab="tong-quan",animate=true,flash=null;
const roleName=()=>OWNER?"Admin":ADMIN?"Quản trị viên":"Thành viên";
const count=k=>Object.keys(teams).filter(u=>teams[u]===k&&reg[u]&&reg[u].go).length;
