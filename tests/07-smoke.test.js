/* เทสต์กันของเดิมพัง — ต้องผ่านทั้งไฟล์ตัวจริงที่มีข้อมูล
   และ index.html ที่ถอดข้อมูลออกแล้ว จึงห้ามอ้างจำนวนรายการในฐานข้อมูล */
group('แอปยังทำงานครบ', function(){

  test('หน้าเว็บวาดเสร็จ', function(){
    eq(document.querySelectorAll('#pageTabs button').length, 5, 'แท็บ 5 หน้า');
    ok(document.getElementById('admItems'), 'กล่องรายการสถานที่');
    ok(document.getElementById('confirmBody'), 'หน้า Confirm');
  });

  test('recalc คืนตัวเลขครบ', function(){
    reset();
    var t=recalc();
    eq(typeof t, 'object');
    ['a','c','g','r','h','cost','costHead','sellHead','sellTotal','profitTotal','pay'].forEach(function(k){
      ok(typeof t[k]==='number', 'ต้องมี '+k+' เป็นตัวเลข');
    });
  });

  test('ฟังก์ชันวาดหลักไม่โยน error', function(){
    reset();
    [renderAdm,renderRes,renderCarItems,renderHotelItems,renderGuideGroups,
     renderAdmTable,fillResSelect,renderChips,renderOverview,renderConfirm,
     renderItinerary,renderDashboard,renderHome].forEach(function(fn){
      fn();
    });
    ok(true);
  });

  test('เปิดหน้าฐานข้อมูลได้ทุกแท็บ', function(){
    ['adm','res','car','hotel'].forEach(function(t){
      openDb(t); renderDbList();
    });
    document.getElementById('dbModal').classList.remove('open');
    ok(true);
  });

  test('โครงฐานข้อมูลถูกต้อง (ไม่อ้างจำนวน เพราะไฟล์ที่ deploy ว่าง)', function(){
    ok(Array.isArray(DB.admissions));
    ok(Array.isArray(DB.restaurants));
    ok(Array.isArray(DB.guides));
    ok(DB.admAreas.length>0, 'ต้องเหลือรายชื่อจังหวัดไว้ ไม่งั้นหน้าจอพัง');
    ok(DB.resAreas.length>0);
  });

  test('เพิ่มข้อมูลเองได้ แม้ฐานข้อมูลจะว่าง', function(){
    reset();
    S.customAdm=[{id:'x1',area:DB.admAreas[0],th:'ทดสอบ',en:'T',price:100,unit:'บาท/ท่าน'}];
    dbRefreshAll();
    eq(admAll().length, DB.admissions.length+1);
  });

  test('คำนวณราคาต่อคนถูก', function(){
    reset();
    S.customAdm=[{id:'x1',area:DB.admAreas[0],th:'ท',en:'T',price:100,unit:'บาท/ท่าน'}];
    dbRefreshAll();
    S.adm=[{id:'i1',ref:'cx1',day:1,units:null,price:100}];
    S.paxTypes=[{id:'p',code:'S',label:'x',count:4,pay:true}];
    var t=recalc();
    eq(t.a, 400, '100 บาท x 4 คน');
  });

  test('รายการต่อคัน ไม่คูณจำนวนคน', function(){
    reset();
    S.customAdm=[{id:'x2',area:DB.admAreas[0],th:'ร',en:'R',price:1000,unit:'บาท/คัน'}];
    dbRefreshAll();
    S.adm=[{id:'i2',ref:'cx2',day:1,units:2,price:1000}];
    S.paxTypes=[{id:'p',code:'S',label:'x',count:4,pay:true}];
    var t=recalc();
    eq(t.a, 2000, '1000 x 2 คัน ไม่คูณคน');
  });

  test('บันทึกและกู้คืนโปรแกรมได้', function(){
    reset();
    S.quoteName='TEST-SAVE';
    var before=SAVED.length;
    saveTour();
    eq(SAVED.length, before+1);
    var rec=SAVED[0];
    eq(rec.name, 'TEST-SAVE');
    ok(rec.data, 'ต้องเก็บ state ไว้ทั้งก้อน');
    SAVED=SAVED.filter(function(r){ return r.name!=='TEST-SAVE'; });
  });

  test('แถวสำรองขึ้นแท็บ Programs มี 9 ช่องเท่าหัวตาราง', function(){
    var rows=progRows();
    eq(rows[0].length, 9);
    rows.forEach(function(r,i){ eq(r.length, 9, 'แถวที่ '+i+' ต้องยาวเท่ากัน'); });
  });

  test('ตัวช่วยวันที่ทำงานถูก', function(){
    reset();
    S.startDate='2026-08-18'; S.days=3;
    S.endDate=isoOf(addDays(parseISO(S.startDate),2));
    recomputeDaysFromDates();
    eq(S.days, 3);
    eq(isoOf(tripDate(3)), '2026-08-20');
  });

  test('สูตรจำนวนคนอ่านรู้เรื่อง', function(){
    reset();
    S.paxTypes=[{id:'a',code:'S',label:'x',count:3,pay:true},
                {id:'b',code:'TM',label:'y',count:1,pay:false}];
    eq(headTotal(), 4);
    eq(headPay(), 3);
    eq(paxFormula(), '3S + 1TM = 4 Pax');
    S.paxTypes=[{id:'a',code:'S',label:'x',count:4,pay:true}];
    eq(paxFormula(), '4 Pax', 'ประเภทเดียวไม่ต้องแสดงสูตร');
  });
});

group('ไม่มีข้อมูลอ้างอิงเลยก็ต้องไม่พัง', function(){
  test('ไม่มี Areas / Routes / Tiers', function(){
    reset();
    S.ref={areas:[],routes:[],tiers:[]};
    refRebuild();
    no(tiersOn());
    eq(REF.routes.size, 0);
    eq(REF.areas.zones.size, 0);
    S.adm=[];
    recalc();
    ok(true,'recalc ผ่านได้แม้ไม่มีข้อมูลอ้างอิง');
  });

  test('รายการที่อ้าง ref ที่หายไปแล้ว', function(){
    reset();
    S.adm=[{id:'ghost',ref:'cNOPE',day:1,units:null,price:50}];
    rebuildTL();
    eq(TL.ghost, null, 'ต้องข้ามไป ไม่โยน error');
    recalc();
    ok(true);
  });
});
