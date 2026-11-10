'use client'

import { useMemo, useState } from 'react'
import { Check, Layers, Plus, Trash2, Wand2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEditor } from '@/lib/editor/store'
import { ANIMATION_PRESETS, IMG_STOCKS, MOTION_META, type Motion } from '@/lib/editor/model'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const KB_ANIMATION: Record<Motion, string> = {
  'zoom-in': 'kb-zoom-in 4s ease-in-out infinite alternate',
  'zoom-out': 'kb-zoom-out 4s ease-in-out infinite alternate',
  'pan-left': 'kb-pan-left 4s ease-in-out infinite alternate',
  'pan-right': 'kb-pan-right 4s ease-in-out infinite alternate',
  'pan-up': 'kb-pan-up 4s ease-in-out infinite alternate',
  'pan-down': 'kb-pan-down 4s ease-in-out infinite alternate',
  static: 'none',
}

function PresetCard({
  name,
  desc,
  bestFor,
  motion,
  imgIndex,
  custom,
  applied,
  onApply,
  onApplyAll,
  onDelete,
}: {
  name: string
  desc: string
  bestFor: string
  motion: Motion
  imgIndex: number
  custom?: boolean
  applied: boolean
  onApply: () => void
  onApplyAll: () => void
  onDelete?: () => void
}) {
  const stock = IMG_STOCKS[imgIndex % IMG_STOCKS.length]
  const motionLabel = MOTION_META.find((m) => m.id === motion)?.label
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border transition-colors',
        applied ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-800 bg-zinc-900/70',
      )}
    >
      {/* preview live */}
      <div className="relative h-24 overflow-hidden bg-zinc-950">
        <div className={cn('absolute inset-0 bg-gradient-to-br', stock.gradient)} />
        <img
          src={stock.img}
          alt={`Preview ${name}`}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ animation: KB_ANIMATION[motion] }}
          draggable={false}
        />
        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-zinc-200">
          {motionLabel}
        </span>
        {custom && (
          <span className="absolute right-1.5 top-1.5 rounded bg-fuchsia-600/80 px-1.5 py-0.5 text-[9px] font-medium text-white">
            Buatanmu
          </span>
        )}
        {applied && (
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-violet-600 px-1.5 py-0.5 text-[9px] font-medium text-white">
            <Check className="h-2.5 w-2.5" /> Aktif
          </span>
        )}
      </div>

      <div className="space-y-1.5 p-2.5">
        <p className="text-xs font-bold text-zinc-100">{name}</p>
        <p className="line-clamp-2 text-[10.5px] leading-snug text-zinc-400">{desc}</p>
        <Badge variant="outline" className="h-4 border-zinc-700 px-1.5 text-[9px] font-normal text-zinc-400">
          {bestFor}
        </Badge>
        <div className="flex gap-1.5 pt-1">
          <Button size="sm" className="h-7 flex-1 bg-violet-600 text-[10px] text-white hover:bg-violet-500" onClick={onApply}>
            <Wand2 className="h-3 w-3" /> Terapkan
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 flex-1 border-zinc-700 text-[10px] text-zinc-300 hover:bg-zinc-800"
            onClick={onApplyAll}
            title="Terapkan ke semua scene"
          >
            <Layers className="h-3 w-3" /> Semua
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 shrink-0 border-zinc-700 p-0 text-zinc-500 hover:border-red-500/50 hover:text-red-400"
              onClick={onDelete}
              aria-label={`Hapus preset ${name}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function AnimationLibrary({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const scenes = useEditor((s) => s.scenes)
  const selectedId = useEditor((s) => s.selectedId)
  const customPresets = useEditor((s) => s.customPresets)
  const applyPreset = useEditor((s) => s.applyPreset)
  const savePresetFromScene = useEditor((s) => s.savePresetFromScene)
  const deletePreset = useEditor((s) => s.deletePreset)
  const [presetName, setPresetName] = useState('')

  const scene = scenes.find((s) => s.id === selectedId)

  const currentSignature = useMemo(() => {
    if (!scene) return ''
    return `${scene.motion}|${scene.animIn}|${scene.animOut}|${scene.loop}`
  }, [scene])

  const sigOf = (p: { motion: string; animIn: string; animOut: string; loop: boolean }) =>
    `${p.motion}|${p.animIn}|${p.animOut}|${p.loop}`

  const handleSave = () => {
    if (!scene) {
      toast.error('Pilih scene dulu')
      return
    }
    if (!presetName.trim()) {
      toast.error('Beri nama preset dulu')
      return
    }
    savePresetFromScene(scene.id, presetName)
    toast.success(`Preset "${presetName.trim()}" tersimpan`, { description: 'Tersimpan di perangkat — otomatis muncul di koleksi.' })
    setPresetName('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-3xl border-zinc-800 bg-zinc-950 p-0 sm:w-[calc(100%-2rem)]">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Wand2 className="h-4 w-4 text-violet-400" /> Koleksi Animasi
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Preset gerakan kamera + animasi siap pakai. Klik “Terapkan” untuk scene aktif, “Semua” untuk seluruh video.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-5 py-4">
          <div className="space-y-4 pb-4">
            {/* preset buatan sendiri */}
            {customPresets.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-fuchsia-300">Preset buatan sendiri</p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {customPresets.map((p, i) => (
                    <PresetCard
                      key={p.id}
                      name={p.name}
                      desc={p.desc}
                      bestFor={p.bestFor}
                      motion={p.motion}
                      imgIndex={i + 3}
                      custom
                      applied={scene ? currentSignature === sigOf(p) : false}
                      onApply={() => {
                        applyPreset(p.id)
                        toast.success(`"${p.name}" diterapkan ke scene aktif`)
                      }}
                      onApplyAll={() => {
                        applyPreset(p.id, 'all')
                        toast.success(`"${p.name}" diterapkan ke ${scenes.length} scene`)
                      }}
                      onDelete={() => {
                        deletePreset(p.id)
                        toast.success(`Preset "${p.name}" dihapus`)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* preset bawaan */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">Preset bawaan</p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {ANIMATION_PRESETS.map((p, i) => (
                  <PresetCard
                    key={p.id}
                    name={p.name}
                    desc={p.desc}
                    bestFor={p.bestFor}
                    motion={p.motion}
                    imgIndex={i}
                    applied={scene ? currentSignature === sigOf(p) : false}
                    onApply={() => {
                      applyPreset(p.id)
                      toast.success(`"${p.name}" diterapkan ke scene aktif`)
                    }}
                    onApplyAll={() => {
                      applyPreset(p.id, 'all')
                      toast.success(`"${p.name}" diterapkan ke ${scenes.length} scene`)
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* simpan preset baru */}
        <div className="flex items-center gap-2 border-t border-zinc-800 px-5 py-3.5">
          <Input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Nama preset baru — contoh: Gaya Vlog Saya"
            className="h-9 flex-1 border-zinc-700 bg-zinc-900 text-xs"
            aria-label="Nama preset baru"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <Button
            size="sm"
            onClick={handleSave}
            className="h-9 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs text-white hover:from-violet-500 hover:to-fuchsia-500"
          >
            <Plus className="h-3.5 w-3.5" /> Simpan dari scene aktif
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 px-2 text-zinc-500 hover:text-zinc-300"
            onClick={() => onOpenChange(false)}
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
