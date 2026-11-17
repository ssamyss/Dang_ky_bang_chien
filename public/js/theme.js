/* Chọn giao diện: "thuymac" (Thủy Mặc, sáng) hoặc "dahan" (Dạ Hàn, tối). Nhớ lựa chọn trên trình duyệt. */
(function(){
  var K="bh_theme",t="thuymac";
  try{t=localStorage.getItem(K)||t}catch(e){}
  if(t!=="dahan"&&t!=="thuymac")t="thuymac";
  var root=document.documentElement;root.dataset.theme=t;
  var SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"/></svg>';
  function meta(){var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=root.dataset.theme==="thuymac"?"#efe6d2":"#070d13"}
  document.addEventListener("DOMContentLoaded",function(){
    var b=document.getElementById("theme");if(!b)return;
    function sync(){var day=root.dataset.theme==="thuymac",tip=day?"Chuyển sang giao diện Dạ Hàn (tối)":"Chuyển sang giao diện Thủy Mặc (sáng)";b.title=tip;b.setAttribute("aria-label",tip);b.innerHTML=day?MOON:SUN;meta()}
    b.onclick=function(){
      root.dataset.theme=root.dataset.theme==="thuymac"?"dahan":"thuymac";
      try{localStorage.setItem(K,root.dataset.theme)}catch(e){}
      sync();if(window.gsap)gsap.fromTo(".bg",{opacity:.4},{opacity:1,duration:.7,ease:"power2.out"});
    };
    sync();
  });
})();
