/* จับคู่คอลัมน์จากหัวตาราง — บั๊กเดิมคือช่องที่มาก่อนไปคว้าคอลัมน์ของช่องอื่น
   ด้วยการเดา ทั้งที่เจ้าของตัวจริงจะแมตช์แบบตรงตัวได้ในภายหลัง */
function mapHead(tab, head){
  var keep=[dbTab, impRows, impMap];
  dbTab=tab; impRows=[head];
  impAutoMap();
  var got={};
  Object.keys(impMap).forEach(function(k){ got[k]=impMap[k]; });
  dbTab=keep[0]; impRows=keep[1]; impMap=keep[2];
  return got;
}

group('จับคู่คอลัมน์ · impAutoMap', function(){

  test('ชีตเต็มรูปแบบของ v24 (Places 16 คอลัมน์)', function(){
    var m=mapHead('adm',['จังหวัด','ชื่อไทย','ชื่ออังกฤษ','รายการ','ราคา','หน่วย','หมายเหตุ',
                         'โซน','ใช้เวลา','เปิด','ปิด','วันหยุด']);
    eq(m.area,0); eq(m.th,1); eq(m.en,2); eq(m.item,3);
    eq(m.price,4,'ราคา เปล่า');
    eq(m.unit,5); eq(m.note,6); eq(m.zone,7); eq(m.dur,8);
    eq(m.open,9); eq(m.close,10); eq(m.closed,11);
  });

  test('ชีตเก่าที่ยังไม่มีคอลัมน์ใหม่ ต้องยังอ่านได้', function(){
    var m=mapHead('adm',['จังหวัด','ชื่อไทย','ชื่ออังกฤษ','รายการ','ราคา','หน่วย','หมายเหตุ']);
    eq(m.price,4);
    eq(m.dur,-1);
    eq(m.zone,-1);
    eq(m.closed,-1);
  });


  test('คอลัมน์เดียวถูกจองแล้ว ช่องอื่นห้ามใช้ซ้ำ', function(){
    var m=mapHead('adm',['ชื่อไทย','ราคา']);
    var used={};
    var dup=false;
    Object.keys(m).forEach(function(k){
      if(m[k]<0)return;
      if(used[m[k]])dup=true;
      used[m[k]]=k;
    });
    no(dup,'มีสองช่องชี้คอลัมน์เดียวกัน');
  });

  test('สลับลำดับคอลัมน์ได้ เพราะอ่านจากชื่อไม่ใช่ตำแหน่ง', function(){
    var m=mapHead('adm',['ราคา','ชื่อไทย','โซน','ใช้เวลา','จังหวัด']);
    eq(m.price,0); eq(m.th,1); eq(m.zone,2); eq(m.dur,3); eq(m.area,4);
  });

  test('ชื่อพ้องภาษาอังกฤษ', function(){
    var m=mapHead('adm',['province','name th','en','price','unit','zone','duration','open','close']);
    ok(m.area>=0,'province'); ok(m.th>=0,'name th'); ok(m.price>=0,'price');
    ok(m.zone>=0,'zone'); ok(m.dur>=0,'duration');
    ok(m.open>=0,'open'); ok(m.close>=0,'close');
  });

  test('Restaurants 11 คอลัมน์', function(){
    var m=mapHead('res',['จังหวัด','ชื่อไทย','ชื่ออังกฤษ','ราคา/ท่าน','ฮาลาล','หมายเหตุ',
                         'โซน','ใช้เวลา','เปิด','ปิด','วันหยุด']);
    eq(m.price,3); eq(m.halal,4); eq(m.zone,6); eq(m.dur,7); eq(m.closed,10);
  });

  test('Hotels เพิ่มโซนต่อท้าย', function(){
    var m=mapHead('hotel',['จังหวัด','ชื่อไทย','ชื่ออังกฤษ','ประเภทห้อง','เตียง','ราคา/คืน',
                           'ดาว','เบอร์ติดต่อ','อาหารเช้า','หมายเหตุ','โซน']);
    eq(m.zone,10);
    eq(m.price,5);
  });

  test('Cars ไม่เปลี่ยน · Guides ถูกถอดออกใน v25', function(){
    var c=mapHead('car',['ประเภทรถ','ที่นั่ง','ราคา','คิดแบบ']);
    eq(c.type,0); eq(c.seats,1); eq(c.price,2); eq(c.mode,3);
    eq(typeof IMP_SCHEMA.guide, 'undefined', 'ไม่มีโครงคอลัมน์ไกด์แล้ว');
  });
});

group('โครงคอลัมน์ต้องยาวเท่ากันทุกทาง', function(){

  test('จำนวนช่อง เท่ากับ ตัวอย่าง เท่ากับ แถวที่เขียนกลับ', function(){
    eq(IMP_SCHEMA.adm.fields.length, 12, 'Places มี 12 ช่อง');
    eq(IMP_SCHEMA.adm.sample.length, 12, 'ตัวอย่างต้องครบ 12');
    eq(IMP_SCHEMA.adm.toRow({area:'a',th:'b',price:1}).length, 12, 'แถวที่เขียนกลับต้องครบ 12');

    eq(IMP_SCHEMA.res.fields.length, 11);
    eq(IMP_SCHEMA.res.sample.length, 11);
    eq(IMP_SCHEMA.res.toRow({area:'a',th:'b',price:1}).length, 11);

    eq(IMP_SCHEMA.hotel.fields.length, 11);
    eq(IMP_SCHEMA.hotel.samples[0].length, 11);
  });

  test('นำเข้าแล้วเก็บค่าคอลัมน์ใหม่ครบ', function(){
    reset();
    var row=['นครศรีธรรมราช','วัดทดสอบ','Test Wat','ค่าเข้า','50','ท่าน','โน้ต',
             'ในเมือง','1 ชม 30 นาที','08:00','17:00','จ,อ'];
    var head=IMP_SCHEMA.adm.fields.map(function(f){ return f.label; });
    var keep=dbTab; dbTab='adm';
    impRows=[head,row]; impAutoMap();
    var g=function(k){ var i=impMap[k]; return i>=0?row[i]:''; };
    var built=IMP_SCHEMA.adm.build(g);
    dbTab=keep;
    ok(!built.err, built.err||'');
    var d=built.data;
    eq(d.zone,'ในเมือง');
    eq(d.dur,90,'"1 ชม 30 นาที" ต้องเป็น 90 ไม่ใช่ 130');
    eq(d.open,480);
    eq(d.close,1020);
    eq(d.closed,[1,2]);
  });


});
