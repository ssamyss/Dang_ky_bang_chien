/* Hằng số, danh sách phái/đội, hàm định dạng ngày và hàm tiện ích */
const SCHOOLS=["Thần Tương","Cửu Linh","Huyết Hà","Thiết Y","Tố Vấn","Long Ngâm","Toái Mông","Huyền Cơ"];
const TRI=`<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M32 12V60"/><path d="M14 14v11c0 8 8 13 18 13s18-5 18-13V14"/><path d="M25 46h14"/><path d="M32 3l5.5 10h-11z" fill="currentColor"/><path d="M14 5l5 9H9z" fill="currentColor"/><path d="M50 5l5 9h-10z" fill="currentColor"/></svg>`;
const SCH={"Thần Tương":["thantuong","#4667f6"],"Cửu Linh":["cuulinh","#9351f5"],"Huyết Hà":["huyetha","#f17761"],"Thiết Y":["thietyi","#f7cb77"],"Tố Vấn":["tovan","#f59f9f"],"Long Ngâm":["longngam","#7cf2c7"],"Toái Mông":["toaimong","#a8ebe5"],"Huyền Cơ":["huyenco","#f5ea97"]};
const ico=(s,c="")=>SCH[s]?`<img class="ico ${c}" src="/img/${SCH[s][0]}.png" alt="" width="28" height="28">`:"";
const sc=s=>SCH[s]?`style="--sc:${SCH[s][1]}"`:"";
const TEAMS=[["mid","Thủ mid",30],["tru","Đánh trụ",12],["canh","Cánh",18]],SQCAP=6,SQUADS=[];
TEAMS.forEach(t=>{for(let i=1;i<=t[2]/SQCAP;i++)SQUADS.push({key:t[0]+i,big:t[0],n:i})});
const squadName=k=>{const s=SQUADS.find(x=>x.key===k);return s?TEAMS.find(t=>t[0]===s.big)[1]+" · Đội "+s.n:"Chưa xếp"};
const RM=matchMedia("(prefers-reduced-motion:reduce)").matches;let dragging=false,flashSq=null;
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const fmtDate=s=>{const[a,b,c]=s.split("-");return c+"/"+b+"/"+a};
function warDate(){const d=new Date();let diff=(6-d.getDay()+7)%7;if(diff===0&&d.getHours()>=22)diff=7;d.setDate(d.getDate()+diff);return ymd(d)}
let WD=warDate();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
