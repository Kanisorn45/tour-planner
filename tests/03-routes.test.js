/* เวลาเดินทางแบบมีลำดับชั้น — หัวใจคือเพิ่มโซนใหม่แล้วไม่ต้องกรอกแถวเพิ่ม */
var AREA_ROWS = [
  {prov:'นครศรีธรรมราช', zone:'ในเมือง'},
  {prov:'นครศรีธรรมราช', zone:'ขนอม'},
  {prov:'นครศรีธรรมราช', zone:'สิชล'},
  {prov:'นครศรีธรรมราช', zone:'ลานสกา'},
  {prov:'นครศรีธรรมราช', zone:'ท่าศาลา'},
  {prov:'กระบี่',        zone:'อ่าวนาง'},
  {prov:'กระบี่',        zone:'เมืองกระบี่'},
  {prov:'สุราษฎร์ธานี',  zone:'เมืองสุราษฎร์'},
  {prov:'สุราษฎร์ธานี',  zone:'ดอนสัก'}
];
/* 7 แถวขั้นต่ำที่ควรครอบทุกคู่ได้ */
var BASE_ROUTES = [
  {from:'=',               to:'=',               mins:15},
  {from:'นครศรีธรรมราช/*', to:'นครศรีธรรมราช/*', mins:60},
  {from:'กระบี่/*',        to:'กระบี่/*',        mins:40},
  {from:'สุราษฎร์ธานี/*',  to:'สุราษฎร์ธานี/*',  mins:50},
  {from:'นครศรีธรรมราช/*', to:'กระบี่/*',        mins:180},
  {from:'นครศรีธรรมราช/*', to:'สุราษฎร์ธานี/*',  mins:150},
  {from:'กระบี่/*',        to:'สุราษฎร์ธานี/*',  mins:210}
];
var REFINE_ROUTES = [
  {from:'ในเมือง', to:'ขนอม',     mins:90},
  {from:'ในเมือง', to:'ลานสกา',   mins:'40 นาที'},
  {from:'ขนอม',    to:'ดอนสัก',   mins:'45'},
  {from:'ในเมือง', to:'ในเมือง',   mins:20},
  {from:'ในเมือง', to:'กระบี่/*',  mins:'3 ชม'}
];
function mk(rows){ return buildRoutes(rows); }
function at(areas, zone){
  var z=areas.zones.get(String(zone).toLowerCase());
  return {zone:zone, prov:z?z.prov:''};
}

group('ทะเบียนพื้นที่ · buildAreas', function(){

  test('นับจังหวัดและโซนถูก', function(){
    var a=buildAreas(AREA_ROWS);
    eq(a.zones.size, 9);
    eq(a.provs.size, 3);
  });

  test('แถวที่โซนว่าง = ประกาศตัวจังหวัดเอง', function(){
    var a=buildAreas([{prov:'นครศรีธรรมราช',zone:''},{prov:'นครศรีธรรมราช',zone:'ในเมือง'}]);
    eq(a.provs.size,1);
    eq(a.zones.size,1);
  });

  test('ปิดใช้งานโซน ต้องไม่ทำข้อมูลเดิมหาย (soft delete)', function(){
    var a=buildAreas(AREA_ROWS.map(function(r){
      return r.zone==='ลานสกา'?{prov:r.prov,zone:r.zone,active:false}:r; }));
    ok(a.zones.has('ลานสกา'),'ยังต้องอยู่ในทะเบียน');
    eq(a.zones.get('ลานสกา').active,false,'แต่ถูกทำเครื่องหมายปิด');
    var R=mk(BASE_ROUTES.concat(REFINE_ROUTES));
    eq(routeMins(R, at(a,'ในเมือง'), at(a,'ลานสกา')).mins, 40, 'สถานที่เดิมในโซนนั้นยังคำนวณได้');
  });

  test('โซนซ้ำชื่อ ใช้แถวแรก', function(){
    var a=buildAreas([{prov:'ก',zone:'ในเมือง'},{prov:'ข',zone:'ในเมือง'}]);
    eq(a.zones.size,1);
    eq(a.zones.get('ในเมือง').prov,'ก');
  });

  test('จับโซนที่พิมพ์ในข้อมูลแต่ยังไม่ลงทะเบียน', function(){
    var a=buildAreas(AREA_ROWS);
    var bad=unregisteredZones(a,['ในเมือง','หัวไทร','ในเมือง','นบพิตำ']);
    eq(bad.length,2);
    ok(bad.indexOf('หัวไทร')>=0);
    ok(bad.indexOf('นบพิตำ')>=0);
  });
});

group('หาเวลาเดินทาง · routeMins ด้วย 7 แถวขั้นต่ำ', function(){
  var areas=buildAreas(AREA_ROWS);
  var R=mk(BASE_ROUTES);

  test('ข้ามโซนในจังหวัดเดียวกัน', function(){
    eq(routeMins(R, at(areas,'ในเมือง'), at(areas,'สิชล')).mins, 60);
  });
  test('อยู่โซนเดียวกัน', function(){
    eq(routeMins(R, at(areas,'ในเมือง'), at(areas,'ในเมือง')).mins, 15);
  });
  test('ข้ามจังหวัด และทิศกลับให้ค่าเท่ากัน', function(){
    eq(routeMins(R, at(areas,'สิชล'), at(areas,'อ่าวนาง')).mins, 180);
    eq(routeMins(R, at(areas,'อ่าวนาง'), at(areas,'สิชล')).mins, 180, 'กรอกทิศเดียวพอ');
  });
  test('ข้ามโซนในอีกจังหวัด', function(){
    eq(routeMins(R, at(areas,'อ่าวนาง'), at(areas,'เมืองกระบี่')).mins, 40);
    eq(routeMins(R, at(areas,'อ่าวนาง'), at(areas,'ดอนสัก')).mins, 210);
  });

  test('7 แถว ครอบทุกคู่ของ 9 โซน = 81 คู่ ไม่มีช่องว่าง', function(){
    var zs=[];
    areas.zones.forEach(function(v){ zs.push(v.name); });
    var holes=0, total=0;
    zs.forEach(function(x){ zs.forEach(function(y){
      total++;
      if(routeMins(R, at(areas,x), at(areas,y)).mins==null) holes++;
    }); });
    eq(total,81);
    eq(holes,0);
  });
});

group('แถวเจาะจงต้องชนะค่าเริ่มต้น', function(){
  var areas=buildAreas(AREA_ROWS);
  var R=mk(BASE_ROUTES.concat(REFINE_ROUTES));

  test('คู่โซนที่กรอกไว้ ชนะค่าระดับจังหวัด', function(){
    eq(routeMins(R, at(areas,'ในเมือง'), at(areas,'ขนอม')).mins, 90);
    eq(routeMins(R, at(areas,'ขนอม'), at(areas,'ในเมือง')).mins, 90);
  });
  test('ช่องนาทีรับข้อความเวลาได้เหมือนกัน', function(){
    eq(routeMins(R, at(areas,'ในเมือง'), at(areas,'ลานสกา')).mins, 40, '"40 นาที"');
  });
  test('คู่ข้ามจังหวัดที่เจาะจง ชนะค่าจังหวัด', function(){
    eq(routeMins(R, at(areas,'ขนอม'), at(areas,'ดอนสัก')).mins, 45, 'ไม่ใช่ 150');
  });
  test('โซนเดียวกันที่เจาะจง ชนะค่า = =', function(){
    eq(routeMins(R, at(areas,'ในเมือง'), at(areas,'ในเมือง')).mins, 20);
    eq(routeMins(R, at(areas,'สิชล'), at(areas,'สิชล')).mins, 15, 'โซนอื่นยังใช้ค่ากลาง');
  });
  test('โซนเดียว ไป ทั้งจังหวัด', function(){
    eq(routeMins(R, at(areas,'ในเมือง'), at(areas,'อ่าวนาง')).mins, 180, '"3 ชม"');
    eq(routeMins(R, at(areas,'สิชล'), at(areas,'อ่าวนาง')).mins, 180, 'โซนอื่นใช้ค่าจังหวัด');
  });
  test('บอกได้ว่าค่ามาจากชั้นไหน', function(){
    eq(routeMins(R, at(areas,'ในเมือง'), at(areas,'ขนอม')).via, 'โซน↔โซน');
    eq(routeMins(R, at(areas,'สิชล'), at(areas,'ลานสกา')).via, 'จังหวัด↔จังหวัด');
    eq(routeMins(R, at(areas,'สิชล'), at(areas,'สิชล')).via, 'โซนเดียวกัน');
  });
});

group('ขยายพื้นที่ในอนาคต', function(){
  var R=mk(BASE_ROUTES.concat(REFINE_ROUTES));

  test('เพิ่มโซนใหม่ → กรอก Routes เพิ่ม 0 แถว', function(){
    var a2=buildAreas(AREA_ROWS.concat([{prov:'นครศรีธรรมราช',zone:'ปากพนัง'}]));
    eq(routeMins(R, at(a2,'ปากพนัง'), at(a2,'ในเมือง')).mins, 60, 'ตกทอดค่าจังหวัด');
    eq(routeMins(R, at(a2,'ปากพนัง'), at(a2,'ปากพนัง')).mins, 15, 'โซนเดียวกัน');
    eq(routeMins(R, at(a2,'ปากพนัง'), at(a2,'อ่าวนาง')).mins, 180, 'ข้ามจังหวัด');
  });

  test('เพิ่มจังหวัดใหม่ → ต้องกรอก 4 แถว', function(){
    var a3=buildAreas(AREA_ROWS.concat([{prov:'พัทลุง',zone:'เมืองพัทลุง'}]));
    eq(routeMins(R, at(a3,'เมืองพัทลุง'), at(a3,'ในเมือง')).mins, null, 'ยังไม่มีข้อมูล');
    eq(routeMins(R, at(a3,'เมืองพัทลุง'), at(a3,'เมืองพัทลุง')).mins, 15, 'โซนเดียวกันใช้ได้เลย');
    var R2=mk(BASE_ROUTES.concat(REFINE_ROUTES,[
      {from:'พัทลุง/*',to:'พัทลุง/*',mins:45},
      {from:'พัทลุง/*',to:'นครศรีธรรมราช/*',mins:90},
      {from:'พัทลุง/*',to:'กระบี่/*',mins:120},
      {from:'พัทลุง/*',to:'สุราษฎร์ธานี/*',mins:180}
    ]));
    eq(routeMins(R2, at(a3,'เมืองพัทลุง'), at(a3,'ในเมือง')).mins, 90);
  });
});

group('ค่าสำรอง และการไม่เดา', function(){
  var a3=buildAreas(AREA_ROWS.concat([{prov:'พัทลุง',zone:'เมืองพัทลุง'}]));

  test('ไม่มีข้อมูล = คืน null ไม่เดา', function(){
    var R=mk(BASE_ROUTES);
    eq(routeMins(R, at(a3,'เมืองพัทลุง'), at(a3,'ในเมือง')).mins, null);
    eq(routeMins(R, at(a3,'เมืองพัทลุง'), at(a3,'ในเมือง')).via, 'ไม่มีข้อมูล');
  });
  test('ใส่แถว * * แล้วมีค่าสำรองให้', function(){
    var R=mk(BASE_ROUTES.concat([{from:'*',to:'*',mins:120}]));
    eq(routeMins(R, at(a3,'เมืองพัทลุง'), at(a3,'ในเมือง')).mins, 120);
    eq(routeMins(R, at(a3,'เมืองพัทลุง'), at(a3,'ในเมือง')).via, 'ค่าสำรอง');
  });
  test('แถวที่นาทีอ่านไม่ออก ถูกข้าม', function(){
    var R=mk([{from:'ก',to:'ข',mins:'ไม่ระบุ'}]);
    eq(routeMins(R,{zone:'ก',prov:''},{zone:'ข',prov:''}).mins, null);
  });
  test('แถวซ้ำ ใช้แถวแรก', function(){
    var R=mk([{from:'ก',to:'ข',mins:10},{from:'ก',to:'ข',mins:99}]);
    eq(routeMins(R,{zone:'ก',prov:''},{zone:'ข',prov:''}).mins, 10);
  });
});
