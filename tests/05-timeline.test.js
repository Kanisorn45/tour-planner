/* ไทม์ไลน์รายวัน — เดินไล่รายการตามลำดับใน S.adm แล้วสะสมเวลา
   เดินทาง -> ถึง -> ใช้เวลา -> ออก */
function dayOf(items, res){
  S.adm=items;
  if(res)S.res=res;
  rebuildTL();
  return TLDay[1];
}

group('ลำดับเวลาในหนึ่งวัน', function(){

  test('เริ่ม 08:00 แล้วไหลต่อทั้งวัน', function(){
    reset(); fixture(); S.tlStart=480;
    /* A(45) -> ในโซน 15 -> B(30) -> ในโซน 15 -> Lunch(60) -> ข้ามโซน 90 -> C(60) */
    var sum=dayOf([
      {id:'i1',ref:'cA',day:1,units:null,price:100},
      {id:'i2',ref:'cB',day:1,units:null,price:50},
      {id:'m1',kind:'meal',meal:'Lunch',day:1,price:0},
      {id:'i3',ref:'cC',day:1,units:null,price:0}
    ],[{id:'r1',ref:'cR',day:1,meal:'Lunch',price:250}]);

    eq(fmtClock(TL.i1.at),'08:00');   eq(fmtClock(TL.i1.leave),'08:45');
    eq(TL.i1.travel, null, 'รายการแรกไม่มีเดินทางเพราะยังไม่มีโรงแรมคืนก่อน');
    eq(TL.i2.travel, 15);
    eq(fmtClock(TL.i2.at),'09:00');   eq(fmtClock(TL.i2.leave),'09:30');
    eq(TL.m1.travel, 15);
    eq(fmtClock(TL.m1.at),'09:45');   eq(fmtClock(TL.m1.leave),'10:45');
    eq(TL.i3.travel, 90, 'ในเมือง -> ขนอม');
    eq(fmtClock(TL.i3.at),'12:15');   eq(fmtClock(TL.i3.leave),'13:15');
    eq(fmtClock(sum.end),'13:15');
    eq(sum.travel, 120);
    eq(sum.unknown, 0);
    eq(sum.warns.length, 0);
  });

  test('เปลี่ยนเวลาเริ่มวัน ทุกอย่างเลื่อนตาม', function(){
    reset(); fixture(); S.tlStart=480;
    /* ใช้ cB ที่ไม่มีเวลาเปิด-ปิด เพื่อวัดผลของเวลาเริ่มวันล้วน ๆ
       ถ้าใช้ cA ที่เปิด 08:00 จะไปชนกฎ "รอถึงเวลาเปิด" แล้ววัดไม่ได้ */
    dayOf([{id:'i1',ref:'cB',day:1,units:null,price:50}]);
    eq(fmtClock(TL.i1.at),'08:00');
    S.dayStart={1:540}; rebuildTL();
    eq(fmtClock(TL.i1.at),'09:00','ตั้งเฉพาะวันที่ 1');
    S.dayStart={}; S.tlStart=420; rebuildTL();
    eq(fmtClock(TL.i1.at),'07:00','ตั้งเป็นค่ากลางทุกวัน');
    eq(TLDay[1].start, 420);
  });

  test('เริ่มวันเช้ากว่าเวลาเปิด ระบบต้องรอไม่ใช่เข้าเลย', function(){
    reset(); fixture();
    S.tlStart=420;   /* 07:00 แต่ cA เปิด 08:00 */
    dayOf([{id:'i1',ref:'cA',day:1,units:null,price:100}]);
    eq(TLDay[1].start, 420, 'วันเริ่ม 07:00 ตามที่ตั้ง');
    eq(fmtClock(TL.i1.at),'08:00','แต่เข้าได้ตอน 08:00');
    eq(TL.i1.wait, 60, 'นับเวลารอ 1 ชม.');
    ok(TL.i1.warns.join(' ').indexOf('ก่อนเปิด')>=0);
  });

  test('ใช้เวลาที่กรอกเองชนะค่าจากชีต และถอนได้', function(){
    reset(); fixture(); S.tlStart=480;
    dayOf([{id:'i1',ref:'cA',day:1,units:null,price:100}]);
    eq(fmtClock(TL.i1.leave),'08:45','ค่าจากชีต 45 นาที');
    S.adm[0].dur=120; rebuildTL();
    eq(fmtClock(TL.i1.leave),'10:00');
    delete S.adm[0].dur; rebuildTL();
    eq(fmtClock(TL.i1.leave),'08:45','ถอนแล้วกลับไปใช้ค่าชีต');
  });

  test('ไม่มี ใช้เวลา ในชีต = ใช้ 60 นาที แต่ทำเครื่องหมายว่าเดา', function(){
    reset(); fixture();
    dayOf([{id:'iy',ref:'cF',day:1,units:null,price:0}]);
    eq(TL.iy.dur, 60);
    ok(TL.iy.guess, 'ต้องรู้ว่าเป็นค่าประมาณ');
    ok(tlBadge(S.adm[0]).indexOf('guess')>=0, 'ป้ายต้องมีคลาส guess ให้เห็นต่าง');
  });

  test('รายการที่มีค่าจากชีต ไม่ถูกทำเครื่องหมายว่าเดา', function(){
    reset(); fixture();
    dayOf([{id:'i1',ref:'cA',day:1,units:null,price:100}]);
    no(TL.i1.guess);
  });
});

group('เวลาตรึง สำหรับของที่เลื่อนไม่ได้', function(){

  test('ตรึงแล้วรายการถัดไปเลื่อนตาม และนับเวลารอ', function(){
    reset(); fixture(); S.tlStart=480;
    dayOf([
      {id:'i1',ref:'cA',day:1,units:null,price:100},
      {id:'i2',ref:'cB',day:1,units:null,price:50,at:660},
      {id:'m1',kind:'meal',meal:'Lunch',day:1,price:0}
    ],[{id:'r1',ref:'cR',day:1,meal:'Lunch',price:250}]);
    eq(fmtClock(TL.i2.at),'11:00');
    ok(TL.i2.wait>0,'ต้องมีเวลารอ');
    ok(TL.i2.pinned,'ต้องรู้ว่าถูกตรึง');
    eq(fmtClock(TL.m1.at),'11:45','ของถัดไปเลื่อนตาม');
  });

  test('ตรึงเวลาที่ไปถึงไม่ทัน ต้องเตือน', function(){
    reset(); fixture(); S.tlStart=480;
    dayOf([
      {id:'i1',ref:'cA',day:1,units:null,price:100,dur:600},
      {id:'i2',ref:'cB',day:1,units:null,price:50,at:540}
    ]);
    ok(TL.i2.warns.length>0,'ต้องมีคำเตือน');
    ok(TL.i2.warns.join(' ').indexOf('ตรึง')>=0);
  });
});

group('คำเตือนที่ต้องจับได้', function(){

  test('ไปถึงตอนปิดแล้ว', function(){
    reset(); fixture();
    S.tlStart=1020;   /* 17:00 = เวลาปิดของ A */
    var sum=dayOf([{id:'i1',ref:'cA',day:1,units:null,price:100}]);
    ok(sum.warns.some(function(w){ return w.indexOf('ปิด')>=0; }));
  });

  test('ยังไม่เปิด ต้องรอ', function(){
    reset(); fixture(); S.tlStart=480;
    dayOf([{id:'i8',ref:'cE',day:1,units:null,price:50}]);
    eq(fmtClock(TL.i8.at),'13:00','เลื่อนไปเวลาเปิด');
    eq(TL.i8.wait, 300);
    ok(TL.i8.warns.join(' ').indexOf('ก่อนเปิด')>=0);
  });

  test('ปิดทำการวันนี้ (18 ส.ค. 2026 = อังคาร, ทดสอบด้วยจันทร์)', function(){
    reset(); fixture();
    S.startDate='2026-08-17'; S.endDate='2026-08-17';   /* จันทร์ */
    var sum=dayOf([{id:'i9',ref:'cD',day:1,units:null,price:50}]);
    ok(sum.warns.some(function(w){ return w.indexOf('ปิดทำการวันนี้')>=0; }));
  });

  test('วันจบดึกเกินที่ตั้งไว้', function(){
    reset(); fixture(); S.tlStart=1140; S.tlLate=1200;   /* เริ่ม 19:00 เตือนหลัง 20:00 */
    var sum=dayOf([{id:'i1',ref:'cA',day:1,units:null,price:100,dur:180}]);
    ok(sum.warns.some(function(w){ return w.indexOf('ดึกกว่า')>=0; }));
  });

  test('ไม่รู้เวลาเดินทาง = ไม่เดา', function(){
    reset(); fixture(); S.tlStart=480;
    var sum=dayOf([
      {id:'i1',ref:'cA',day:1,units:null,price:100},
      {id:'iz',ref:'cZ',day:1,units:null,price:0}
    ]);
    ok(TL.iz.travelUnknown,'ต้องรู้ว่าไม่มีข้อมูล');
    eq(TL.iz.travel, null,'ห้ามเดาตัวเลข');
    eq(sum.unknown, 1,'หัววันต้องบอกว่าขาดกี่ช่วง');
    ok(tlTravelRow(S.adm[1]).indexOf('—')>=0,'แถวเดินทางต้องแสดงขีด');
  });
});

group('หมุดโรงแรมต้นวันและท้ายวัน', function(){

  test('มีโรงแรมคืนก่อน = คิดเวลาออกจากที่พัก', function(){
    reset(); fixture(); fixtureHotel('ขนอม');
    S.days=2; S.endDate='2026-08-19'; S.tlStart=480;
    S.adm=[{id:'i1',ref:'cA',day:2,units:null,price:100}];
    rebuildTL();
    eq(TL.i1.travel, 90, 'ขนอม -> ในเมือง');
    eq(fmtClock(TL.i1.at),'09:30');
  });

  test('มีโรงแรมคืนนี้ = คิดเวลากลับเข้าที่พัก', function(){
    reset(); fixture(); fixtureHotel('ขนอม');
    S.days=2; S.endDate='2026-08-19'; S.tlStart=480;
    var sum=dayOf([{id:'i1',ref:'cA',day:1,units:null,price:100}]);
    eq(sum.backTravel, 90);
    eq(sum.backName, 'Hotel H');
    eq(fmtClock(sum.end),'10:15','08:00 +45 +90 กลับโรงแรม');
  });
});

group('ปิดไทม์ไลน์แล้วต้องไม่มีอะไรโผล่', function(){
  test('ไม่มีป้ายและไม่มีแถวเดินทาง', function(){
    reset(); fixture();
    dayOf([{id:'i1',ref:'cA',day:1,units:null,price:100},
           {id:'i2',ref:'cB',day:1,units:null,price:50}]);
    S.tlOn=false;
    eq(tlBadge(S.adm[0]), '');
    eq(tlTravelRow(S.adm[1]), '');
    S.tlOn=true;
    ok(tlBadge(S.adm[0]).length>0,'เปิดกลับมาต้องมี');
  });
});
