/* Output ที่ส่งลูกค้า — ทั้ง 4 ช่องทางต้องมาจาก dayBlock ตัวเดียวกัน
   ไม่งั้นลูกค้าจะเห็นโปรแกรมไม่ตรงกันในแต่ละช่องทาง */
function progFixture(){
  reset(); fixture(); fixtureHotel('ขนอม');
  S.quoteName='GST1808NST';
  S.days=2; S.startDate='2026-08-18'; S.endDate='2026-08-19'; S.tlStart=480;
  S.adm=[
    {id:'i1',ref:'cA',day:1,units:null,price:100},
    {id:'m1',kind:'meal',meal:'Lunch',day:1,price:0},
    {id:'i3',ref:'cC',day:1,units:null,price:0},
    {id:'m2',kind:'meal',meal:'Dinner',day:1,price:0}
  ];
  S.res=[{id:'r1',ref:'cR',day:1,meal:'Lunch',price:250},
         {id:'r2',ref:'cR2',day:1,meal:'Dinner',price:300}];
  recalc();
}

group('dayBlock · แหล่งข้อมูลเดียวของทุก Output', function(){

  test('เก็บครบทุกฟิลด์', function(){
    progFixture(); S.itinTime=false;
    var b=dayBlock(1);
    eq(b.places.length, 2, 'สถานที่ 2 แห่ง มื้ออาหารไม่นับ');
    eq(b.timed, null, 'ปิดโหมดเวลา');
    ok(!!b.lunch,'มื้อกลางวัน');
    ok(!!b.dinner,'มื้อเย็น');
    ok(!!b.hotel,'ที่พักคืน 1');
    ok(!!b.dt,'วันที่');
  });

  test('เปิดโหมดเวลา ได้ลำดับพร้อมเวลา', function(){
    progFixture(); S.itinTime=true;
    var b=dayBlock(1);
    eq(b.timed.length, 4, 'สถานที่ 2 + มื้อ 2 เรียงตามลำดับจริง');
    eq(b.timed[0].t, '08:00');
    /* A(45) -> 15 -> Lunch(60) -> 90 -> C(60) -> 15 -> Dinner */
    eq(b.timed[1].t, '09:00');
    eq(b.timed[2].t, '11:30');
    eq(b.timed[3].t, '12:45');
  });

  test('ป้ายท้ายวัน: โหมดปกติมี 3 โหมดเวลาเหลือแค่ที่พัก', function(){
    progFixture();
    S.itinTime=false;
    eq(daySubs(dayBlock(1)).length, 3, 'กลางวัน + เย็น + ที่พัก');
    S.itinTime=true;
    var s=daySubs(dayBlock(1));
    eq(s.length, 1, 'มื้ออาหารอยู่ในลำดับแล้ว ไม่ต้องซ้ำ');
    ok(s[0][0].indexOf('พัก')>=0);
  });

  test('วันที่ไม่มีรายการ', function(){
    progFixture();
    eq(dayBlock(2).places.length, 0);
  });
});

group('ทั้ง 4 ช่องทางให้เวลาตรงกัน', function(){

  test('หน้า Itinerary กับหน้า Confirm ตรงกัน', function(){
    progFixture(); S.itinTime=true;
    renderItinerary(); renderConfirm();
    var a=[].map.call(document.querySelectorAll('#itinBody .itl-t'), function(e){ return e.textContent; });
    var b=[].map.call(document.querySelectorAll('#confirmBody .itl-t'), function(e){ return e.textContent; });
    ok(a.length>=4, 'Itinerary มีเวลา');
    ok(b.length>=4, 'Confirm มีเวลา');
    eq(a.slice(0,4).join(','), b.slice(0,4).join(','));
  });

  test('ข้อความที่คัดลอกมีเวลาและไม่ซ้ำมื้อ', function(){
    progFixture(); S.itinTime=true;
    var txt=captureCopy(copyItinerary)[0];
    ok(/08:00\s+Wat A/.test(txt), 'มีเวลานำหน้าชื่อ');
    ok(txt.indexOf('Hotel H')>=0, 'มีที่พัก');
    eq((txt.match(/Res R/g)||[]).length, 1, 'ชื่อร้านต้องโผล่ครั้งเดียว');
  });

  test('รูปภาพสร้างได้ทั้งสองโหมด และโหมดเวลาสูงกว่า', function(){
    progFixture();
    S.itinTime=true;
    var cv1=buildProgramImage(true);
    ok(cv1 && cv1.width>0 && cv1.height>0, 'รูปโหมดเวลา');
    S.itinTime=false;
    var cv2=buildProgramImage(true);
    ok(cv2 && cv2.height>0, 'รูปโหมดปกติ');
    ok(cv1.height>cv2.height, 'โหมดเวลาแยกบรรทัดจึงสูงกว่า');
  });

  test('รูปไม่ใส่ราคาก็สร้างได้', function(){
    progFixture();
    var withP=buildProgramImage(true), noP=buildProgramImage(false);
    ok(withP.height>noP.height, 'ตัดกล่องราคาออกแล้วเตี้ยลง');
  });
});

group('ปิดสวิตช์แล้วกลับไปรูปแบบเดิมทุกช่องทาง', function(){

  test('ไม่มีคอลัมน์เวลา แต่ยังมีสถานที่และมื้อครบ', function(){
    progFixture(); S.itinTime=false;
    renderItinerary(); renderConfirm();
    eq(document.querySelectorAll('#itinBody .itl-t').length, 0);
    eq(document.querySelectorAll('#confirmBody .itl-t').length, 0);
    ok(document.querySelectorAll('#itinBody .itin-places').length>0, 'ยังมีแถวสถานที่');
    ok(document.querySelectorAll('#confirmBody .itin-sub-line').length>=3, 'มื้อกลับมาท้ายวัน');
  });

  test('วันว่างยังขึ้น Free & Easy', function(){
    progFixture(); S.itinTime=true;
    renderItinerary();
    ok(document.querySelectorAll('#itinBody .itin-free').length>=1);
  });

  test('ข้อความที่คัดลอกโหมดปกติยังมีมื้อท้ายวัน', function(){
    progFixture(); S.itinTime=false;
    var txt=captureCopy(copyItinerary)[0];
    ok(txt.indexOf('Res R')>=0);
    ok(txt.indexOf('Res D')>=0);
    ok(txt.indexOf('Hotel H')>=0);
  });
});

group('ชื่อรายการที่ลูกค้าเห็น · itinName', function(){
  test('ตัดคำว่า ค่าเข้า ออกจากชื่อ', function(){
    progFixture();
    eq(itinName({ref:'cA',day:1},1), 'Wat A', 'item = "ค่าเข้าชม" ต้องไม่ติดมา');
  });
  test('ชื่อที่ผู้ใช้แก้เองชนะ', function(){
    progFixture();
    eq(itinName({ref:'cA',day:1,name:'ชื่อที่แก้เอง'},1), 'ชื่อที่แก้เอง');
  });
  test('มื้ออาหารผูกกับร้านของวันนั้น', function(){
    progFixture();
    ok(itinName({kind:'meal',meal:'Lunch',day:1},1).indexOf('Res R')>=0);
  });
});
