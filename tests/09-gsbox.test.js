/* v26 · กล่องเชื่อม Google Sheet — แสดงเฉพาะสิ่งที่ตรงกับสถานะ
   ของเดิมโชว์ 7 ปุ่มพร้อมกันหมด ทั้งที่ 5 ปุ่มใช้ครั้งเดียวตอนตั้งค่า */
function gsOpen(){ openDb('adm'); renderGsBox(); }
function btns(){ return [].map.call(document.querySelectorAll('#gsBox button'),function(b){return b.id||b.className;}); }
function txt(){ return document.getElementById('gsBox').innerText||document.getElementById('gsBox').textContent; }

group('ยังไม่ได้เชื่อม — เห็นแค่ขั้นตอนตั้งค่า', function(){

  test('มีครบ 3 ขั้น และมีช่องกรอกทั้งสอง', function(){
    reset(); S.gsUrl=''; S.gsExec=''; gsOpen();
    eq(document.querySelectorAll('#gsBox .gs-step').length, 3);
    ok(document.getElementById('gsUrl'), 'ช่องลิงก์ชีต');
    ok(document.getElementById('gsExecInput'), 'ช่องลิงก์ /exec');
    ok(document.getElementById('gsConnBtn'), 'ปุ่มรับสคริปต์');
  });

  test('ไม่โชว์ปุ่มที่ยังกดไม่ได้', function(){
    reset(); S.gsUrl=''; S.gsExec=''; gsOpen();
    var b=btns();
    no(b.indexOf('gsSyncBtn')>=0, 'ปุ่มดึงต้องยังไม่โผล่');
    no(b.indexOf('gsPushBtn')>=0, 'ปุ่มส่งต้องยังไม่โผล่');
    no(b.indexOf('gsCheckBtn')>=0);
    no(b.indexOf('gsSeedBtn')>=0);
    no(b.indexOf('gsBkNow')>=0);
  });

  test('ปุ่มทั้งหมดในสถานะนี้มีแค่ปุ่มเดียว', function(){
    reset(); S.gsUrl=''; S.gsExec=''; gsOpen();
    eq(btns().length, 1, 'เหลือแค่ปุ่มรับสคริปต์');
  });

  test('บอกสถานะว่ายังไม่ได้เชื่อม', function(){
    reset(); S.gsUrl=''; S.gsExec=''; gsOpen();
    ok(txt().indexOf('ยังไม่ได้เชื่อม')>=0);
  });
});

group('เชื่อมแล้ว — เห็นแค่ 2 ปุ่มที่ใช้จริง', function(){
  var EXEC='https://script.google.com/macros/s/AAAA/exec';

  test('มีปุ่มดึงกับส่ง และไม่มีปุ่มตั้งค่าโผล่', function(){
    reset(); S.gsUrl='https://docs.google.com/spreadsheets/d/1NQdCPSQt37c1iiVGQYRrq9lly4hI5iiej03yNSrh2iQ/edit';
    S.gsExec=EXEC; gsCfgOpen=false; gsOpen();
    var b=btns();
    ok(b.indexOf('gsSyncBtn')>=0);
    ok(b.indexOf('gsPushBtn')>=0);
    no(b.indexOf('gsCheckBtn')>=0, 'ตรวจการเชื่อมต่อต้องพับไว้');
    no(b.indexOf('gsSeedBtn')>=0, 'ไฟล์เริ่มต้นต้องพับไว้');
    no(b.indexOf('gsBkNow')>=0, 'สำรองเดี๋ยวนี้ต้องพับไว้');
    eq(document.querySelectorAll('#gsBox .gs-step').length, 0, 'ช่องกรอกต้องพับไว้');
  });

  test('มีลิงก์เปิดชีตกับตั้งค่า', function(){
    reset(); S.gsUrl='https://docs.google.com/spreadsheets/d/1NQdCPSQt37c1iiVGQYRrq9lly4hI5iiej03yNSrh2iQ/edit';
    S.gsExec=EXEC; gsCfgOpen=false; gsOpen();
    ok(document.getElementById('gsOpenBtn'), 'เปิดชีต');
    ok(document.getElementById('gsCfgBtn'), 'ตั้งค่า');
  });

  test('กดตั้งค่าแล้วปุ่มที่เหลือโผล่ครบ', function(){
    reset(); S.gsUrl='https://docs.google.com/spreadsheets/d/1NQdCPSQt37c1iiVGQYRrq9lly4hI5iiej03yNSrh2iQ/edit';
    S.gsExec=EXEC; gsCfgOpen=false; gsOpen();
    document.getElementById('gsCfgBtn').click();
    var b=btns();
    ok(b.indexOf('gsCheckBtn')>=0);
    ok(b.indexOf('gsSeedBtn')>=0);
    ok(b.indexOf('gsBkNow')>=0);
    ok(b.indexOf('gsConnBtn')>=0);
    eq(document.querySelectorAll('#gsBox .gs-step').length, 3, 'ช่องกรอกกลับมา');
    ok(document.getElementById('gsAutoBk'), 'สวิตช์สำรองอัตโนมัติ');
    gsCfgOpen=false;
  });

  test('ปิดตั้งค่ากลับมาเหลือเท่าเดิม', function(){
    reset(); S.gsUrl='https://docs.google.com/spreadsheets/d/1NQdCPSQt37c1iiVGQYRrq9lly4hI5iiej03yNSrh2iQ/edit';
    S.gsExec=EXEC; gsCfgOpen=true; gsOpen();
    document.getElementById('gsCfgBtn').click();
    eq(document.querySelectorAll('#gsBox .gs-step').length, 0);
    gsCfgOpen=false;
  });

  test('แถบสถานะบอกผลสำรองอัตโนมัติ', function(){
    reset(); S.gsUrl='x'; S.gsExec=EXEC; gsCfgOpen=false;
    S.autoBackup=true; S.lastAutoBackupAt=null; gsOpen();
    ok(txt().indexOf('ยังไม่เคยสำรอง')>=0);
    S.lastAutoBackupAt=new Date().toISOString(); gsOpen();
    ok(txt().indexOf('สำรองอัตโนมัติ')>=0);
    S.autoBackup=false; gsOpen();
    ok(txt().indexOf('ปิดสำรองอัตโนมัติ')>=0);
  });

  test('จำนวนแท็บในปุ่มไฟล์เริ่มต้นตรงกับของจริง', function(){
    reset(); S.gsUrl='x'; S.gsExec=EXEC; gsCfgOpen=true; gsOpen();
    var b=document.getElementById('gsSeedBtn');
    ok(b.textContent.indexOf(String(GS_TABS.length))>=0, 'ต้องเป็น '+GS_TABS.length+' ไม่ใช่เลขตายตัว');
    gsCfgOpen=false;
  });
});

group('ตรวจลิงก์ Web App แล้วบอกเหตุผล', function(){

  test('ลิงก์ถูกต้อง ผ่าน', function(){
    ok(gsExecCheck('https://script.google.com/macros/s/AKfycbX/exec').ok);
    ok(gsExecCheck('https://script.google.com/a/macros/example.com/s/AKfycbY/exec').ok, 'บัญชีองค์กร');
  });

  test('ตัด / ท้ายและช่องว่างให้เอง', function(){
    var r=gsExecCheck('  https://script.google.com/macros/s/AKfycbZ/exec/  ');
    ok(r.ok, 'ต้องผ่าน ไม่ใช่ปฏิเสธเงียบ ๆ');
    eq(r.url,'https://script.google.com/macros/s/AKfycbZ/exec');
  });

  test('ลิงก์ /dev บอกว่าเป็นลิงก์ทดสอบ', function(){
    var r=gsExecCheck('https://script.google.com/macros/s/AKfycbW/dev');
    no(r.ok);
    ok(r.msg.indexOf('ทดสอบ')>=0);
    ok(r.msg.indexOf('/exec')>=0, 'ต้องบอกด้วยว่าต้องใช้อันไหน');
  });

  test('เอาลิงก์ชีตมาวางผิดช่อง', function(){
    var r=gsExecCheck('https://docs.google.com/spreadsheets/d/1NQdCPSQt37c1iiVGQYRrq9lly4hI5iiej03yNSrh2iQ/edit');
    no(r.ok);
    ok(r.msg.indexOf('ลิงก์ชีต')>=0);
  });

  test('ลิงก์อื่นที่ไม่ใช่ Web App', function(){
    no(gsExecCheck('https://script.googleusercontent.com/macros/echo?x=1').ok);
    no(gsExecCheck('https://example.com/exec').ok);
    ok(gsExecCheck('https://example.com/exec').msg.indexOf('script.google.com')>=0);
  });

  test('ว่าง = ไม่ต้องบ่น', function(){
    var r=gsExecCheck('');
    no(r.ok); eq(r.msg,'');
  });

  test('วางลิงก์ผิดแล้วต้องเห็นเหตุผลบนหน้าจอ', function(){
    reset(); S.gsUrl=''; S.gsExec=''; gsCfgOpen=false;
    openDb('adm'); renderGsBox();
    var el=document.getElementById('gsExecInput');
    el.value='https://script.google.com/macros/s/AKfycbW/dev';
    el.dispatchEvent(new Event('input',{bubbles:true}));
    var why=document.getElementById('gsWhy');
    ok(why && why.textContent.length>0, 'ต้องมีข้อความอธิบาย ไม่ใช่เงียบ');
  });
});

group('ตรวจการเชื่อมต่อต้องไม่ล็อกปุ่ม', function(){
  var EXEC='https://script.google.com/macros/s/AKfycbQ/exec';

  test('โหมดเงียบ ไม่ตั้ง gsBusy ปุ่มยังกดได้', function(){
    reset(); S.gsUrl='x'; S.gsExec=EXEC; gsCfgOpen=false;
    gsBusy=false;
    openDb('adm');
    gsCheck(true);                       /* ไม่ await — ดูสถานะระหว่างกำลังตรวจ */
    no(gsBusy, 'โหมดเงียบห้ามตั้ง gsBusy');
    renderGsBox();
    var sync=document.getElementById('gsSyncBtn');
    var push=document.getElementById('gsPushBtn');
    ok(sync && !sync.disabled, 'ปุ่มดึงต้องยังกดได้');
    ok(push && !push.disabled, 'ปุ่มส่งต้องยังกดได้');
    gsBusy=false;
  });

  test('กดปุ่มตรวจเอง = ล็อกปุ่มระหว่างรอ (ตั้งใจ)', function(){
    reset(); S.gsUrl='x'; S.gsExec=EXEC; gsCfgOpen=true;
    gsBusy=false;
    openDb('adm');
    gsCheck();
    ok(gsBusy, 'กดเองต้องแสดงว่ากำลังทำงาน');
    gsBusy=false;
  });

  test('ปุ่มตรวจไม่ส่ง event เข้าไปเป็นโหมดเงียบ', function(){
    reset(); S.gsUrl='x'; S.gsExec=EXEC; gsCfgOpen=true; gsBusy=false;
    openDb('adm'); renderGsBox();
    var b=document.getElementById('gsCheckBtn');
    ok(b, 'ต้องมีปุ่ม');
    b.click();
    ok(gsBusy, 'กดปุ่มต้องเข้าโหมดปกติ ไม่ใช่โหมดเงียบ');
    gsBusy=false;
  });

  test('ไม่มีลิงก์ + โหมดเงียบ = ไม่เด้ง toast', function(){
    reset(); S.gsExec=''; gsBusy=false;
    var msgs=[], orig=toast;
    toast=function(m){ msgs.push(m); };
    try{ gsCheck(true); } finally { toast=orig; }
    eq(msgs.length, 0, 'เบื้องหลังห้ามรบกวนผู้ใช้');
  });
});
