<#
  build.ps1 — สร้างไฟล์สำหรับขึ้นเว็บ โดยถอดข้อมูลจริงออกทั้งหมด

  ต้นทาง : private\master.html   (มีข้อมูลจริง · ห้ามขึ้น GitHub เด็ดขาด)
  ปลายทาง: index.html            (ตัวโปรแกรมเปล่า ๆ · ขึ้นเว็บได้)

  สิ่งที่ถูกถอดออก
    - ฐานข้อมูลสถานที่ / ร้านอาหาร / ไกด์ (รวมราคาต้นทุนและเบอร์โทรทั้งหมด)
    - ลิงก์ Google Sheet ที่ตั้งไว้เป็นค่าเริ่มต้น

  สิ่งที่เก็บไว้
    - รายชื่อจังหวัด (ไม่ใช่ความลับ และถ้าตัดออกหน้าจอจะพัง)

  วิธีใช้:  .\build.ps1
#>
param(
  [string]$Source = "$PSScriptRoot\private\master.html",
  [string]$Out    = "$PSScriptRoot\index.html"
)
$ErrorActionPreference = 'Stop'

function Fail($msg){ Write-Host "  [หยุด] $msg" -ForegroundColor Red; exit 1 }

Write-Host "`n=== build ตัวโปรแกรมสำหรับขึ้นเว็บ ===" -ForegroundColor Cyan

if(-not (Test-Path $Source)){ Fail "ไม่พบไฟล์ต้นทาง: $Source" }
$s = Get-Content $Source -Raw -Encoding utf8
Write-Host ("  อ่านต้นทาง {0:N0} ตัวอักษร" -f $s.Length)

# ---------- 1) ถอดฐานข้อมูลจริงออก ----------
$m = [regex]::Match($s, '(?m)^const DB = (\{.*\});\s*$')
if(-not $m.Success){ Fail "หาบรรทัด const DB ไม่เจอ — โครงไฟล์เปลี่ยนไปหรือเปล่า?" }

$db = $m.Groups[1].Value | ConvertFrom-Json
$nA = @($db.admissions).Count; $nR = @($db.restaurants).Count; $nG = @($db.guides).Count
Write-Host ("  พบข้อมูลจริง: สถานที่ {0} · ร้านอาหาร {1} · ไกด์ {2}" -f $nA,$nR,$nG) -ForegroundColor Yellow

$q = { param($a) ($a | ForEach-Object { '"' + ($_ -replace '\\','\\' -replace '"','\"') + '"' }) -join ',' }
$aj = & $q @($db.admAreas)
$rj = & $q @($db.resAreas)
$emptyDb = '{"admissions":[],"restaurants":[],"guides":[],"admAreas":[' + $aj + '],"resAreas":[' + $rj + ']}'

$s = $s.Remove($m.Index, $m.Length).Insert($m.Index, "const DB = $emptyDb;")
Write-Host "  ถอดข้อมูลออกแล้ว เหลือรายชื่อจังหวัดไว้กันหน้าจอพัง" -ForegroundColor Green

# ---------- 2) ล้างลิงก์ Google Sheet ที่ตั้งไว้เป็นค่าเริ่มต้น ----------
$before = $s
$s = [regex]::Replace($s, "gsUrl:'https://docs\.google\.com/spreadsheets/d/[A-Za-z0-9_\-]+/edit'", "gsUrl:''")
if($s -ne $before){ Write-Host "  ล้างลิงก์ Google Sheet ค่าเริ่มต้นแล้ว" -ForegroundColor Green }

# ---------- 3) ประทับเวลา build ----------
$stamp = "<!-- build " + (Get-Date -Format 'yyyy-MM-dd HH:mm') + " · ตัวโปรแกรมเปล่า ไม่มีข้อมูลจริง -->"
$s = $s -replace '(?m)^<!DOCTYPE html>', ("<!DOCTYPE html>`n" + $stamp)

[System.IO.File]::WriteAllText($Out, $s, [System.Text.UTF8Encoding]::new($false))
Write-Host ("  เขียน {0} ({1:N0} ตัวอักษร)" -f (Split-Path $Out -Leaf), $s.Length)

# ---------- 4) ตรวจซ้ำก่อนปล่อย ----------
Write-Host "`n  ตรวจไฟล์ที่ได้:" -ForegroundColor Cyan
$o = Get-Content $Out -Raw -Encoding utf8
$bad = @()

$m2 = [regex]::Match($o, '(?m)^const DB = (\{.*\});\s*$')
if(-not $m2.Success){ $bad += "หา const DB ในไฟล์ผลลัพธ์ไม่เจอ" }
else{
  $d2 = $m2.Groups[1].Value | ConvertFrom-Json
  if(@($d2.admissions).Count -ne 0){ $bad += "ยังมีสถานที่ค้างอยู่" }
  if(@($d2.restaurants).Count -ne 0){ $bad += "ยังมีร้านอาหารค้างอยู่" }
  if(@($d2.guides).Count -ne 0){ $bad += "ยังมีไกด์ค้างอยู่" }
  if($bad.Count -eq 0){ Write-Host "    [ok] ฐานข้อมูลว่างเปล่าแล้ว" -ForegroundColor Green }
}

# เบอร์โทร — ยกเว้นเฉพาะเบอร์ตัวอย่างปลอมที่อยู่ในเทมเพลตนำเข้าของตัวโปรแกรมเอง
# (ห้ามเติมเบอร์จริงลงรายการนี้เด็ดขาด ไฟล์นี้ขึ้น GitHub ด้วย)
$scan = $o -replace '081-234-5678',''
$tel = [regex]::Matches($scan, '(?<![\d])(0\d{1,2}-\d{3}-?\d{3,4}|\+66\s?\d[\d\s\-]{6,})')
if($tel.Count -gt 0){ $bad += ("พบเบอร์โทร {0} จุด เช่น {1}" -f $tel.Count, $tel[0].Value) }
else{ Write-Host "    [ok] ไม่พบเบอร์โทรจริง" -ForegroundColor Green }

# ลิงก์ Google Sheet
$sheet = [regex]::Matches($o, 'spreadsheets/d/[A-Za-z0-9_\-]{20,}')
if($sheet.Count -gt 0){ $bad += ("พบลิงก์ Google Sheet {0} จุด" -f $sheet.Count) }
else{ Write-Host "    [ok] ไม่พบลิงก์ Google Sheet" -ForegroundColor Green }

if($bad.Count){
  Remove-Item $Out -Force -ErrorAction SilentlyContinue
  Write-Host ""
  $bad | ForEach-Object { Write-Host "    [X] $_" -ForegroundColor Red }
  Fail "ลบ index.html ทิ้งแล้ว ไม่ปล่อยไฟล์ที่มีข้อมูลจริงออกไป"
}

Write-Host "`n  เสร็จ — index.html พร้อมขึ้น GitHub`n" -ForegroundColor Green
