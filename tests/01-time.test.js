/* อ่านค่าเวลาทุกรูปแบบ — แทน impNum เดิมที่อ่าน "1 ชม 30 นาที" เป็น 130 */
group('อ่านช่วงเวลา · parseDur', function(){

  test('ตัวเลขล้วน', function(){
    eq(parseDur('45'), 45);
    eq(parseDur(45), 45);
    eq(parseDur('  90  '), 90);
    eq(parseDur('0'), 0);
  });

  test('ไทย · นาที', function(){
    eq(parseDur('45 นาที'), 45);
    eq(parseDur('45นาที'), 45);
    eq(parseDur('45 น.'), 45);
    eq(parseDur('๔๕ นาที'), 45, 'เลขไทย');
  });

  test('ไทย · ชั่วโมง', function(){
    eq(parseDur('1 ชั่วโมง'), 60);
    eq(parseDur('1 ชม'), 60);
    eq(parseDur('1 ชม.'), 60);
    eq(parseDur('2ชม'), 120);
    eq(parseDur('2 ช.ม.'), 120);
    eq(parseDur('1.5 ชม'), 90);
    eq(parseDur('1.5 ชั่วโมง'), 90);
  });

  test('ไทย · ชั่วโมงผสมนาที', function(){
    eq(parseDur('1 ชม 30 นาที'), 90);
    eq(parseDur('1 ชั่วโมง 30 นาที'), 90);
    eq(parseDur('2ชม15นาที'), 135);
    eq(parseDur('1 ชม 30'), 90, 'เลขท้ายไม่มีหน่วย = นาที');
  });

  test('ครึ่ง · ตำแหน่งเปลี่ยนความหมาย', function(){
    eq(parseDur('ครึ่งชั่วโมง'), 30, 'ครึ่งมาก่อน = 30');
    eq(parseDur('ครึ่ง ชม.'), 30);
    eq(parseDur('ชั่วโมงครึ่ง'), 90, 'ครึ่งมาหลัง = 90');
    eq(parseDur('1 ชั่วโมงครึ่ง'), 90);
    eq(parseDur('1 ชม.ครึ่ง'), 90);
    eq(parseDur('2 ชั่วโมงครึ่ง'), 150);
    eq(parseDur('2 ชม ครึ่ง'), 150);
    eq(parseDur('1 ชั่วโมงกับครึ่ง'), 90);
  });

  test('เลขไทยแบบตัวหนังสือ', function(){
    eq(parseDur('สองชั่วโมง'), 120);
    eq(parseDur('สาม ชม.'), 180);
    eq(parseDur('สิบห้า นาที'), 15, 'สิบห้า ต้องเป็น 15 ไม่ใช่ 105');
    eq(parseDur('สี่สิบห้านาที'), 45);
    eq(parseDur('ยี่สิบนาที'), 20);
    eq(parseDur('สามสิบ นาที'), 30);
    eq(parseDur('เก้าสิบนาที'), 90);
    eq(parseDur('สิบเอ็ด นาที'), 11);
    eq(parseDur('สองชั่วโมงครึ่ง'), 150);
  });

  test('หน่วยวัน · 1 วัน = วันทำงาน 8 ชม.', function(){
    eq(parseDur('ครึ่งวัน'), 240);
    eq(parseDur('1 วัน'), 480);
    eq(parseDur('เต็มวัน'), 480);
    eq(DUR_DAY_MINS, 480, 'ค่าคงที่ที่แก้ได้จุดเดียว');
  });

  test('รูปแบบนาฬิกา', function(){
    eq(parseDur('1:30'), 90);
    eq(parseDur('01:30:00'), 90);
    eq(parseDur('0:45'), 45);
    eq(parseDur('2:05'), 125);
  });

  test('ช่วงเวลา · เอาค่าสูงสุด', function(){
    eq(parseDur('45-60'), 60);
    eq(parseDur('45–60 นาที'), 60, 'ขีดยาว');
    eq(parseDur('1-2 ชม'), 120);
    eq(parseDur('45 ถึง 60 นาที'), 60);
    eq(parseDur('1 ชม - 1 ชม 30 นาที'), 90);
  });

  test('คำขยายที่ต้องมองข้าม', function(){
    eq(parseDur('ประมาณ 45 นาที'), 45);
    eq(parseDur('ราว ๆ 1 ชม'), 60);
    eq(parseDur('~45'), 45);
    eq(parseDur('ไม่เกิน 90 นาที'), 90);
    eq(parseDur('สัก 2 ชม.'), 120);
  });

  test('อังกฤษ', function(){
    eq(parseDur('45 min'), 45);
    eq(parseDur('45 mins'), 45);
    eq(parseDur('45m'), 45);
    eq(parseDur('45 minutes'), 45);
    eq(parseDur('1 hr'), 60);
    eq(parseDur('1h'), 60);
    eq(parseDur('1.5 hours'), 90);
    eq(parseDur('1h30m'), 90);
    eq(parseDur('2 hrs 15 min'), 135);
    eq(parseDur('half an hour'), 30);
    eq(parseDur('an hour'), 60);
    eq(parseDur('about 45 min'), 45);
    eq(parseDur('two hours'), 120);
  });

  test('ค่าที่ Google Sheets แปลงชนิดไปแล้ว', function(){
    eq(parseDur(0.0625), 90, 'duration 1:30 = เศษส่วนของวัน');
    eq(parseDur([1,30,0,0]), 90, 'gviz timeofday');
    eq(parseDur('Date(1899,11,30,1,30,0)'), 90, 'gviz date');
    eq(parseDur(new Date(1899,11,30,2,0,0)), 120, 'Date object');
  });

  test('อ่านไม่ออกต้องคืน null ไม่เดา', function(){
    eq(parseDur(''), null);
    eq(parseDur(null), null);
    eq(parseDur(undefined), null);
    eq(parseDur('   '), null);
    eq(parseDur('ไม่ระบุ'), null);
    eq(parseDur('n/a'), null);
  });

  test('เกิน 24 ชม. ถูกตัดที่ 1440', function(){
    eq(parseDur('3000'), 1440);
    eq(parseDur('-5'), null, 'ค่าลบไม่รับ');
  });
});

group('อ่านเวลานาฬิกา · parseClock', function(){

  test('รูปแบบต่าง ๆ', function(){
    eq(parseClock('08:00'), 480);
    eq(parseClock('8:00'), 480);
    eq(parseClock('08.00'), 480);
    eq(parseClock('0800'), 480);
    eq(parseClock('8'), 480);
    eq(parseClock('17:30'), 1050);
    eq(parseClock('12:00'), 720);
  });

  test('บ่าย / เช้า', function(){
    eq(parseClock('5:30 pm'), 1050);
    eq(parseClock('12:00 am'), 0);
  });

  test('ค่าที่ Sheets แปลงชนิด', function(){
    eq(parseClock(0.5), 720);
    eq(parseClock([8,0,0,0]), 480);
    eq(parseClock('Date(1899,11,30,8,0,0)'), 480);
  });

  test('อ่านไม่ออกคืน null', function(){
    eq(parseClock(''), null);
    eq(parseClock('ปิด'), null);
    eq(parseClock('25:00'), null, 'ชั่วโมงเกินจริง');
  });
});

group('แสดงผลกลับเป็นข้อความ', function(){
  test('fmtDur', function(){
    eq(fmtDur(45), '45 นาที');
    eq(fmtDur(60), '1 ชม.');
    eq(fmtDur(90), '1 ชม. 30 นาที');
    eq(fmtDur(null), '—');
  });
  test('fmtClock', function(){
    eq(fmtClock(480), '08:00');
    eq(fmtClock(0), '00:00');
    eq(fmtClock(1050), '17:30');
    eq(fmtClock(null), '—');
  });
});

group('วันหยุดประจำสัปดาห์ · impDow', function(){
  test('ตัวย่อไทย', function(){
    eq(impDow('จ,อ'), [1,2]);
    eq(impDow('อา'), [0], 'อา = อาทิตย์ ไม่ใช่ อังคาร');
    eq(impDow('อ'), [2], 'อ = อังคาร');
    eq(impDow('พฤ'), [4]);
    eq(impDow('ส'), [6]);
    eq(impDow('ศ ส อา'), [0,5,6], 'คั่นด้วยช่องว่างก็ได้');
  });
  test('ชื่อเต็มและอังกฤษ', function(){
    eq(impDow('จันทร์'), [1]);
    eq(impDow('mon,tue'), [1,2]);
  });
  test('ว่าง = เปิดทุกวัน', function(){
    eq(impDow(''), []);
    eq(impDow('ทุกวัน'), []);
    eq(impDow('ไม่มี'), []);
  });
  test('เขียนกลับลงชีตแล้วอ่านซ้ำได้ค่าเดิม', function(){
    eq(impDow(dowCell([1,2])), [1,2]);
    eq(dowCell([]), '');
  });
});
