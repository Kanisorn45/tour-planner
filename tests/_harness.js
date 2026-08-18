/* ============================================================
   ตัวช่วยเขียนเทสต์ — ถูกฉีดเข้าไปในหน้าแอปโดยตรง
   ต้องอยู่ในสโคปเดียวกับแอป เพราะ S / parseDur / recalc ประกาศด้วย
   let และ const จึงไม่ติดอยู่บน window เข้าถึงจากนอกหน้าไม่ได้
   ============================================================ */
var __groups = [];
var __cur = null;
var __base = null;

function group(name, fn){ __groups.push({name:name, fn:fn, tests:[]}); }
function test(name, fn){ if(__cur) __cur.tests.push({name:name, fn:fn}); }

function fail(msg){ var e=new Error(msg); e.__assert=true; throw e; }

/* เทียบแบบตรงตัว — ใช้ JSON เทียบให้ครอบทั้ง array และ object */
function eq(got, want, label){
  var a=JSON.stringify(got), b=JSON.stringify(want);
  if(a!==b) fail((label?label+': ':'')+'ได้ '+a+' ควรได้ '+b);
}
function ok(v, label){ if(!v) fail((label?label+': ':'')+'ได้ '+JSON.stringify(v)+' ควรเป็นจริง'); }
function no(v, label){ if(v) fail((label?label+': ':'')+'ได้ '+JSON.stringify(v)+' ควรเป็นเท็จ'); }
/* ใช้กับตัวเลขที่ยอมให้คลาดได้เล็กน้อย */
function near(got, want, tol, label){
  if(typeof got!=='number'||Math.abs(got-want)>(tol||0))
    fail((label?label+': ':'')+'ได้ '+got+' ควรใกล้ '+want+' (±'+(tol||0)+')');
}

/* คืนสภาพ S ให้เหมือนตอนแอปเพิ่งเปิด — กันเทสต์ตัวก่อนทิ้งขยะไว้ให้ตัวถัดไป */
function reset(){
  if(!__base) return;
  Object.keys(S).forEach(function(k){ delete S[k]; });
  var clone=JSON.parse(__base);
  Object.keys(clone).forEach(function(k){ S[k]=clone[k]; });
  S.adm=[]; S.res=[]; S.guideCount={}; S.carSel=[]; S.hotelSel=[];
  S.customAdm=[]; S.customRes=[];
  S.hotels=[]; S.transferOff={in:true,out:true};
  S.ref={areas:[],routes:[]};
  S.dayStart={}; S.tlStart=480; S.tlOn=true; S.itinTime=false;
  S.days=1; S.startDate='2026-08-18'; S.endDate='2026-08-18';
  S.paxTypes=[{id:'p',code:'S',label:'ลูกทัวร์',count:4,pay:true}];
  if(typeof refRebuild==='function') refRebuild();
  if(typeof dbRefreshAll==='function') dbRefreshAll();
}

/* ---- ชุดข้อมูลตัวอย่างที่หลายไฟล์ใช้ร่วมกัน ----
   2 โซนในจังหวัดเดียว + 1 โซนอีกจังหวัด · ครอบเคสข้ามโซนและข้ามจังหวัด */
function fixture(){
  S.ref={
    areas:[{prov:'นครศรีธรรมราช',zone:'ในเมือง'},
           {prov:'นครศรีธรรมราช',zone:'ขนอม'},
           {prov:'กระบี่',zone:'อ่าวนาง'}],
    routes:[{from:'=',to:'=',mins:15},
            {from:'นครศรีธรรมราช/*',to:'นครศรีธรรมราช/*',mins:60},
            {from:'กระบี่/*',to:'กระบี่/*',mins:40},
            {from:'นครศรีธรรมราช/*',to:'กระบี่/*',mins:180},
            {from:'ในเมือง',to:'ขนอม',mins:90}]
  };
  S.customAdm=[
    {id:'A',area:'นครศรีธรรมราช',zone:'ในเมือง',th:'วัดA',en:'Wat A',item:'ค่าเข้าชม',
     price:100,unit:'บาท/ท่าน',dur:45,open:480,close:1020},
    {id:'B',area:'นครศรีธรรมราช',zone:'ในเมือง',th:'วัดB',en:'Wat B',price:50,unit:'บาท/ท่าน',dur:30},
    {id:'C',area:'นครศรีธรรมราช',zone:'ขนอม',th:'หาดC',en:'Beach C',price:0,unit:'บาท/ท่าน',dur:60},
    {id:'D',area:'นครศรีธรรมราช',zone:'ในเมือง',th:'ปิดจันทร์',en:'Closed Mon',price:50,unit:'บาท/ท่าน',dur:60,closed:[1]},
    {id:'E',area:'นครศรีธรรมราช',zone:'ในเมือง',th:'เปิดบ่าย',en:'Opens Late',price:50,unit:'บาท/ท่าน',dur:30,open:780},
    {id:'F',area:'นครศรีธรรมราช',zone:'ในเมือง',th:'ไม่มีdur',en:'No Dur',price:0,unit:'บาท/ท่าน'},
    {id:'Z',area:'ภูเก็ต',zone:'ป่าตอง',th:'ไกลมาก',en:'Far Away',price:0,unit:'บาท/ท่าน',dur:30}
  ];
  S.customRes=[
    {id:'R',area:'นครศรีธรรมราช',zone:'ในเมือง',th:'ร้านR',en:'Res R',price:250,unit:'บาท/ท่าน',dur:60},
    {id:'R2',area:'นครศรีธรรมราช',zone:'ขนอม',th:'ร้านD',en:'Res D',price:300,unit:'บาท/ท่าน',dur:60}
  ];
  refRebuild(); dbRefreshAll();
}
/* โรงแรมสำหรับทดสอบหมุดต้นวัน-ท้ายวัน */
function fixtureHotel(zone){
  S.hotels=[{id:'H',area:'นครศรีธรรมราช',zone:zone||'ในเมือง',
    nameTh:'โรงแรมH',nameEn:'Hotel H',name:'Hotel H',stars:4,
    roomTypes:[{id:'rt1',room:'Standard',bedPrimary:'TWN',bedExtra:false,price:1200}]}];
  S.hotelSel=[{id:'hs',hotelId:'H',rtId:'rt1',rooms:2,nights:[1]}];
}
/* ดักข้อความที่ถูกส่งเข้าคลิปบอร์ด เพื่อตรวจผลของปุ่มคัดลอก */
function captureCopy(fn){
  var got=[], orig=copyText;
  copyText=function(txt){ got.push(txt); };
  try{ fn(); } finally { copyText=orig; }
  return got;
}
