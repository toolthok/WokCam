/* ══════════ Suara — audio Gemini TTS (fungsi MURNI) ══════════
 * Gemini TTS membalas PCM 16-bit mono 24 kHz dalam base64. Modul ini mengubahnya jadi WAV,
 * menghitung durasi tepat, membuat kunci cache, dan memutuskan kapan mencoba ulang (kuota/galat sementara).
 * Tanpa DOM → bisa diuji; padanan Kotlin: AudioTrack + file WAV.
 */

export function base64KeBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/** PCM s16le mono → berkas WAV lengkap dengan header 44 byte. */
export function pcmKeWav(pcm: Uint8Array, rate = 24000): Uint8Array {
  const h = new DataView(new ArrayBuffer(44))
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) h.setUint8(o + i, s.charCodeAt(i)) }
  w(0, 'RIFF'); h.setUint32(4, 36 + pcm.length, true); w(8, 'WAVE'); w(12, 'fmt ')
  h.setUint32(16, 16, true); h.setUint16(20, 1, true); h.setUint16(22, 1, true)
  h.setUint32(24, rate, true); h.setUint32(28, rate * 2, true); h.setUint16(32, 2, true); h.setUint16(34, 16, true)
  w(36, 'data'); h.setUint32(40, pcm.length, true)
  const out = new Uint8Array(44 + pcm.length)
  out.set(new Uint8Array(h.buffer), 0)
  out.set(pcm, 44)
  return out
}

export const durasiPcmMs = (byteLen: number, rate = 24000): number => Math.round((byteLen / 2 / rate) * 1000)

type Bagian = { inlineData?: { data?: string; mimeType?: string }; inline_data?: { data?: string; mime_type?: string } }

/** Ambil audio dari respons generateContent. null jika tak ada audio (mis. teks ditolak). */
export function ambilAudioGemini(json: unknown): { pcm: Uint8Array; rate: number } | null {
  const parts = (json as { candidates?: { content?: { parts?: Bagian[] } }[] })?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return null
  for (const p of parts) {
    const d = p?.inlineData ?? p?.inline_data
    const data = d?.data
    if (data) {
      const mime = String((d as { mimeType?: string; mime_type?: string }).mimeType ?? (d as { mime_type?: string }).mime_type ?? '')
      const m = /rate=(\d+)/.exec(mime)
      return { pcm: base64KeBytes(data), rate: m ? +m[1] : 24000 }
    }
  }
  return null
}

/** Kunci cache stabil dari bagian-bagian (teks, model, suara, gaya). */
export function kunciSuara(bagian: (string | number)[]): string {
  const s = bagian.join('\u0001')
  let a = 5381, b = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    a = ((a << 5) + a + c) | 0
    b = Math.imul(b ^ c, 16777619)
  }
  return 'g' + (a >>> 0).toString(16) + (b >>> 0).toString(16) + s.length.toString(16)
}

/** ms menunggu sebelum coba ulang; null = jangan coba ulang. 429 memakai retryDelay dari Google. */
export function jedaUlang(status: number, json: unknown, percobaan: number): number | null {
  if (percobaan >= 4) return null
  if (status === 429) {
    const err = (json as { error?: { details?: { retryDelay?: string }[]; message?: string } })?.error
    let detik = NaN
    if (Array.isArray(err?.details)) {
      for (const d of err!.details!) {
        const m = /^(\d+(?:\.\d+)?)s$/.exec(String(d?.retryDelay ?? ''))
        if (m) { detik = +m[1]; break }
      }
    }
    if (!Number.isFinite(detik)) {
      const m = /retry in (\d+(?:\.\d+)?)s/i.exec(String(err?.message ?? ''))
      detik = m ? +m[1] : 30
    }
    return Math.min(70000, Math.ceil(detik * 1000) + 1000)
  }
  if (status === 500 || status === 503) return 2000 * (percobaan + 1)
  return null
}

export function badanPermintaan(teks: string, voice: string, gaya: string) {
  const g = gaya.trim()
  const isi = g ? `${g.replace(/[:：]?\s*$/, ':')} ${teks}` : teks
  return {
    contents: [{ parts: [{ text: isi }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  }
}

export function pesanGalat(status: number, json: unknown): string {
  const msg = String((json as { error?: { message?: string } })?.error?.message ?? '').slice(0, 160)
  if (status === 401 || status === 403) return 'API key ditolak / tidak punya akses. Periksa key dan pembatasan key-nya.'
  if (status === 404) return 'Model tidak ditemukan. Ganti nama model di pengaturan.'
  if (status === 429) return 'Kuota habis (batas tier gratis). Tunggu beberapa menit atau besok, lalu lanjutkan — scene yang sudah jadi tidak dibuat ulang.'
  if (status === 400) return `Permintaan ditolak: ${msg || 'cek model/nama suara'}`
  return `Galat ${status}${msg ? ': ' + msg : ''}`
}

export const SUARA_GEMINI = [
  'Kore', 'Puck', 'Zephyr', 'Charon', 'Leda', 'Aoede', 'Fenrir', 'Orus', 'Callirrhoe', 'Autonoe',
  'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar',
  'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafar',
]
