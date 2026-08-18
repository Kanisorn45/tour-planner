/* v27 · ฟอร์มเพิ่ม/แก้ ต้องกรอกช่องที่ใช้กับไทม์ไลน์และราคาตามช่วง PAX ได้
   เดิมช่องพวกนี้มีแต่ในคอลัมน์ชีต กรอกจากแอปไม่ได้เลย */
function openForm(tab){ openDb(tab); showDbForm(null); }
function setVal(id,v){ var e=document.getElementById(id); if(e)e.value=v; return !!e; }

group('ฟอร์มมีช่องครบตามคอลัมน์ในชีต', function(){

  test('สถานที่ — มีช่องโซน ใช้เวลา เปิด ปิด', function(){
    reset(); openForm('adm');
    ok(document.getElementById('dfZone'),  'โซน');
    ok(document.getElementById('dfDur'),   'ใช้เวลา');
    ok(document.getElementById('dfOpen'),  'เปิด');
    ok(document.getElementById('dfClose'), 'ปิด');
    ok(document.getElementById('dfClosed'),'วันหยุด (ของเดิม)');
  });

  test('ร้านอาหาร — มีครบเหมือนกัน', function(){
    reset(); openForm('res');
    ok(document.getElementById('dfZone'));
    ok(document.getElementById('dfDur'));
    ok(document.getElementById('dfOpen'));
    ok(document.getElementById('dfClose'));
  });

  test('ไม่มีแท็บ Tiers = ไม่โชว์ช่องราคาตามขนาดกรุ๊ป', function(){
    reset(); S.ref={areas:[],routes:[],tiers:[]}; refRebuild();
    openForm('adm');
    no(document.getElementById('dfT0'), 'ไม่ควรมีช่องที่ยังไม่มีความหมาย');
  });

  test('มีแท็บ Tiers = โชว์ช่องเท่าจำนวนช่วงจริง', function(){
    reset(); fixture(); openForm('adm');
    eq(document.querySelectorAll('#dbFormFields .tier-row input').length, REF.tiers.length);
    ok(document.getElementById('dfT0'));
    ok(document.getElementById('dfT'+(REF.tiers.length-1)));
  });
});

group('บันทึกแล้วค่าเข้าไปจริง', function(){

  test('สถานที่ — เก็บครบทุกช่อง', function(){
    reset(); fixture(); openForm('adm');
    setVal('dfNameTh','วัดทดสอบ'); setVal('dfNameEn','Test Wat'); setVal('dfPrice','50');
    setVal('dfZone','ในเมือง'); setVal('dfDur','1 ชม 30 นาที');
    setVal('dfOpen','08:00'); setVal('dfClose','17:00');
    setVal('dfT0','100'); setVal('dfT1','90');
    saveDbForm();
    var rec=S.customAdm[S.customAdm.length-1];
    eq(rec.zone,'ในเมือง');
    eq(rec.dur,90,'"1 ชม 30 นาที" ต้องเป็น 90');
    eq(rec.open,480);
    eq(rec.close,1020);
    eq(rec.tiers,[100,90,null,null],'ช่องว่างเก็บเป็น null');
  });

  test('ร้านอาหาร — เก็บครบเหมือนกัน', function(){
    reset(); fixture(); openForm('res');
    setVal('dfNameTh','ร้านทดสอบ'); setVal('dfPrice','250');
    setVal('dfZone','ขนอม'); setVal('dfDur','45');
    saveDbForm();
    var rec=S.customRes[S.customRes.length-1];
    eq(rec.zone,'ขนอม');
    eq(rec.dur,45);
  });

  test('เว้นว่างไว้ = ไม่เก็บค่า ไม่ใช่เก็บเป็น 0', function(){
    reset(); fixture(); openForm('adm');
    setVal('dfNameTh','ไม่กรอกอะไรเพิ่ม'); setVal('dfPrice','50');
    saveDbForm();
    var rec=S.customAdm[S.customAdm.length-1];
    eq(rec.zone,null); eq(rec.dur,null); eq(rec.open,null); eq(rec.close,null);
    eq(rec.tiers,null);
  });

  test('เปิดแก้ของเดิม ค่าที่เคยกรอกต้องขึ้นมาให้เห็น', function(){
    reset(); fixture();
    openDb('adm'); showDbForm('cA');   /* cA มี dur 45 · open 08:00 · close 17:00 */
    eq(document.getElementById('dfZone').value,'ในเมือง');
    eq(document.getElementById('dfOpen').value,'08:00');
    eq(document.getElementById('dfClose').value,'17:00');
    ok(document.getElementById('dfDur').value.indexOf('45')>=0, 'ใช้เวลาต้องขึ้นมา');
    eq(document.getElementById('dfT0').value,'100');
  });

  test('อ่านเวลาแบบไหนก็ได้เหมือนตอนนำเข้าจากชีต', function(){
    reset(); fixture(); openForm('adm');
    setVal('dfNameTh','x'); setVal('dfPrice','0');
    setVal('dfDur','ชั่วโมงครึ่ง'); setVal('dfOpen','8'); setVal('dfClose','5:30 pm');
    saveDbForm();
    var rec=S.customAdm[S.customAdm.length-1];
    eq(rec.dur,90); eq(rec.open,480); eq(rec.close,1050);
  });

  test('ค่าที่บันทึกไหลไปถึงไทม์ไลน์จริง', function(){
    reset(); fixture(); openForm('adm');
    setVal('dfNameTh','จุดใหม่'); setVal('dfPrice','0');
    setVal('dfZone','ในเมือง'); setVal('dfDur','30');
    saveDbForm();
    var rec=S.customAdm[S.customAdm.length-1];
    S.tlStart=480;
    S.adm=[{id:'i1',ref:'c'+rec.id,day:1,units:null,price:0}];
    rebuildTL();
    eq(fmtClock(TL.i1.at),'08:00');
    eq(fmtClock(TL.i1.leave),'08:30','ใช้ 30 นาทีที่กรอกในฟอร์ม');
    no(TL.i1.guess,'ต้องไม่ถูกนับเป็นค่าประมาณ');
  });
});
