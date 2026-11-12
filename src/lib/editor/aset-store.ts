'use client'

/* ══════════ Penyimpanan berkas aset overlay (IndexedDB, di perangkat) ══════════
 * Foto/video tidak masuk localStorage (terlalu kecil kapasitasnya). Gambar dikecilkan dulu
 * (sisi terpanjang ≤ 1280 px) agar hemat ruang; video disimpan apa adanya (dibatasi di UI).
 */

const NAMA_DB = 'wokcam-aset'
const STORE = 'berkas'
let dbP: Promise<IDBDatabase | null> | null = null
const urlCache = new Map<string, string>()

function bukaDb(): Promise<IDBDatabase | null> {
  if (!dbP) {
    dbP = new Promise((res) => {
      try {
        const r = indexedDB.open(NAMA_DB, 1)
        r.onupgradeneeded = () => { r.result.createObjectStore(STORE) }
        r.onsuccess = () => res(r.result)
        r.onerror = () => res(null)
      } catch { res(null) }
    })
  }
  return dbP
}

export async function simpanBerkasAset(id: string, berkas: Blob): Promise<boolean> {
  const d = await bukaDb()
  if (!d) return false
  return new Promise((res) => {
    try {
      const tx = d.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(berkas, id)
      tx.oncomplete = () => res(true)
      tx.onerror = () => res(false)
      tx.onabort = () => res(false)
    } catch { res(false) }
  })
}

/** URL objek untuk aset (sinkron bila sudah pernah dimuat). */
export function urlAsetSinkron(id: string): string | null {
  return urlCache.get(id) ?? null
}

export async function urlAset(id: string): Promise<string | null> {
  const c = urlCache.get(id)
  if (c) return c
  const d = await bukaDb()
  if (!d) return null
  const blob = await new Promise<Blob | null>((res) => {
    try {
      const q = d.transaction(STORE).objectStore(STORE).get(id)
      q.onsuccess = () => res((q.result as Blob) ?? null)
      q.onerror = () => res(null)
    } catch { res(null) }
  })
  if (!blob) return null
  const u = URL.createObjectURL(blob)
  urlCache.set(id, u)
  return u
}

export async function hapusBerkasAset(id: string): Promise<void> {
  const u = urlCache.get(id)
  if (u) { URL.revokeObjectURL(u); urlCache.delete(id) }
  const d = await bukaDb()
  if (!d) return
  await new Promise<void>((res) => {
    try {
      const tx = d.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => res()
      tx.onerror = () => res()
    } catch { res() }
  })
}

/** Kecilkan gambar (sisi terpanjang ≤ maks px). PNG/WebP tetap dengan alpha. Gagal → berkas asli. */
export async function kecilkanGambar(berkas: File, maks = 1280): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return berkas
  try {
    const bmp = await createImageBitmap(berkas)
    const s = Math.min(1, maks / Math.max(bmp.width, bmp.height))
    if (s >= 1) { bmp.close?.(); return berkas }
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * s)
    c.height = Math.round(bmp.height * s)
    c.getContext('2d')?.drawImage(bmp, 0, 0, c.width, c.height)
    bmp.close?.()
    const tipe = berkas.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b ?? berkas), tipe, 0.92))
  } catch {
    return berkas
  }
}
