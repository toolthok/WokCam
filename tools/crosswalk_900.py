#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Crosswalk 900 token viral -> katalog 63 teknik.
Kelas: ALIAS (sinonim teknik), PARAM (nilai parameter), RESEP (paket gaya),
BARU (kandidat teknik baru), TOLAK (subjek/konten - bukan teknik edit)."""
import io, json, collections

NAMA = {
 "CUT-A01":"Jump Cut","CUT-A02":"Hard Cut","CUT-A03":"Beat Cut","CUT-A04":"J-Cut / L-Cut",
 "CUT-A05":"Match Cut","CUT-A06":"Speed Ramp","CUT-A07":"Freeze Frame","CUT-A08":"Punch-In",
 "CUT-A09":"Silence Trim","CUT-A10":"Loop Clip",
 "LAY-B01":"PiP Corner","LAY-B02":"Split Screen","LAY-B03":"Background Removal",
 "LAY-B04":"Background Swap","LAY-B05":"Auto Reframe","LAY-B06":"Ken Burns",
 "LAY-B07":"Parallax 2D","LAY-B08":"Motion Tracking","LAY-B09":"Fullscreen Return",
 "TXT-C01":"Title Pop","TXT-C02":"Kinetic Typography","TXT-C03":"Auto Caption",
 "TXT-C04":"Lower Third","TXT-C05":"Callout","TXT-C06":"Chart Animation",
 "TXT-C07":"Stat Counter","TXT-C08":"Shape Reveal","TXT-C09":"End Card",
 "TXT-C10":"Watermark","TXT-C11":"Progress Bar",
 "FX-D01":"LUT Filter","FX-D02":"Color Match","FX-D03":"Vignette","FX-D04":"Film Grain",
 "FX-D05":"Light Leak","FX-D06":"Zoom Transition","FX-D07":"Whip Pan Transition",
 "FX-D08":"Glitch Effect","FX-D09":"Camera Shake","FX-D10":"Glow / Bloom",
 "FX-D11":"Blur Region","FX-D12":"Shape Wipe","FX-D13":"Particle FX",
 "FX-D14":"Speed Reverse","FX-D15":"Letterbox",
 "AUD-E01":"Music Duck","AUD-E02":"Beat Marker","AUD-E03":"SFX Sting",
 "AUD-E04":"Voice Enhance","AUD-E05":"Audio Fade","AUD-E06":"TTS Voiceover",
 "AUD-E07":"Ambience Bed","AUD-E08":"Rhythm Sync",
}

# (kategori, kelas_default, target_default, overrides{token:(kelas,target,catatan)}, [token])
D="TOLAK"
IMG=[
# ---------- GAMBAR 1 ----------
[("BIDIKAN SINEMATIK",D,"",{},["establishingshot","droneshot","aerialshot","topshot","widesingle","longshot","mediumshot","closeup","extremeshot","overtheshoulder"]),
 ("GERAKAN KAMERA","PARAM","LAY-B06",{"zoomin":("ALIAS","CUT-A08","zoom in = punch-in"),
  "zoomout":("ALIAS","LAY-B09","kembali layar penuh"),"trackingshot":("TOLAK","","gerak kamera saat merekam"),"orbitshot":("PARAM","LAY-B06","jalur orbit 2D")},
  ["panleft","panright","tiltup","tiltdown","zoomin","zoomout","dollyin","dollyout","trackingshot","orbitshot"]),
 ("AKSI & DINAMIKA",D,"",{"slowmotion":("BARU","FX-D16","kandidat Slow Motion (efek sudah ada di prototipe)"),
  "timelapse":("PARAM","CUT-A06","percepatan"),"hyperlapse":("PARAM","CUT-A06","percepatan"),
  "fastmotion":("PARAM","CUT-A06","percepatan"),"freezeframe":("ALIAS","CUT-A07",""),
  "reverse":("ALIAS","FX-D14",""),"bullettime":("BARU","FX-D27","bullet time, berat"),
  "matchcut":("ALIAS","CUT-A05",""),"montage":("RESEP","MONTASE","pola ritme klip"),
  "whippan":("ALIAS","FX-D07","")},[]),
 ("CAHAYA & SUASANA",D,"",{"goldenhour":("ALIAS","FX-D01","LUT hangat - sudah di KDICT"),
  "bluehour":("PARAM","FX-D01","LUT dingin"),"moody":("RESEP","","paket LUT+musik"),
  "highcontrast":("PARAM","FX-D01","kontras naik")},[]),
 ("LANSKAP & ALAM",D,"",{},[]),("KOTA",D,"",{},[]),("ORANG & AKTIVITAS",D,"",{},[]),
 ("GAYA HIDUP",D,"",{},[]),
 ("TEKNOLOGI & DIGITAL",D,"",{"glitcheffect":("ALIAS","FX-D08",""),"cyberpunk":("PARAM","FX-D01","LUT neon")},[]),
 ("PRODUK & BRAND",D,"",{"logoreveal":("ALIAS","TXT-C01","reveal logo/judul")},[]),
],
# ---------- GAMBAR 2 ----------
[("BIDIKAN KAMERA",D,"",{},[]),
 ("GERAKAN KAMERA 2",D,"",{"pushin":("ALIAS","CUT-A08",""),"pullout":("ALIAS","LAY-B09",""),
  "rackfocus":("ALIAS","FX-D11","geser fokus"),"whipzoom":("ALIAS","FX-D07","")},[]),
 ("EFEK WAKTU",D,"",{"rewind":("ALIAS","FX-D14",""),"loopshot":("ALIAS","CUT-A10",""),
  "ramping":("ALIAS","CUT-A06",""),"speedramp":("ALIAS","CUT-A06",""),
  "timefreeze":("ALIAS","CUT-A07",""),"slowzoom":("PARAM","LAY-B06","zoom pelan foto"),
  "stopmotion":("BARU","FX-D17","step frame"),"pingpong":("BARU","FX-D18","boomerang maju-mundur"),
  "stutter":("BARU","FX-D19","stutter cut")},[]),
 ("GAYA VISUAL","PARAM","FX-D01",{"cyberglow":("ALIAS","FX-D10","glow"),
  "vintage8mm":("ALIAS","FX-D01","LUT retro + FX-D04 grain"),
  "watercolor":("BARU","AI-F*","stylize AI"),"sketchstyle":("BARU","AI-F*","stylize AI"),
  "anime":("BARU","AI-F*","stylize AI"),"claymation":("BARU","AI-F*","stylize AI"),
  "comicbook":("BARU","AI-F*","stylize AI")},[]),
 ("CAHAYA & SUASANA 2",D,"",{"lensflare2":("ALIAS","FX-D05",""),"sparkle":("ALIAS","FX-D13","partikel"),
  "glowsoft":("ALIAS","FX-D10","")},[]),
 ("ALAM & LANSKAP",D,"",{},[]),("KOTA & ARSITEKTUR",D,"",{},[]),("AKTIVITAS MANUSIA",D,"",{},[]),
 ("TEKNOLOGI 2",D,"",{},[]),("PRODUK & MAKANAN",D,"",{},[]),
],
# ---------- GAMBAR 3 ----------
[("SUDUT KAMERA",D,"",{},[]),
 ("TRANSISI","ALIAS","FX-D12",{"dissolve":("BARU","CUT-B03","kandidat Crossfade - transisi dasar yang belum ada"),
  "fadeblack":("ALIAS","CUT-B02","fade to black - sudah di KDICT"),
  "flashcut":("ALIAS","CUT-A03","flash putih - sudah di KDICT"),
  "zoomtransition":("ALIAS","FX-D06",""),"lightleak":("ALIAS","FX-D05",""),
  "glitchcut":("ALIAS","FX-D08","glitch + cut"),"pageturn":("PARAM","FX-D12","varian wipe")},[]),
 ("PERGERAKAN SUBJEK",D,"",{},[]),("TEKSTUR & MATERIAL",D,"",{},[]),
 ("MOOD & EMOSI","RESEP","",{},["cozyvibe","romantic","melancholy","energetic","mysterious","peaceful","nostalgic","joyful","tense","hopeful"]),
 ("PEMANDANGAN MALAM",D,"",{},[]),("INTERIOR RUANG",D,"",{},[]),("MUSIM & CUACA",D,"",{},[]),
 ("OLAHRAGA & PERMAINAN",D,"",{},[]),
 ("INFOGRAFIS & TEKS",D,"",{"titlecard":("ALIAS","TXT-C01",""),"lowerthird":("ALIAS","TXT-C04",""),
  "countdown":("ALIAS","TXT-C07","counter mundur"),"textreveal":("ALIAS","TXT-C02","kinetic type"),
  "bulletlist":("BARU","TXT-C12","daftar poin animasi"),"chartgrowth":("ALIAS","TXT-C06",""),
  "mapzoom":("BARU","TXT-C13","animasi peta"),"iconanimate":("BARU","TXT-C14","ikon animasi"),
  "quoteframe":("BARU","TXT-C15","kartu kutipan"),"endscreen":("ALIAS","TXT-C09","")},[]),
],
# ---------- GAMBAR 4 ----------
[("GERAKAN HALUS","PARAM","LAY-B06",{"bounce":("BARU","FX-D20","spring motion"),
  "sweepin":("ALIAS","FX-D12","wipe masuk"),"sweepout":("ALIAS","FX-D12","wipe keluar")},[]),
 ("KOMPOSISI",D,"",{},[]),("PERAN & PROFESI",D,"",{},[]),("HEWAN & SATWA",D,"",{},[]),
 ("MAKANAN & MINUMAN",D,"",{},[]),("KENDARAAN",D,"",{},[]),("FASHION & GAYA",D,"",{},[]),
 ("KOTA MALAM & MODERN",D,"",{"skylinepan":("PARAM","LAY-B06","pan foto"),
  "citytimelapse":("PARAM","CUT-A06","kecepatan tinggi")},[]),
 ("EFEK VISUAL",D,"",{"bokehblur":("ALIAS","FX-D11",""),"prismlight":("ALIAS","FX-D05",""),
  "smokeswirl":("ALIAS","FX-D13",""),"motionblur":("BARU","FX-D28","motion blur"),
  "lensdistort":("BARU","FX-D29","distorsi lensa"),"kaleidoscope":("BARU","FX-D30",""),
  "chromatic":("BARU","FX-D31","chromatic aberration"),"pixelate":("BARU","FX-D32",""),
  "halftone":("BARU","FX-D33",""),"waterripple":("BARU","FX-D34","")},[]),
 ("CERITA & NARASI","RESEP","",{"openingscene":("RESEP","HOOK","struktur pembuka"),
  "finalscene":("RESEP","CTA","struktur penutup"),"beforeafter":("ALIAS","LAY-B02","split"),
  "montagestory":("RESEP","MONTASE",""),"reveal":("ALIAS","FX-D06","zoom reveal"),
  "cliffhanger":("RESEP","STRUKTUR",""),"closingshot":("RESEP","CTA","")},[]),
],
# ---------- GAMBAR 5 ----------
[("WAKTU HARI",D,"",{},[]),("DETAIL MAKRO",D,"",{},[]),("INTERAKSI",D,"",{},[]),
 ("TEMPO & IRAMA","RESEP","",{"beatdrop":("ALIAS","AUD-E02","cut tepat beat"),
  "quickcut":("ALIAS","CUT-A02","potong cepat"),"rhythmmcut":("ALIAS","AUD-E08","ikut ritme"),
  "pulsezoom":("PARAM","CUT-A08","pulse pada beat"),"tempochange":("ALIAS","CUT-A06",""),
  "bassdrop":("ALIAS","AUD-E03","SFX"),"heartbeat":("PARAM","AUD-E03","jenis SFX"),
  "dancebeat":("PARAM","AUD-E08","pola ritme"),"musicvideo":("RESEP","","paket gaya"),
  "slowbuild":("RESEP","","pacing menaik")},[]),
 ("RUANG TERBUKA",D,"",{},[]),("EKSPRESI WAJAH",D,"",{},[]),("ALAT & OBJEK",D,"",{},[]),
 ("PERJALANAN",D,"",{},[]),
 ("EFEK KAMERA","PARAM","FX-D11",{"vignette":("ALIAS","FX-D03",""),
  "doubleexposure":("BARU","FX-D21",""),"filmburn":("ALIAS","FX-D05",""),
  "lightleak2":("ALIAS","FX-D05",""),"analogfilm":("ALIAS","FX-D01","LUT analog"),
  "ghosting":("BARU","FX-D22","echo/trail"),"tiltshift":("ALIAS","FX-D11","blur miniatur"),
  "splitscreen":("ALIAS","LAY-B02","")},[]),
 ("PENUTUP & AKHIR","ALIAS","TXT-C09",{"fadeout":("ALIAS","CUT-B02",""),
  "endcredits":("ALIAS","TXT-C09",""),"thanksframe":("ALIAS","TXT-C09",""),
  "logoclose":("ALIAS","TXT-C10","logo"),"callout":("ALIAS","TXT-C05",""),
  "subscribe":("ALIAS","TXT-C09","CTA - sudah di KDICT"),"tagline":("ALIAS","TXT-C01",""),
  "sloganreveal":("ALIAS","TXT-C01",""),"shopnow":("ALIAS","TXT-C09","CTA"),
  "backtohome":("ALIAS","TXT-C09","CTA")},[]),
],
# ---------- GAMBAR 6 ----------
[("TIPE SHOT CEPAT",D,"",{"quickzoom":("ALIAS","CUT-A08",""),"snapcut":("ALIAS","CUT-A02",""),
  "flickpan":("PARAM","LAY-B06","pan cepat"),"rapidpush":("ALIAS","CUT-A08",""),
  "whipcut":("ALIAS","FX-D07",""),"jumpcut":("ALIAS","CUT-A01",""),
  "stutterpan":("BARU","FX-D19","stutter"),"blinkshot":("BARU","CUT-A11","blink cut 1-2 frame hitam"),
  "popin":("BARU","TXT-C16","pop-in motion"),"popout":("BARU","TXT-C16","pop-out motion")},[]),
 ("PAKAIAN & ASESORIS",D,"",{},[]),("HUTAN & GUNUNG",D,"",{},[]),("PERANGKAT GAME",D,"",{},[]),
 ("PAGI KE SIANG",D,"",{},[]),("GERAKAN TANGAN",D,"",{},[]),("CAHAYA BUATAN",D,"",{},[]),
 ("PERAYAAN",D,"",{},[]),
 ("SUDUT UNIK",D,"",{"fisheye":("BARU","FX-D23","lens FX"),"tinyplanet":("BARU","FX-D24",""),
  "mirroredview":("PARAM","LAY-B02","mirror split"),"keyholeview":("BARU","FX-D25","mask bingkai"),
  "dollyzoom":("BARU","FX-D26","efek vertigo")},[]),
 ("PESAN & CTA","ALIAS","TXT-C09",{"bigtext":("ALIAS","TXT-C01","teks besar"),
  "questionframe":("BARU","TXT-C17","kartu kuis"),"promoburst":("BARU","TXT-C18","burst promo"),
  "discountreveal":("ALIAS","TXT-C01","reveal teks"),"limitedoffer":("ALIAS","TXT-C09","CTA"),
  "reviewstars":("BARU","TXT-C19","bintang rating"),"comparisonsplit":("ALIAS","LAY-B02",""),
  "beforeafter2":("ALIAS","LAY-B02",""),"guaranteebadge":("BARU","TXT-C20","badge jaminan"),
  "freeshipping":("ALIAS","TXT-C09","CTA teks")},[]),
],
# ---------- GAMBAR 7 ----------
[("JENIS LENSA",D,"",{"shallowdof":("ALIAS","FX-D11","blur latar"),
  "tiltshiftlens":("ALIAS","FX-D11",""),"softfocuslens":("PARAM","FX-D11",""),
  "anamorphic":("RESEP","FX-D15","letterbox + flare")},[]),
 ("TEKNIK PENCAHAYAAN",D,"",{"highkey":("PARAM","FX-D01","LUT terang"),
  "lowkey":("PARAM","FX-D01","LUT gelap"),"chiaroscuro":("PARAM","FX-D01","kontras dramatis")},[]),
 ("POLA GERAKAN",D,"",{"handheldshake":("ALIAS","FX-D09","guncangan kamera")},[]),
 ("RASIO & FORMAT","PARAM","RASIO",{"letterbox":("ALIAS","FX-D15","sudah di KDICT")},[]),
 ("PERSPEKTIF",D,"",{},[]),
 ("GAYA FILM","RESEP","",{},["noirfilm","westernfilm","horrorfilm","documentary","musicvideo2","wesandersonstyle","nouvellevague","filmnoir2","mockumentary","artfilm"]),
 ("SUASANA WARNA","ALIAS","FX-D01",{},["warmtone","coldtone","tealorange","monochrome","desaturated","vibrantcolor","sepiatone","pastelpalette","neonpalette","earthtone"]),
 ("EMOSI KARAKTER",D,"",{},[]),
 ("GERAK DALAM FRAME","PARAM","LAY-B06",{"stillframe":("ALIAS","CUT-A07",""),
  "shiftfocus":("ALIAS","FX-D11",""),"zoombreath":("PARAM","CUT-A08",""),
  "reframeaction":("ALIAS","LAY-B05","auto reframe")},[]),
 ("LOKASI",D,"",{},[]),
],
# ---------- GAMBAR 8 ----------
[("KOMPOSISI SHOT",D,"",{"reactionshot":("ALIAS","LAY-B01","PiP reaksi"),
  "insertshot":("ALIAS","LAY-B01","sisipan"),"cutawayshot":("ALIAS","LAY-B01","sisipan"),
  "pointofinterest":("ALIAS","TXT-C05","callout")},[]),
 ("PENCAHAYAAN ALAMI",D,"",{},[]),
 ("TEKNIK KAMERA",D,"",{"zoomrack":("ALIAS","FX-D11","rack focus + zoom"),
  "clockwisepan":("PARAM","LAY-B06",""),"pivotshot":("PARAM","LAY-B06",""),
  "slowtilt":("PARAM","LAY-B06","")},[]),
 ("KOSTUM & GAYA",D,"",{},[]),("EKSPRESI SINEMATIK",D,"",{},[]),
 ("TRANSISI ADEGAN","ALIAS","",{"matchdissolve":("ALIAS","CUT-A05",""),
  "smashcut":("ALIAS","CUT-A02","cut keras"),"jumpswitch":("ALIAS","CUT-A01",""),
  "sidewipe":("ALIAS","FX-D12",""),"irisclose":("ALIAS","FX-D12",""),
  "splitfade":("BARU","CUT-B04","split fade"),"crossfade":("BARU","CUT-B03","crossfade"),
  "wipeup":("ALIAS","FX-D12",""),"blackcut":("ALIAS","CUT-B02","lewat hitam"),
  "fadein":("ALIAS","CUT-B02","dari hitam")},[]),
 ("TEKSTUR PERMUKAAN",D,"",{},[]),
 ("TEMPO SINEMATIK","RESEP","",{"lingeringshot":("PARAM","CUT-A06","diperlambat"),
  "quickmontage":("RESEP","MONTASE",""),"suspenseslow":("PARAM","CUT-A06",""),
  "pauseframe":("ALIAS","CUT-A07","freeze"),"rushforward":("PARAM","CUT-A06",""),
  "pulsebeat":("ALIAS","AUD-E08",""),"buildup":("RESEP","",""),
  "openingpace":("RESEP","HOOK",""),"calmpace":("RESEP","",""),
  "climaxshot":("RESEP","PAYOFF","")},[]),
 ("SUASANA LINGKUNGAN",D,"",{},[]),
 ("BINGKAI ADEGAN","ALIAS","FX-D25",{"splitframe":("ALIAS","LAY-B02",""),
  "screenwithin":("ALIAS","LAY-B01","PiP"),
  "borderframe":("BARU","FX-D25","mask bingkai"),"windowframe":("BARU","FX-D25","mask bingkai"),
  "doorframe":("BARU","FX-D25","mask bingkai"),"mirrorframe":("BARU","FX-D25","mask bingkai"),
  "archframe":("BARU","FX-D25","mask bingkai"),"panelframe":("BARU","FX-D25","mask bingkai"),
  "tvframe":("BARU","FX-D25","mask bingkai"),"polaroidframe":("BARU","FX-D25","mask bingkai")},[]),
],
# ---------- GAMBAR 9 ----------
[("JARAK KAMERA",D,"",{},[]),
 ("TEKNIK PERGANTIAN","ALIAS","",{"hardcut":("ALIAS","CUT-A02",""),
  "softcut":("BARU","CUT-B03","= crossfade"),"luma":("ALIAS","FX-D12","luma wipe"),
  "dipwhite":("BARU","CUT-B05","dip to white"),"dipblack":("ALIAS","CUT-B02","dip to black"),
  "timeskip":("BARU","CUT-B06","lompatan waktu"),"sceneshift":("PARAM","FX-D12","transisi generik"),
  "linkcut":("ALIAS","CUT-A02",""),"filmcut":("ALIAS","CUT-A02",""),
  "colorcut":("BARU","CUT-A12","color flash cut")},[]),
 ("TEKSTUR KAIN",D,"",{},[]),("SUASANA TEMPAT",D,"",{},[]),
 ("PERGERAKAN LEMBUT","PARAM","LAY-B06",{"easeinout":("PARAM","EASING","kurva easing"),
  "dreamymotion":("ALIAS","FX-D10","glow lembut"),"calmpush":("PARAM","CUT-A08","push perlahan")},[]),
 ("EMOSI RUANG","RESEP","",{},[]),
 ("EFEK CAHAYA","ALIAS","FX-D05",{"bloomglow":("ALIAS","FX-D10",""),
  "glowedge":("ALIAS","FX-D10",""),"sparkleparticles":("ALIAS","FX-D13",""),
  "neonreflect":(D,"","")},[]),
 ("GAYA DOKUMENTER","RESEP","",{"handheldreal":("PARAM","FX-D09","shake halus"),
  "interview":("RESEP","INTERVIEW","lower third + duck"),"talkinghead":("ALIAS","LAY-B01","sudah di KDICT"),
  "broll":("BARU","LAY-B10","slot b-roll/insert"),"ambientsound":("ALIAS","AUD-E07",""),
  "observational":("RESEP","","")},[]),
 ("KONTRAS & BAYANGAN","PARAM","FX-D01",{"midtonebalance":("PARAM","FX-D01","kurva midtone")},[]),
 ("PENUTUP ADEGAN","ALIAS","",{"fadetoblack":("ALIAS","CUT-B02","sudah di KDICT"),
  "fadetowhite":("BARU","CUT-B05","dip to white"),"holdframe":("ALIAS","CUT-A07","freeze"),
  "slowfade":("PARAM","CUT-B02","durasi panjang"),"lastlook":("RESEP","CTA","")},[]),
],
]
# daftar token per kategori (urutan sesuai gambar)
TOKENS={
("G1","GERAKAN KAMERA"):["panleft","panright","tiltup","tiltdown","zoomin","zoomout","dollyin","dollyout","trackingshot","orbitshot"],
("G1","AKSI & DINAMIKA"):["slowmotion","timelapse","hyperlapse","fastmotion","freezeframe","reverse","bullettime","matchcut","montage","whippan"],
("G1","CAHAYA & SUASANA"):["goldenhour","bluehour","backlight","lowlight","neonlight","candlelight","moody","highcontrast","softlight","hardlight"],
("G1","TEKNOLOGI & DIGITAL"):["screenrecord","futuristicface","futuristicui","coding","hacking","datastream","glitcheffect","cyberpunk","vrworld","hologram"],
("G1","PRODUK & BRAND"):["productshot","unboxing","closeupproduct","handheldshot","flatlay","360product","brandstory","logoreveal","packaging","commercial"],
("G2","GERAKAN KAMERA 2"):["crane","handheld","steadicam","pushin","pullout","rackfocus","pedestal","arcshot","whipzoom","rollshot"],
("G2","EFEK WAKTU"):["stopmotion","rewind","loopshot","ramping","slowzoom","speedramp","timefreeze","pingpong","stutter","flashback"],
("G2","GAYA VISUAL"):["vintage8mm","noirstyle","pastel","cyberglow","watercolor","sketchstyle","anime","claymation","retrowave","comicbook"],
("G2","CAHAYA & SUASANA 2"):["sunbeam","lensflare2","rimlight","fogmist","sparkle","dusklight","moonlight","stormlight","spotlight","glowsoft"],
("G3","TRANSISI"):["wipeleft","irisopen","dissolve","fadeblack","flashcut","zoomtransition","spinwipe","lightleak","glitchcut","pageturn"],
("G3","INFOGRAFIS & TEKS"):["titlecard","lowerthird","countdown","textreveal","bulletlist","chartgrowth","mapzoom","iconanimate","quoteframe","endscreen"],
("G4","GERAKAN HALUS"):["glide","float","drift","sway","bounce","spiral","zigzag","pendulum","sweepin","sweepout"],
("G4","KOTA MALAM & MODERN"):["skylinepan","citytimelapse","nightmarket","subwayplatform","towerclimb","rooftopparty","nightbridge","cityfog","glasstower","pedestrians"],
("G4","EFEK VISUAL"):["bokehblur","motionblur","lensdistort","prismlight","kaleidoscope","chromatic","pixelate","halftone","smokeswirl","waterripple"],
("G4","CERITA & NARASI"):["openingscene","finalscene","beforeafter","storyboard","flashbackscene","montagestory","reveal","cliffhanger","opendoor","closingshot"],
("G5","TEMPO & IRAMA"):["beatdrop","slowbuild","quickcut","rhythmmcut","pulsezoom","bassdrop","heartbeat","musicvideo","dancebeat","tempochange"],
("G5","EFEK KAMERA"):["vignette","sharpfocus","softfocus","doubleexposure","filmburn","lightleak2","analogfilm","ghosting","tiltshift","splitscreen"],
("G5","PENUTUP & AKHIR"):["fadeout","endcredits","thanksframe","logoclose","callout","subscribe","tagline","sloganreveal","shopnow","backtohome"],
("G6","TIPE SHOT CEPAT"):["quickzoom","snapcut","flickpan","rapidpush","whipcut","jumpcut","stutterpan","blinkshot","popin","popout"],
("G6","SUDUT UNIK"):["fisheye","tinyplanet","reflection","shadowplay","mirroredview","underwatercam","keyholeview","dollyzoom","ceilingview","floorview"],
("G6","PESAN & CTA"):["bigtext","questionframe","promoburst","discountreveal","limitedoffer","reviewstars","comparisonsplit","beforeafter2","guaranteebadge","freeshipping"],
("G7","JENIS LENSA"):["wideangle","telephoto","macrolens","fisheyelens","anamorphic","primelens","zoomlens","tiltshiftlens","softfocuslens","shallowdof"],
("G7","TEKNIK PENCAHAYAAN"):["threepointlight","keylight","filllight","highkey","lowkey","chiaroscuro","practicallight","bouncedlight","sidelight","toplight"],
("G7","POLA GERAKAN"):["dollyshot","caneshot","gimbalshot","handheldshake","slidershot","orbitmove","pushdown","pullback","trackside","followshot"],
("G7","RASIO & FORMAT"):["widescreen","cinemascope","squareframe","verticalframe","letterbox","fullframe","imax","academyratio","fourbythree","portrait"],
("G7","GERAK DALAM FRAME"):["slowpan","fastpan","stillframe","breathing","walkintoframe","walkoutframe","shiftfocus","zoombreath","reframeaction","moveacross"],
("G8","KOMPOSISI SHOT"):["extremelongshot","fullbodyshot","kneeshot","waistshot","chestshot","insertshot","cutawayshot","reactionshot","pointofinterest","negativespace2"],
("G8","TEKNIK KAMERA"):["jibshot","slowtilt","rollingshot","crabshot","snorricam","undershoulder","clockwisepan","pivotshot","zoomrack","ghostshot"],
("G8","TRANSISI ADEGAN"):["matchdissolve","smashcut","jumpswitch","sidewipe","irisclose","splitfade","crossfade","wipeup","blackcut","fadein"],
("G8","TEMPO SINEMATIK"):["lingeringshot","quickmontage","suspenseslow","buildup","pauseframe","rushforward","calmpace","pulsebeat","openingpace","climaxshot"],
("G8","BINGKAI ADEGAN"):["splitframe","borderframe","windowframe","doorframe","mirrorframe","archframe","screenwithin","panelframe","tvframe","polaroidframe"],
("G9","TEKNIK PERGANTIAN"):["hardcut","softcut","luma","dipwhite","dipblack","timeskip","sceneshift","linkcut","filmcut","colorcut"],
("G9","PERGERAKAN LEMBUT"):["gentlesway","slowrise","softturn","easeinout","dreamymotion","flowwave","tiltfloat","hoverglide","driftpan","calmpush"],
("G9","EFEK CAHAYA"):["lenshalo","starburst","bloomglow","neonreflect","sunflare2","lightbeamhaze","glowedge","sparkleparticles","rimsparkle","flaretrail"],
("G9","GAYA DOKUMENTER"):["handheldreal","flyonwall","observational","interview","broll","talkinghead","archivefootage","candidmoment","ambientsound","rawcamera"],
("G9","KONTRAS & BAYANGAN"):["harshshadow","softshadow","longshadow","shadowsilhouette","contrastedge","deepblack","brightwhite","midtonebalance","shadowfall","lowcontrast"],
("G9","PENUTUP ADEGAN"):["fadetoblack","fadetowhite","holdframe","lastlook","slowfade","endlight","closingdoor","sunsetexit","walkaway","finalpose"],
}
# --- pelengkap 53 kategori (semuanya TOLAK kecuali yang diberi override di IMG) ---
TOKENS.update({
("G1","BIDIKAN SINEMATIK"):["establishingshot","droneshot","aerialshot","topshot","widesingle","longshot","mediumshot","closeup","extremeshot","overtheshoulder"],
("G1","LANSKAP & ALAM"):["mountainview","oceanview","forestwalk","waterfall","sunrise","sunset","beachview","desertshot","rainyday","storm"],
("G1","KOTA"):["cityscape","nightcity","skyscraper","streetview","trafficshot","timesquare","bridgeview","alleyshot","rooftopview","neonsign"],
("G1","ORANG & AKTIVITAS"):["walking","running","jumping","dancing","talking","laughing","thinking","working","meditation","driving"],
("G1","GAYA HIDUP"):["morningroutine","coffeetime","workspace","studymode","readingnook","gymworkout","yogapractice","cooking","shopping","travelvlog"],
("G2","BIDIKAN KAMERA"):["macroshot","eyelevel","lowangle","highangle","dutchangle","povshot","overhead","profileshot","backview","frontview"],
("G2","ALAM & LANSKAP"):["meadow","canyon","snowfield","lakeshore","jungle","volcano","cliffedge","autumnleaves","cherryblossom","aurora"],
("G2","KOTA & ARSITEKTUR"):["alleyway","metrostation","marketstreet","cafefront","subwaytrain","parkbench","bridgecross","facade","lobby","elevator"],
("G2","AKTIVITAS MANUSIA"):["cheers","hugging","typing","painting","reading","writing","sleeping","waving","smiling","climbing"],
("G2","TEKNOLOGI 2"):["holoui","neuralnet","radarscan","circuitzoom","codeflow","smartphone","laptopopen","robotarm","satellite","eyescan"],
("G2","PRODUK & MAKANAN"):["foodshot","drinkpour","jewelryshot","sneakerspin","perfumemist","watchdetail","skincarebottle","coffeepour","bakery","lightbox"],
("G3","SUDUT KAMERA"):["birdseye","wormseye","threequarter","closeupface","extremewide","establishingwide","ots2","twoshot","groupshot","silhouettecam"],
("G3","PERGERAKAN SUBJEK"):["sprint","skateboard","bicycleride","swimming","surfing","kickflip","punch","catchball","pouring","stretching"],
("G3","TEKSTUR & MATERIAL"):["silkfabric","denimtexture","leathergrain","woodgrain","marbletexture","concretewall","glassreflect","metalbrush","velvetfold","paperfold"],
("G3","MOOD & EMOSI"):["cozyvibe","romantic","melancholy","energetic","mysterious","peaceful","nostalgic","joyful","tense","hopeful"],
("G3","PEMANDANGAN MALAM"):["starfield","milkyway","nightrain","citylights","firework","campfire","lanternglow","moonrise","nightdrive","neonrain"],
("G3","INTERIOR RUANG"):["livingroom","bedroomcalm","kitchenmorning","officedesk","cafeinterior","hotellobby","boutiqueshop","gallerywall","bathroomspa","rooftopterrace"],
("G3","MUSIM & CUACA"):["springbloom","summerbeach","autumnwalk","winterfrost","rainwindow","snowfall2","sunnyday","foggymorning","thunderstorm","rainbowsky"],
("G3","OLAHRAGA & PERMAINAN"):["soccerkick","basketshot","tennisservice","gamingsetup","chessboard","yogaflow","martialarts","climbingwall","skiing","golfswing"],
("G4","KOMPOSISI"):["centered","ruleofthirds","leadinglines","symmetry","framewithin","negativespace","depthlayers","foreground","background","diagonal"],
("G4","PERAN & PROFESI"):["chef","doctor","pilot","photographer","musician","artist","firefighter","architect","farmer","scientist"],
("G4","HEWAN & SATWA"):["catplay","dogrun","birdflight","fishswim","horseride","butterfly","wildlife","puppylove","owlnight","turtlewalk"],
("G4","MAKANAN & MINUMAN"):["pizzabake","burgerstack","saladprep","icecreamscoop","teapour","smoothieblend","sushirill","pastrydecor","breakfasttable","barbecue"],
("G4","KENDARAAN"):["carcruise","motorbikeride","trainpass","airplanetakeoff","boatsail","truckload","scooterpark","taxirush","busstop","yachtdeck"],
("G4","FASHION & GAYA"):["runwayshow","streetstyle","lookbook","outfitcheck","hatstyle","jacketzip","shoesteps","accessoryclose","runwaypose","mirrorselfie"],
("G5","WAKTU HARI"):["dawnlight","morningmist","middayglare","goldenafternoon","twilight","afterglow","earlymorning","lateevening","sunsetglow","midnightcalm"],
("G5","DETAIL MAKRO"):["waterdrop","dewdrops","petaldetail","insectmacro","fingerprint","eyeclose","lipscloseup","fabricweave","coffeefoam","sandgrain"],
("G5","INTERAKSI"):["handshake","passingobject","opendoorwalk","tapscreen","lookingback","pointing","highfive","sharingfood","groupwalk","piggyback"],
("G5","RUANG TERBUKA"):["plaza","parkpath","publicsquare","campus","stadium","harbor","fieldview","trailhead","viewpoint","lighthouse"],
("G5","EKSPRESI WAJAH"):["smirk","surprised","thoughtful","frown","winking","laughout","tearful","confident","focused","calmsmile"],
("G5","ALAT & OBJEK"):["keyboardtype","penwrite","phonescroll","cameraclick","clockticking","ropeknot","scissorcut","paintbrush","toolkit","gearturn"],
("G5","PERJALANAN"):["roadtrip","hikingpath","campingtent","sailingtrip","cityexplore","backpacker","airportarrival","pilgrimage","coastdrive","bridgewalk"],
("G6","PAKAIAN & ASESORIS"):["hoodie","sweater","scarfwrap","sunglasses","backpackstyle","watchwear","beltdetail","hatwear","gloves","necklace"],
("G6","HUTAN & GUNUNG"):["pinetrees","mistymountain","rockyridge","bamboogrove","mossforest","riverstream","hilltop","mountainpeak","valleyview","waterfall2"],
("G6","PERANGKAT GAME"):["controllergrip","arcadecabinet","pixelworld","retrogame","esportsarena","headsetplay","gamingchair","levelup","scorescreen","questmap"],
("G6","PAGI KE SIANG"):["sunrisewalk","breakfastscene","commutemorning","officestart","lunchbreak","afternoonwork","coffeerun","cleanroom","meetingroom","sidewalkwalk"],
("G6","GERAKAN TANGAN"):["handwave","fingerpoint","thumbsup","fistpump","handsfolded","palmopen","writinghand","pickup","holdcup","clapping"],
("G6","CAHAYA BUATAN"):["studiolight","ringlight","candlelit","lanternlight","tubelight","projectorbeam","stagelight","tvglow","fluorescent","laserbeam"],
("G6","PERAYAAN"):["birthdaycake","newyearcountdown","weddingdance","festivalcrowd","confetti","fireworkshow","graduation","parade","lanternfestival","holidaydecor"],
("G7","PERSPEKTIF"):["worldview","personview","droneangle","periscope","underangle","frogperspective","birdperspective","sidelooking","overlookview","surveillance"],
("G7","GAYA FILM"):["noirfilm","westernfilm","horrorfilm","documentary","musicvideo2","wesandersonstyle","nouvellevague","filmnoir2","mockumentary","artfilm"],
("G7","SUASANA WARNA"):["warmtone","coldtone","tealorange","monochrome","desaturated","vibrantcolor","sepiatone","pastelpalette","neonpalette","earthtone"],
("G7","EMOSI KARAKTER"):["determined","lonely","excited","anxious","relaxed","angry","shocked","playful","serious","proud"],
("G7","LOKASI"):["forestclearing","desertdune","islandbeach","mountainroad","cityrooftop","warehouse","greenhouse","theatre","libraryhall","temple"],
("G8","PENCAHAYAAN ALAMI"):["overcastlight","hardsunlight","skylight","windowlight","moonlight2","twilightglow","backlitmist","goldenrim","shadowedface","beamlight"],
("G8","KOSTUM & GAYA"):["vintagedress","uniformlook","sportswear","formalsuit","bohostyle","streetwear2","utilitywear","eveninggown","workwear","casualcotton"],
("G8","EKSPRESI SINEMATIK"):["emotionalclose","distantgaze","quietmoment","sharpstare","slowsmile","teardrop","deepbreath","nervousglance","resolute","wonder"],
("G8","TEKSTUR PERMUKAAN"):["sandtexture","rockcrack","rustymetal","wetpavement","frostglass","cloudcotton","woodplank","tilelines","rippledwater","bricksurface"],
("G8","SUASANA LINGKUNGAN"):["foggyair","dustyair","humidheat","snowysilence","breezymorning","stormyclouds","sunnyglare","coldwind","warmevening","starrysky"],
("G9","JARAK KAMERA"):["closerange","midrange","farrange","nearfocus","distantframe","intimatedistance","socialdistance","publicdistance","hyperclose","longdistance"],
("G9","TEKSTUR KAIN"):["cottonknit","linenweave","satinsheen","tweedtexture","chiffonsoft","canvasfabric","leatherwrinkle","furtexture","velveteen","mesh"],
("G9","SUASANA TEMPAT"):["cozycafe","busyrestaurant","quietlibrary","emptyhall","crowdedplaza","nightstreet","openfield","tinyroom","bigwarehouse","sidealley"],
("G9","EMOSI RUANG"):["isolation","togetherness","tension","relief","nostalgia2","claustrophobic","openness","wonderment","intimacy","anticipation"],
})

rows=[]
no=0
for gi, cats in enumerate(IMG, 1):
    for c in cats:
        kat, dcls, dtgt, ovr = c[0], c[1], c[2], c[3]
        toks = TOKENS.get((f"G{gi}", kat), [])
        for t in toks:
            no += 1
            cls, tgt, note = ovr.get(t, (dcls, dtgt, ""))
            rows.append((no, t, f"G{gi}", kat, cls, tgt, note))

cnt = collections.Counter(r[4] for r in rows)
alias_codes = sorted({r[5] for r in rows if r[4]=="ALIAS" and r[5] in NAMA})
param_codes = sorted({r[5] for r in rows if r[4]=="PARAM" and r[5] in NAMA})
baru = sorted({(r[5], r[1]) for r in rows if r[4]=="BARU"})
baru_codes = sorted({r[5] for r in rows if r[4]=="BARU"})
grp = collections.defaultdict(list)
for code, tok in baru: grp[code].append(tok)

# tulis TSV
hdr = ["No","Token","Gambar","Kategori Asal","Kelas","Target","Nama Teknik Katalog","Catatan"]
lines=["\t".join(hdr)]
for no,t,g,k,cls,tgt,note in rows:
    lines.append("\t".join([str(no),t,g,k,cls,tgt,NAMA.get(tgt,"") if cls in("ALIAS","PARAM") else "",note]))
io.open("/home/z/my-project/download/crosswalk_900token_v1.tsv","w",encoding="utf-8").write("\n".join(lines)+"\n")

# tulis JSON
out = {
 "meta":{"sumber":"9 screenshot token viral (900 token)","katalog":"data_teknik.js v1 (63 teknik)",
  "kelas":{"ALIAS":"sinonim langsung teknik katalog","PARAM":"nilai parameter teknik katalog",
   "RESEP":"paket gaya/mood/tempo (LUT+musik+ritme)","BARU":"kandidat teknik baru katalog v1.1",
   "TOLAK":"subjek/konten - hanya untuk prompt AI generation, bukan teknik edit"}},
 "alias":{c:[r[1] for r in rows if r[4]=="ALIAS" and r[5]==c] for c in alias_codes},
 "param":{c:[r[1] for r in rows if r[4]=="PARAM" and r[5]==c] for c in param_codes},
 "resep_tokens":[r[1] for r in rows if r[4]=="RESEP"],
 "kandidat_baru":{c:sorted(t) for c,t in grp.items()},
 "tolak":[r[1] for r in rows if r[4]=="TOLAK"],
}
io.open("/home/z/my-project/download/aliases_crosswalk.json","w",encoding="utf-8").write(
    json.dumps(out, ensure_ascii=False, indent=1))

print("TOTAL token :", len(rows))
print("ALIAS       :", cnt["ALIAS"], "-> menutup", len(alias_codes), "teknik katalog")
print("PARAM       :", cnt["PARAM"], "-> menyentuh", len(param_codes), "teknik katalog")
print("RESEP       :", cnt["RESEP"])
print("BARU        :", cnt["BARU"], "->", len(baru_codes), "kode kandidat baru")
print("TOLAK       :", cnt["TOLAK"])
print()
print("Kode kandidat BARU:", ", ".join(baru_codes))
print()
cov = set(alias_codes)|set(param_codes)
print(f"Cakupan katalog via ALIAS+PARAM: {len(cov)}/63")
print("Belum tersentuh token:", 63-len(cov))
