<#
  run.ps1 — รันชุดทดสอบผ่าน headless Chrome  (ไม่ต้องลง Node)

  ทำงานอย่างไร
    แอปประกาศ S / parseDur / recalc ด้วย let และ const ค่าพวกนี้จึงไม่ติดอยู่
    บน window เข้าถึงจากนอกหน้าไม่ได้ ตัวรันนี้จึง "ฉีด" ไฟล์เทสต์เข้าไปเป็น
    <script> ต่อท้ายในหน้าแอปเอง เทสต์จะได้อยู่ในสโคปเดียวกับโค้ดจริง

  วิธีใช้
    powershell -ExecutionPolicy Bypass -File .\tests\run.ps1
    powershell -ExecutionPolicy Bypass -File .\tests\run.ps1 -Shipped
    powershell -ExecutionPolicy Bypass -File .\tests\run.ps1 -Source "C:\path\ไฟล์.html"
    powershell -ExecutionPolicy Bypass -File .\tests\run.ps1 -Filter timeline
    powershell -ExecutionPolicy Bypass -File .\tests\run.ps1 -Keep     # เก็บไฟล์ชั่วคราวไว้ดู

  คืนค่า exit code 0 เมื่อผ่านหมด และ 1 เมื่อมีตก — เอาไปคั่น commit ได้
#>
param(
  [string]$Source  = '',
  [switch]$Shipped,
  [string]$Filter  = '',
  [switch]$Keep
)
$ErrorActionPreference = 'Stop'
$root  = Split-Path $PSScriptRoot -Parent
$tests = $PSScriptRoot

function Fail($m){ Write-Host "  [หยุด] $m" -ForegroundColor Red; exit 1 }

Write-Host "`n=== รันชุดทดสอบ ===" -ForegroundColor Cyan

# ---------- หาไฟล์ที่จะทดสอบ ----------
if($Shipped){ $Source = Join-Path $root 'index.html' }
if(-not $Source){
  $cand = @(Get-ChildItem "$env:USERPROFILE\Downloads" -Filter 'tour_pricing_app_v*.html' -File -ErrorAction SilentlyContinue |
    ForEach-Object {
      $v=0; if($_.Name -match 'v(\d+)\.html$'){ $v=[int]$Matches[1] }
      [pscustomobject]@{ File=$_; V=$v }
    } | Sort-Object V -Descending)
  if($cand.Count -eq 0){ Fail "ไม่พบ tour_pricing_app_v*.html — ระบุด้วย -Source หรือใช้ -Shipped" }
  $Source = $cand[0].File.FullName
}
if(-not (Test-Path $Source)){ Fail "ไม่พบไฟล์: $Source" }
Write-Host ("  ไฟล์ที่ทดสอบ: {0}" -f (Split-Path $Source -Leaf)) -ForegroundColor Green

# ---------- หา Chrome ----------
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if(-not $chrome){ Fail "ไม่พบ Chrome หรือ Edge — ตัวรันนี้ต้องใช้เบราว์เซอร์ตัวใดตัวหนึ่ง" }
Write-Host ("  เบราว์เซอร์: {0}" -f (Split-Path $chrome -Leaf))

# ---------- รวบรวมไฟล์เทสต์ ----------
$files = @(Get-ChildItem $tests -Filter '*.test.js' -File | Sort-Object Name)
if($Filter){ $files = @($files | Where-Object { $_.Name -like "*$Filter*" }) }
if($files.Count -eq 0){ Fail "ไม่พบไฟล์เทสต์" + $(if($Filter){" ที่ตรงกับ '$Filter'"}) }
Write-Host ("  ไฟล์เทสต์ {0} ไฟล์: {1}" -f $files.Count, (($files | ForEach-Object { $_.Name }) -join ', '))

# ---------- ประกอบหน้าทดสอบ ----------
$app = Get-Content $Source -Raw -Encoding utf8
$sb  = New-Object System.Text.StringBuilder

# ดักข้อผิดพลาดตั้งแต่ก่อนสคริปต์แอปเริ่มทำงาน
$guard = '<script>window.__err=[];window.addEventListener("error",function(e){window.__err.push((e.message||"?")+" @บรรทัด"+(e.lineno||"?"))});</script>'
$app = $app.Replace('<meta charset="UTF-8">', '<meta charset="UTF-8">' + "`n" + $guard)
[void]$sb.Append($app)

[void]$sb.Append("`n<script>`n")
[void]$sb.Append((Get-Content (Join-Path $tests '_harness.js') -Raw -Encoding utf8))
[void]$sb.Append("`n</script>`n")

foreach($f in $files){
  [void]$sb.Append("<script>/* ==== $($f.Name) ==== */`n")
  [void]$sb.Append((Get-Content $f.FullName -Raw -Encoding utf8))
  [void]$sb.Append("`n</script>`n")
}

# ตัวเดินเทสต์ — รอให้แอปวาดเสร็จก่อนเสมอ
$runner = @'
<pre id="__out" style="font:12px/1.5 Consolas,monospace;white-space:pre-wrap"></pre>
<script>
(function(){
  function ready(){
    return typeof recalc==='function'
        && document.querySelectorAll('#pageTabs button').length>0;
  }
  var tries=0;
  function go(){
    if(!ready() && tries++<60){ setTimeout(go,100); return; }
    var res={files:[],pass:0,fail:0,err:null};
    if(window.__err && window.__err.length){
      res.err='สคริปต์แอปมีข้อผิดพลาด: '+window.__err.join(' ~ ');
      document.getElementById('__out').textContent='@@'+JSON.stringify(res)+'@@';
      return;
    }
    try{ __base=JSON.stringify(S); }catch(e){ __base=null; }
    __groups.forEach(function(g){
      __cur=g;
      try{ g.fn(); }catch(e){ g.tests.push({name:'(ประกาศกลุ่มพัง)',fn:function(){ throw e; }}); }
      __cur=null;
      var out={name:g.name,tests:[]};
      g.tests.forEach(function(t){
        var rec={name:t.name,ok:true,msg:''};
        try{ reset(); t.fn(); res.pass++; }
        catch(e){ rec.ok=false; rec.msg=(e&&e.message)||String(e);
                  if(e&&!e.__assert&&e.stack){ rec.msg+=' | '+String(e.stack).split('\n')[1]; }
                  res.fail++; }
        out.tests.push(rec);
      });
      res.files.push(out);
    });
    document.getElementById('__out').textContent='@@'+JSON.stringify(res)+'@@';
  }
  go();
})();
</script>
'@
[void]$sb.Append($runner)

$tmp  = Join-Path $env:TEMP ("tp-test-" + [guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$page = Join-Path $tmp 'run.html'
[System.IO.File]::WriteAllText($page, $sb.ToString(), [System.Text.UTF8Encoding]::new($false))

# ---------- รัน ----------
$dom = Join-Path $tmp 'dom.html'
$url = 'file:///' + ($page -replace '\\','/')
& $chrome --headless=new --disable-gpu --no-sandbox --disable-extensions `
          --virtual-time-budget=30000 --user-data-dir="$tmp\prof" `
          --dump-dom $url 2>$null | Out-File $dom -Encoding utf8

if(-not (Test-Path $dom)){ Fail "เบราว์เซอร์ไม่คืนผลลัพธ์" }
$html = Get-Content $dom -Raw -Encoding utf8
$m = [regex]::Match($html, '@@(.*?)@@', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if(-not $m.Success){
  if(-not $Keep){ Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
  Fail "อ่านผลลัพธ์ไม่ได้ — แอปอาจพังตั้งแต่โหลด (ลองใส่ -Keep แล้วเปิดไฟล์ดูเอง)"
}
$json = $m.Groups[1].Value -replace '&quot;','"' -replace '&#39;',"'" -replace '&lt;','<' -replace '&gt;','>' -replace '&amp;','&'
$res = $json | ConvertFrom-Json

if($res.err){
  if(-not $Keep){ Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
  Fail $res.err
}

# ---------- รายงาน ----------
Write-Host ""
foreach($g in $res.files){
  $bad = @($g.tests | Where-Object { -not $_.ok })
  if($bad.Count -eq 0){
    Write-Host ("  [ok]   {0}  ({1})" -f $g.name, $g.tests.Count) -ForegroundColor Green
  }else{
    Write-Host ("  [ตก]   {0}  ({1} ตก จาก {2})" -f $g.name, $bad.Count, $g.tests.Count) -ForegroundColor Red
    foreach($t in $bad){ Write-Host ("           - {0}`n             {1}" -f $t.name, $t.msg) -ForegroundColor Red }
  }
}

$total = $res.pass + $res.fail
Write-Host ""
if($res.fail -eq 0){
  Write-Host ("  ผ่านหมด {0} เทสต์" -f $total) -ForegroundColor Green
}else{
  Write-Host ("  ผ่าน {0} · ตก {1} · ทั้งหมด {2}" -f $res.pass, $res.fail, $total) -ForegroundColor Red
}
if($Keep){ Write-Host ("  ไฟล์ชั่วคราว: {0}" -f $tmp) -ForegroundColor DarkGray }
else{ Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host ""
exit $(if($res.fail -eq 0){0}else{1})
