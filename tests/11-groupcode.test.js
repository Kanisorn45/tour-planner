/* v28 · ตัวช่วยกรอกรหัสกรุ๊ป
   รูปแบบจริงที่ใช้: [รหัสบริษัท] + [วันเดือน DDMM] + [รหัสลูกค้า]  เช่น TS1910GB */
group('ประกอบรหัสกรุ๊ป', function(){

  test('ประกอบครบสามส่วน', function(){
    reset();
    S.gcCo='TS'; S.gcCust='GB'; S.startDate='2026-10-19';
    eq(gcBuild(),'TS1910GB');
  });

  test('วันเดือนเป็น DDMM เติมศูนย์หน้า', function(){
    reset();
    S.gcCo='TS'; S.gcCust='AB';
    S.startDate='2026-01-05'; eq(gcBuild(),'TS0501AB');
    S.startDate='2026-12-31'; eq(gcBuild(),'TS3112AB');
  });

  test('ตัวพิมพ์เล็กและอักขระแปลกถูกล้างออก', function(){
    reset();
    S.gcCo='ts-'; S.gcCust='g b!'; S.startDate='2026-10-19';
    eq(gcBuild(),'TS1910GB');
  });

  test('ขาดส่วนไหนก็ไม่สร้าง', function(){
    reset(); S.startDate='2026-10-19';
    S.gcCo='TS'; S.gcCust='';   eq(gcBuild(),'','ไม่มีรหัสลูกค้า');
    S.gcCo='';   S.gcCust='GB'; eq(gcBuild(),'','ไม่มีรหัสบริษัท');
    S.gcCo='TS'; S.gcCust='GB'; S.startDate='';
    eq(gcBuild(),'','ไม่มีวันเดินทาง');
  });

  test('กดสร้างแล้วเข้าไปในชื่อโปรแกรมจริง', function(){
    reset();
    S.gcCo='TS'; S.gcCust='GB'; S.startDate='2026-10-19';
    renderSettings();
    applyGroupCode();
    eq(S.quoteName,'TS1910GB');
    eq(document.getElementById('quoteName').value,'TS1910GB');
  });

  test('ยังพิมพ์ชื่อเองทับได้ ตัวช่วยไม่ไปยุ่ง', function(){
    reset();
    S.gcCo='TS'; S.gcCust='GB'; S.startDate='2026-10-19';
    S.quoteName='ชื่อที่พิมพ์เอง';
    renderSettings();
    eq(S.quoteName,'ชื่อที่พิมพ์เอง','ต้องไม่ถูกทับอัตโนมัติ');
  });
});

group('หน้าจอตัวช่วย', function(){

  test('มีช่องครบและโชว์วันเดือนจากวันเดินทาง', function(){
    reset(); S.startDate='2026-10-19'; renderSettings();
    ok(document.getElementById('gcCo'));
    ok(document.getElementById('gcCust'));
    eq(document.getElementById('gcDate').textContent,'19/10');
  });

  test('ยังไม่ใส่วันเดินทาง — บอกให้ใส่ก่อน', function(){
    reset(); S.startDate=''; renderSettings();
    eq(document.getElementById('gcDate').textContent,'—');
    ok(document.getElementById('gcHint').textContent.indexOf('วันเดินทาง')>=0);
    ok(document.getElementById('gcGo').disabled,'ปุ่มต้องกดไม่ได้');
  });

  test('พร้อมสร้าง — บอกว่าจะได้รหัสอะไร', function(){
    reset(); S.gcCo='TS'; S.gcCust='GB'; S.startDate='2026-10-19'; S.quoteName='';
    renderSettings();
    ok(document.getElementById('gcHint').textContent.indexOf('TS1910GB')>=0);
    no(document.getElementById('gcGo').disabled);
  });

  test('ใช้รหัสนั้นอยู่แล้ว — ปุ่มกดไม่ได้', function(){
    reset(); S.gcCo='TS'; S.gcCust='GB'; S.startDate='2026-10-19'; S.quoteName='TS1910GB';
    renderSettings();
    ok(document.getElementById('gcGo').disabled);
    ok(document.getElementById('gcHint').textContent.indexOf('อยู่แล้ว')>=0);
  });

  test('เปลี่ยนวันเดินทาง วันเดือนอัปเดตตาม', function(){
    reset(); S.gcCo='TS'; S.gcCust='GB'; S.startDate='2026-10-19'; S.endDate='2026-10-19';
    renderTripDates();
    eq(document.getElementById('gcDate').textContent,'19/10');
    S.startDate='2026-11-02'; S.endDate='2026-11-02';
    renderTripDates();
    eq(document.getElementById('gcDate').textContent,'02/11');
    eq(gcBuild(),'TS0211GB');
  });
});
