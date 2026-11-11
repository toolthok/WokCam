'use client'

/* ══════════ Suara — klien Gemini TTS (browser) + cache permanen ══════════
 * Key milik user, dikirim LANGSUNG dari browser ke Google (tanpa server kita). Hasil audio disimpan
 * di IndexedDB per (teks+model+suara+gaya) → tidak dibuat ulang → hemat kuota tier gratis.
 */

import { ambilAudioGemini, badanPermintaan, durasiPcmMs, jedaUlang, pcmKeWav, pesanGalat } from './suara-audio'

export type EntriSuara = { url: string; durMs: number }
export type OpsiGemini = { kunciApi: string; model: string; voice: string; gaya: string }

const mem = new Map<string, EntriSuara>()
export const dariMem = (k: string): EntriSuara | undefined => mem.get(k)

const NAMA_DB = 'wokcam-suara', STORE = 'audio'

function bukaDB(): Promise<IDBDatabase | null> {
  return new Promise((res) => {
    try {
      const r = indexedDB.open(NAMA_DB, 1)
      r.onupgradeneeded = () => { r.result.createObjectStore(STORE) }
      r.onsuccess = () => res(r.result)
      r.onerror = () => res(null)
    } catch { res(null) }
  })
}
async function idbGet(k: string): Promise<{ wav: ArrayBuffer; durMs: number } | null> {
  const db = await bukaDB()
  if (!db) return null
  return new Promise((res) => {
    try {
      const q = db.transaction(STORE).objectStore(STORE).get(k)
      q.onsuccess = () => res((q.result as { wav: ArrayBuffer; durMs: number }) ?? null)
      q.onerror = () => res(null)
    } catch { res(null) }
  })
}
async function idbSet(k: string, v: { wav: ArrayBuffer; durMs: number }): Promise<void> {
  const db = await bukaDB()
  if (!db) return
  await new Promise<void>((res) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(v, k)
      tx.oncomplete = () => res()
      tx.onerror = () => res()
    } catch { res() }
  })
}

const jadikanEntri = (wav: ArrayBuffer | Uint8Array, durMs: number): EntriSuara => ({
  url: URL.createObjectURL(new Blob([wav as BlobPart], { type: 'audio/wav' })), durMs,
})

export async function muatDariCache(k: string): Promise<EntriSuara | null> {
  const ada = mem.get(k)
  if (ada) return ada
  const rec = await idbGet(k)
  if (!rec) return null
  const e = jadikanEntri(rec.wav, rec.durMs)
  mem.set(k, e)
  return e
}

const tidur = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export async function sintesisScene(
  op: OpsiGemini, teks: string, kunciCache: string,
  o: { sinyal?: { batal: boolean }; onTunggu?: (detik: number) => void } = {},
): Promise<EntriSuara> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(op.model.trim())}:generateContent`
  for (let percobaan = 0; ; percobaan++) {
    if (o.sinyal?.batal) throw new Error('Dibatalkan.')
    let status = 0
    let json: unknown = null
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': op.kunciApi.trim() },
        body: JSON.stringify(badanPermintaan(teks, op.voice, op.gaya)),
      })
      status = r.status
      json = await r.json().catch(() => null)
      if (r.ok) {
        const audio = ambilAudioGemini(json)
        if (!audio) throw new Error('Respons tanpa audio (teks mungkin ditolak model). Coba ubah naskah scene ini.')
        const wav = pcmKeWav(audio.pcm, audio.rate)
        const durMs = durasiPcmMs(audio.pcm.length, audio.rate)
        const salinan = wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength) as ArrayBuffer
        await idbSet(kunciCache, { wav: salinan, durMs })
        const e = jadikanEntri(salinan, durMs)
        mem.set(kunciCache, e)
        return e
      }
    } catch (err) {
      if (status === 0) {
        if (err instanceof Error && err.message.startsWith('Respons tanpa')) throw err
        throw new Error('Gagal terhubung ke Google (periksa internet / key).')
      }
      throw err
    }
    const tunggu = jedaUlang(status, json, percobaan)
    if (tunggu === null) throw new Error(pesanGalat(status, json))
    for (let s = Math.ceil(tunggu / 1000); s > 0; s--) {
      if (o.sinyal?.batal) throw new Error('Dibatalkan.')
      o.onTunggu?.(s)
      await tidur(1000)
    }
    o.onTunggu?.(0)
  }
}
