/* ═══ Test regresi: Suara — audio Gemini (suara-audio, murni) ═══
 * Jalankan: bun scripts/test-suara-audio.ts */
import {
  base64KeBytes, pcmKeWav, durasiPcmMs, ambilAudioGemini, kunciSuara, jedaUlang, badanPermintaan, pesanGalat, SUARA_GEMINI,
} from "../src/lib/editor/suara-audio";

let lulus = 0, gagal = 0;
const ok = (c: boolean, m: string) => { if (c) lulus++; else { gagal++; console.log("  ✗ " + m); } };

// 1 detik PCM 24 kHz = 48000 byte
ok(durasiPcmMs(48000) === 1000, "48000 byte @24k = 1000 ms");
ok(durasiPcmMs(24000) === 500, "24000 byte = 500 ms");
ok(durasiPcmMs(96000, 48000) === 1000, "rate lain dihormati");

const pcm = new Uint8Array(100).map((_, i) => i);
const wav = pcmKeWav(pcm, 24000);
const dv = new DataView(wav.buffer);
const teks = (o: number, n: number) => String.fromCharCode(...wav.slice(o, o + n));
ok(wav.length === 144, "panjang = 44 + data");
ok(teks(0, 4) === "RIFF" && teks(8, 4) === "WAVE" && teks(12, 4) === "fmt " && teks(36, 4) === "data", "penanda RIFF/WAVE/fmt/data");
ok(dv.getUint32(4, true) === 136 && dv.getUint32(40, true) === 100, "ukuran chunk benar");
ok(dv.getUint16(20, true) === 1 && dv.getUint16(22, true) === 1 && dv.getUint16(34, true) === 16, "PCM, mono, 16-bit");
ok(dv.getUint32(24, true) === 24000 && dv.getUint32(28, true) === 48000, "sample rate & byte rate");
ok(wav[44] === 0 && wav[143] === 99, "data PCM utuh");

const b64 = btoa(String.fromCharCode(...pcm));
ok(base64KeBytes(b64).every((v, i) => v === pcm[i]) && base64KeBytes(b64).length === 100, "base64 → bytes");

const resp = { candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/L16;codec=pcm;rate=24000", data: b64 } }] } }] };
const a = ambilAudioGemini(resp);
ok(!!a && a.pcm.length === 100 && a.rate === 24000, "respons dibaca (rate dari mimeType)");
ok(ambilAudioGemini({ candidates: [{ content: { parts: [{ text: "maaf" }] } }] }) === null, "tanpa audio → null");
ok(ambilAudioGemini(null) === null && ambilAudioGemini({}) === null, "respons kosong aman");
const resp2 = { candidates: [{ content: { parts: [{ inline_data: { mime_type: "audio/L16;rate=16000", data: b64 } }] } }] };
ok(ambilAudioGemini(resp2)?.rate === 16000, "snake_case + rate 16000");

const k1 = kunciSuara(["halo dunia", "m", "Kore", "g"]);
ok(k1 === kunciSuara(["halo dunia", "m", "Kore", "g"]), "kunci stabil");
ok(k1 !== kunciSuara(["halo dunia", "m", "Puck", "g"]), "beda suara → beda kunci");
ok(k1 !== kunciSuara(["halo dunia!", "m", "Kore", "g"]), "beda teks → beda kunci");
ok(kunciSuara(["ab", "c"]) !== kunciSuara(["a", "bc"]), "batas bagian tak kabur");

ok(jedaUlang(429, { error: { details: [{ "@type": "x" }, { retryDelay: "12s" }] } }, 0) === 13000, "429 pakai retryDelay + 1s");
ok(jedaUlang(429, { error: { message: "Please retry in 20.5s." } }, 0) === 21500, "429 dari pesan");
ok(jedaUlang(429, {}, 0) === 31000, "429 tanpa info → 30s+1");
ok(jedaUlang(429, { error: { details: [{ retryDelay: "500s" }] } }, 0) === 70000, "dibatasi 70 dtk");
ok(jedaUlang(500, null, 1) === 4000 && jedaUlang(503, null, 0) === 2000, "500/503 backoff");
ok(jedaUlang(403, null, 0) === null && jedaUlang(400, null, 0) === null && jedaUlang(404, null, 0) === null, "galat permanen tidak diulang");
ok(jedaUlang(429, {}, 4) === null, "maks 4 percobaan");

const b = badanPermintaan("Halo", "Kore", "Bacakan santai:") as { contents: { parts: { text: string }[] }[]; generationConfig: { responseModalities: string[]; speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } } } };
ok(b.contents[0].parts[0].text === "Bacakan santai: Halo", "gaya + teks");
ok(badanPermintaan("Halo", "Kore", "Bacakan santai").contents[0].parts[0].text === "Bacakan santai: Halo", "titik dua ditambah otomatis");
ok(badanPermintaan("Halo", "Kore", "  ").contents[0].parts[0].text === "Halo", "gaya kosong → teks polos");
ok(b.generationConfig.responseModalities[0] === "AUDIO" && b.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName === "Kore", "konfigurasi suara");

ok(pesanGalat(403, null).includes("API key") && pesanGalat(404, null).includes("Model") && pesanGalat(429, null).includes("Kuota"), "pesan galat ramah");
ok(SUARA_GEMINI.length === 30 && new Set(SUARA_GEMINI).size === 30 && SUARA_GEMINI.includes("Kore"), "30 suara unik");

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
