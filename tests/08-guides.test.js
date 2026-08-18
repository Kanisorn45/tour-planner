/* v25 · ไกด์เก็บเป็น "จำนวนตามประเภท" ไม่เก็บชื่อและเบอร์ของบุคคลอีกต่อไป
   ชื่อกับเบอร์ไกด์เป็นข้อมูลส่วนบุคคลของบุคคลที่สาม การไม่เก็บตั้งแต่แรก
   ปลอดภัยกว่าการเก็บแล้วไล่ป้องกันทีหลัง */
group('ไม่มีข้อมูลส่วนบุคคลหลงเหลือ', function(){

  test('ฐานข้อมูลไกด์เหลือแค่ประเภท', function(){
    ok(Array.isArray(DB.guides));
    DB.guides.forEach(function(g,i){
      eq(Object.keys(g).sort(), ['type'], 'ไกด์ลำดับ '+i+' ต้องมีแค่ฟิลด์ type');
    });
  });

  test('ไม่มีฟังก์ชันที่เคยอ่านชื่อ/เบอร์', function(){
    eq(typeof window.guideRec, 'undefined');
    eq(typeof window.guideAll, 'undefined');
    eq(typeof window.impGuideType, 'undefined');
  });

  test('โมดัลฐานข้อมูลไม่มีแท็บไกด์แล้ว', function(){
    var tabs=[].map.call(document.querySelectorAll('#dbTabs [data-t]'),function(b){return b.dataset.t;});
    no(tabs.indexOf('guide')>=0, 'ต้องไม่มีแท็บ guide');
    eq(typeof IMP_SCHEMA.guide, 'undefined', 'ไม่มีโครงคอลัมน์ไกด์');
  });

  test('ไม่ซิงก์แท็บ Guides กับชีตอีกแล้ว', function(){
    no(GS_TABS.some(function(t){ return t.tab==='guide'; }));
  });
});

group('คิดต้นทุนไกด์จากจำนวนตามประเภท', function(){

  test('เริ่มต้นว่าง = ไม่มีค่าใช้จ่าย', function(){
    reset();
    eq(guideTotalHeads(), 0);
    eq(guideTotal(), 0);
  });

  test('เรตคูณจำนวนคูณวัน', function(){
    reset();
    S.days=3;
    S.guideRates={...S.guideRates, English:1500, Chinese:2000};
    S.guideCount={English:2, Chinese:1};
    eq(guideNum('English'), 2);
    eq(guideTotalHeads(), 3);
    eq(guideRateSum(), 5000, '1500x2 + 2000x1');
    eq(guideTotal(), 15000, '5000 x 3 วัน');
  });

  test('เปลี่ยนจำนวนแล้วยอดขยับ', function(){
    reset();
    S.days=2; S.guideRates={...S.guideRates, English:1000};
    setGuideNum('English', 3);
    eq(guideTotal(), 6000);
    setGuideNum('English', 0);
    eq(guideTotal(), 0);
    eq(guideNum('English'), 0);
  });

  test('จำนวนติดลบหรือเกินถูกจำกัด', function(){
    reset();
    setGuideNum('English', -5); eq(guideNum('English'), 0);
    setGuideNum('English', 999); eq(guideNum('English'), 99);
  });

  test('ประเภทที่จำนวนเป็น 0 ไม่ถูกเก็บค้างไว้', function(){
    reset();
    setGuideNum('English', 2);
    setGuideNum('English', 0);
    no('English' in S.guideCount, 'ต้องถูกลบทิ้ง ไม่ใช่เก็บเป็น 0');
  });

  test('เข้าไปอยู่ในต้นทุนรวมจริง', function(){
    reset();
    S.days=2; S.guideRates={...S.guideRates, English:1000};
    S.guideCount={English:1};
    var t=recalc();
    eq(t.g, 2000);
  });
});

group('แปลงข้อมูลเก่าที่เก็บเป็นรายคน', function(){

  test('ใบเก่าที่อ้างไกด์ด้วย ref แปลงเป็นจำนวนได้ครบ', function(){
    reset();
    /* หา ref จริงของแต่ละประเภทจาก DB.guides ที่เหลือแต่ type */
    var iEn=-1, iCn=-1;
    DB.guides.forEach(function(g,i){
      if(iEn<0 && g.type==='English') iEn=i;
      if(iCn<0 && g.type==='Chinese') iCn=i;
    });
    ok(iEn>=0 && iCn>=0, 'ต้องมีทั้ง English และ Chinese ในฐานข้อมูล');
    delete S.guideCount;
    S.guides=['d'+iEn,'d'+iEn,'d'+iCn];
    migrateGuides();
    eq(guideNum('English'), 2);
    eq(guideNum('Chinese'), 1);
    eq(typeof S.guides, 'undefined', 'ของเก่าต้องถูกลบทิ้ง');
  });

  test('รูปแบบเก่าสุดที่เป็นตัวเลขล้วนก็แปลงได้', function(){
    reset();
    var iEn=-1;
    DB.guides.forEach(function(g,i){ if(iEn<0 && g.type==='English') iEn=i; });
    delete S.guideCount;
    S.guides=[iEn];
    migrateGuides();
    eq(guideNum('English'), 1);
  });

  test('ไกด์ที่ผู้ใช้เคยเพิ่มเองก็แปลงตามประเภท', function(){
    reset();
    delete S.guideCount;
    S.customGuides=[{id:'x1',type:'Indo',name:'ชื่อเก่า'}];
    S.guides=['cx1'];
    migrateGuides();
    eq(guideNum('Indo'), 1);
    eq(typeof S.customGuides, 'undefined', 'ชื่อและเบอร์เก่าต้องถูกทิ้ง');
  });

  test('แปลงแล้วแปลงซ้ำต้องไม่บวกเพิ่ม', function(){
    reset();
    S.guideCount={English:2};
    migrateGuides(); migrateGuides();
    eq(guideNum('English'), 2);
  });

  test('ไม่มีข้อมูลเก่าเลยก็ไม่พัง', function(){
    reset();
    delete S.guideCount; delete S.guides;
    migrateGuides();
    eq(guideTotalHeads(), 0);
  });
});

group('หน้าจอเลือกไกด์', function(){

  test('แสดงครบทุกประเภท', function(){
    reset(); renderGuideGroups();
    eq(document.querySelectorAll('#guideGroups .gtype-row').length, TYPE_ORDER.length);
  });

  test('ป้ายสรุปขึ้นเมื่อมีไกด์', function(){
    reset(); renderGuideGroups();
    ok(document.getElementById('guideSelected').innerHTML.indexOf('gsel-empty')>=0);
    S.guideCount={English:2}; renderGuideGroups();
    var h=document.getElementById('guideSelected').innerHTML;
    ok(h.indexOf('English')>=0 && h.indexOf('2')>=0);
  });

  test('Dashboard แสดงเป็นรายประเภท', function(){
    reset();
    S.days=2; S.guideRates={...S.guideRates, English:1000};
    S.guideCount={English:3};
    var rows=dashRows('guide');
    eq(rows.length, 1);
    eq(rows[0].amt, 6000);
    ok(rows[0].nm.indexOf('English')>=0);
    no(/[0-9]{3}-[0-9]{3,4}/.test(rows[0].meta), 'ต้องไม่มีเบอร์โทร');
  });
});
