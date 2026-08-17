/* ราคาตามช่วงจำนวน PAX — ราคาต้องขยับเองเมื่อจำนวนคนเปลี่ยน
   แต่ต้องไม่ทับรายการที่ผู้ใช้พิมพ์ราคาเอง */
function setPax(n){ S.paxTypes=[{id:'p',code:'S',label:'x',count:n,pay:true}]; }

group('ไม่มีแท็บ Tiers = ทำงานเหมือน v22 เป๊ะ', function(){
  test('ปิดอยู่และไม่แตะราคาอะไรเลย', function(){
    reset();
    no(tiersOn());
    eq(retierAll(), 0);
    eq(tierPrice({price:50,tiers:[10,20,30,40]}), 50, 'ยังใช้ราคาหลัก');
    eq(tierLabel(), '');
  });
});

group('เลือกช่วงถูกตามจำนวนคน', function(){
  test('4 / 8 / 30 คน ตกช่วง T1 / T2 / T4', function(){
    reset(); fixture();
    ok(tiersOn());
    eq(REF.tiers.length, 4);
    var rec={price:50,tiers:[50,45,40,35]};
    setPax(4);  eq(curTierIdx(), 0); eq(tierPrice(rec), 50);
    setPax(8);  eq(curTierIdx(), 1); eq(tierPrice(rec), 45);
    setPax(15); eq(curTierIdx(), 2); eq(tierPrice(rec), 40);
    setPax(30); eq(curTierIdx(), 3); eq(tierPrice(rec), 35, 'ช่วงสุดท้ายเว้น max = ไม่จำกัด');
  });

  test('ช่องราคาของช่วงนั้นว่าง = สืบทอดราคาหลัก', function(){
    reset(); fixture(); setPax(30);
    eq(tierPrice({price:50,tiers:[50,45,null,null]}), 50);
  });

  test('รายการที่ไม่มี tiers เลย ใช้ราคาหลัก', function(){
    reset(); fixture(); setPax(30);
    eq(tierPrice({price:50}), 50);
  });

  test('จำนวนคนไม่อยู่ในช่วงไหนเลย', function(){
    reset();
    S.ref={areas:[],routes:[],tiers:[{code:'T1',min:5,max:10}]};
    refRebuild(); setPax(2);
    eq(curTierIdx(), -1);
    eq(tierPrice({price:50,tiers:[9]}), 50, 'ถอยไปใช้ราคาหลัก');
    ok(tierLabel().indexOf('ไม่อยู่ในช่วง')>=0, 'ต้องเตือนให้เห็น');
  });

  test('ใช้จำนวนหัวทั้งหมด ไม่ใช่แค่คนที่จ่าย', function(){
    reset(); fixture();
    S.paxTypes=[{id:'a',code:'S',label:'ลูกทัวร์',count:5,pay:true},
                {id:'b',code:'TM',label:'หัวหน้าทัวร์',count:1,pay:false}];
    eq(headTotal(), 6);
    eq(headPay(), 5);
    eq(curTierIdx(), 1, '6 คนรวมคนไม่จ่าย = T2 เพราะซัพพลายเออร์คิดตามขนาดกรุ๊ปจริง');
  });

  test('ป้ายบอกช่วงอ่านรู้เรื่อง', function(){
    reset(); fixture(); setPax(8);
    eq(tierLabel(), 'T2 · กรุ๊ปกลาง (6–10 คน)');
    setPax(30);
    ok(tierLabel().indexOf('ขึ้นไป')>=0, 'ช่วงสุดท้ายบอกว่าไม่จำกัด');
  });
});

group('ราคาในรายการขยับตามจำนวนคน', function(){

  test('เปลี่ยน PAX แล้วราคาค่าเข้าขยับเอง', function(){
    reset(); fixture();
    S.adm=[{id:'i1',ref:'cA',day:1,units:null,price:100}];
    setPax(4);  retierAll(); eq(S.adm[0].price, 100);
    setPax(8);  retierAll(); eq(S.adm[0].price, 90);
    setPax(15); retierAll(); eq(S.adm[0].price, 80);
    setPax(25); retierAll(); eq(S.adm[0].price, 70);
  });

  test('ราคาร้านอาหารขยับเหมือนกัน', function(){
    reset(); fixture();
    S.res=[{id:'r1',ref:'cR',day:1,meal:'Lunch',price:250}];
    setPax(4);  retierAll(); eq(S.res[0].price, 250);
    setPax(25); retierAll(); eq(S.res[0].price, 200);
  });

  test('แก้ราคาเองแล้วระบบห้ามทับ', function(){
    reset(); fixture();
    S.adm=[{id:'i1',ref:'cA',day:1,units:null,price:100}];
    S.adm[0].price=55; S.adm[0].pxLock=true;
    setPax(25); retierAll();
    eq(S.adm[0].price, 55, 'ต้องไม่ถูกทับ');
    eq(lockedCount(), 1);
  });

  test('ปลดล็อกแล้วกลับมาใช้ราคาตามช่วง', function(){
    reset(); fixture();
    S.adm=[{id:'i1',ref:'cA',day:1,units:null,price:55,pxLock:true}];
    setPax(4);
    eq(unlockAllPrices(), 1);
    eq(S.adm[0].price, 100);
    eq(lockedCount(), 0);
  });

  test('รายการรับ-ส่งสนามบินไม่ถูกแตะ', function(){
    reset(); fixture();
    S.adm=[{id:'t1',kind:'transfer',dir:'in',day:1,price:999}];
    setPax(25); retierAll();
    eq(S.adm[0].price, 999);
  });

  test('เพิ่มรายการใหม่ได้ราคาของช่วงปัจจุบันทันที', function(){
    reset(); fixture(); setPax(8);
    eq(tierPrice(admRec('cA')), 90);
  });
});

group('แถบบอกช่วงราคาในหน้า Plan', function(){
  test('เปิดเมื่อมี Tiers ปิดเมื่อไม่มี', function(){
    reset(); fixture(); setPax(8);
    renderTierNote();
    eq(document.getElementById('tierNote').style.display, 'block');
    S.ref={areas:[],routes:[],tiers:[]}; refRebuild();
    renderTierNote();
    eq(document.getElementById('tierNote').style.display, 'none');
  });
});
