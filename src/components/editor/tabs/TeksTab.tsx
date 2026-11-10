'use client'

import { Check, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEditor } from '@/lib/editor/store'
import { ACCENTS, CAPTION_PRESETS, type CaptionFont, type CaptionPreset, type CaptionPosition } from '@/lib/editor/model'
import { cn } from '@/lib/utils'

function PresetMini({ preset, accent }: { preset: CaptionPreset; accent: string }) {
  if (preset === 'none')
    return <span className="text-[10px] italic text-zinc-600">teks disembunyikan</span>
  if (preset === 'karaoke')
    return (
      <span className="text-[11px] font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,.6)' }}>
        Contoh <span style={{ background: accent, color: '#111', borderRadius: 3, padding: '0 2px' }}>teks</span> jelas
      </span>
    )
  if (preset === 'tiktok')
    return (
      <span className="text-[11px] font-extrabold uppercase text-white" style={{ WebkitTextStroke: '0.8px #000', paintOrder: 'stroke' }}>
        Contoh teks
      </span>
    )
  if (preset === 'box')
    return (
      <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold" style={{ background: accent, color: '#111' }}>
        CONTOH TEKS
      </span>
    )
  return <span className="text-[11px] font-semibold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,.6)' }}>Contoh teks</span>
}

export function TeksTab() {
  const caption = useEditor((s) => s.caption)
  const setCaption = useEditor((s) => s.setCaption)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <div>
          <Label className="text-xs text-zinc-300">Tampilkan subtitle</Label>
          <p className="text-[10px] text-zinc-500">Caption mengikuti naskah tiap scene</p>
        </div>
        <Switch checked={caption.enabled} onCheckedChange={(v) => setCaption({ enabled: v })} aria-label="Tampilkan subtitle" />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-zinc-400">Gaya subtitle</Label>
        <div className="grid grid-cols-2 gap-2">
          {CAPTION_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() =>
                setCaption({ preset: p.id, enabled: p.id === 'none' ? false : true })
              }
              className={cn(
                'rounded-lg border p-2 text-left transition-all',
                caption.preset === p.id
                  ? 'border-violet-500/70 bg-violet-500/10 ring-1 ring-violet-400/40'
                  : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900',
              )}
            >
              <div className="mb-1.5 flex h-10 items-center justify-center overflow-hidden rounded bg-zinc-950 px-1 text-center">
                <PresetMini preset={p.id} accent={caption.accent} />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-200">
                {caption.preset === p.id && <Check className="h-3 w-3 text-violet-400" />}
                {p.label}
              </span>
              <span className="block text-[9px] text-zinc-500">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Posisi</Label>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            {(['top', 'center', 'bottom'] as CaptionPosition[]).map((p) => (
              <button
                key={p}
                onClick={() => setCaption({ position: p })}
                className={cn(
                  'rounded-md px-1 py-1.5 text-[10px] transition-colors',
                  caption.position === p ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-800',
                )}
              >
                {p === 'top' ? 'Atas' : p === 'center' ? 'Tengah' : 'Bawah'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Font</Label>
          <Select value={caption.font} onValueChange={(v) => setCaption({ font: v as CaptionFont })}>
            <SelectTrigger className="h-9 text-xs border-zinc-700 bg-zinc-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="poppins">Poppins</SelectItem>
              <SelectItem value="montserrat">Montserrat</SelectItem>
              <SelectItem value="geist">Geist Sans</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs">
          <Label className="text-zinc-400">Ukuran teks</Label>
          <span className="font-mono text-violet-300">{caption.size}px</span>
        </div>
        <Slider
          value={[caption.size]}
          min={14}
          max={36}
          step={1}
          onValueChange={([v]) => setCaption({ size: v })}
          className="mt-1.5"
          aria-label="Ukuran teks"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs text-zinc-300">Sorot kata aktif (karaoke)</Label>
          <p className="text-[10px] text-zinc-500">Kata yang sedang dibacakan disorot</p>
        </div>
        <Switch checked={caption.highlight} onCheckedChange={(v) => setCaption({ highlight: v })} aria-label="Sorot kata aktif" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400">Warna sorotan</Label>
        <div className="flex gap-2">
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => setCaption({ accent: c })}
              className={cn(
                'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110',
                caption.accent === c ? 'border-white scale-110' : 'border-zinc-600',
              )}
              style={{ backgroundColor: c }}
              aria-label={`Warna ${c}`}
            />
          ))}
        </div>
      </div>

      <p className="flex gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 p-2.5 text-[11px] leading-relaxed text-zinc-500">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        Subtitle dibuat otomatis dari naskah tanpa transkrip manual — kata disorot mengikuti timing voice-over. Ini
        gaya caption yang paling sering dipakai video faceless viral.
      </p>
    </div>
  )
}
