'use client'

import { useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  ExternalLink,
  Images,
  Info,
  Loader2,
  Minus,
  MoveDown,
  MoveLeft,
  MoveRight,
  MoveUp,
  Search,
  Sparkles,
  Upload,
  Wand2,
  ZoomIn,
  ZoomOut,
  Repeat,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { useEditor } from '@/lib/editor/store'
import { ANIM_IN_META, ANIM_OUT_META, CATEGORY_META, FREE_SOURCES, MOTION_META, STOCKS, type AssetCategory, type Motion } from '@/lib/editor/model'
import { AnimationLibrary } from '@/components/editor/AnimationLibrary'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const MOTION_ICONS: Record<Motion, React.ComponentType<{ className?: string }>> = {
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  'pan-left': MoveLeft,
  'pan-right': MoveRight,
  'pan-up': MoveUp,
  'pan-down': MoveDown,
  static: Minus,
}

const AI_STYLES = ['Sinematik', 'Ilustrasi 3D', 'Anime', 'Minimalis']

export function VisualTab() {
  const scenes = useEditor((s) => s.scenes)
  const selectedId = useEditor((s) => s.selectedId)
  const updateScene = useEditor((s) => s.updateScene)
  const transition = useEditor((s) => s.transition)
  const setTransition = useEditor((s) => s.setTransition)

  const scene = scenes.find((s) => s.id === selectedId)
  const [source, setSource] = useState<'stock' | 'ai' | 'upload'>('stock')
  const [query, setQuery] = useState('')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('Sinematik')
  const [gen, setGen] = useState(0) // 0 = idle, 1..100 progress
  const [animOpen, setAnimOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [cat, setCat] = useState<AssetCategory | 'all'>('all')

  const sourceList = useMemo(
    () => (cat === 'all' ? FREE_SOURCES : FREE_SOURCES.filter((f) => f.category === cat)),
    [cat],
  )

  if (!scene) return <p className="text-xs text-zinc-500">Pilih sebuah scene dulu.</p>

  const stocks = STOCKS.filter(
    (s) => !query.trim() || `${s.label} ${s.tags}`.toLowerCase().includes(query.toLowerCase()),
  )

  const runGenerate = () => {
    if (!prompt.trim()) {
      toast.error('Tulis prompt gambar dulu')
      return
    }
    setGen(1)
    const iv = setInterval(() => {
      setGen((p) => {
        if (p >= 100) {
          clearInterval(iv)
          const pick = STOCKS[Math.floor(Math.random() * 5)]
          updateScene(scene.id, {
            image: pick.img,
            gradient: pick.gradient,
            assetSource: 'ai',
            assetLabel: `AI: ${prompt.trim().slice(0, 28)}${prompt.trim().length > 28 ? '…' : ''}`,
          })
          toast.success('Gambar AI selesai dibuat (demo)', { description: `Gaya ${style} · prompt: "${prompt.trim().slice(0, 40)}"` })
          return 0
        }
        return p + Math.ceil(Math.random() * 9)
      })
    }, 90)
  }

  return (
    <div className="space-y-4">
      {/* sumber visual */}
      <div className="space-y-2">
        <Label className="text-xs text-zinc-400">Sumber visual</Label>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {(
            [
              { id: 'stock', label: 'Stok', icon: Images },
              { id: 'ai', label: 'AI', icon: Sparkles },
              { id: 'upload', label: 'Upload', icon: Upload },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setSource(t.id)}
              className={cn(
                'flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors',
                source === t.id ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-800',
              )}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {source === 'stock' && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari visual… (kota, kopi, olahraga)"
                className="h-8 border-zinc-700 bg-zinc-950 pl-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {stocks.map((st) => {
                const selected = scene.assetLabel.endsWith(st.label) || scene.assetLabel === `Stok: ${st.label}`
                return (
                  <button
                    key={st.id}
                    onClick={() =>
                      updateScene(scene.id, {
                        image: st.img,
                        gradient: st.gradient,
                        assetSource: 'stock',
                        assetLabel: `Stok: ${st.label}`,
                      })
                    }
                    className={cn(
                      'group relative h-20 overflow-hidden rounded-lg border transition-all',
                      selected ? 'border-violet-400 ring-1 ring-violet-400/60' : 'border-zinc-800 hover:border-zinc-600',
                    )}
                    title={st.label}
                  >
                    <div className={cn('absolute inset-0 bg-gradient-to-br', st.gradient)} />
                    {st.img && (
                      <img src={st.img} alt={st.label} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-0.5 text-left text-[9px] text-zinc-200">
                      {st.label}
                    </span>
                    {selected && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                )
              })}
              {!stocks.length && <p className="col-span-2 py-4 text-center text-xs text-zinc-500">Tidak ada hasil.</p>}
            </div>
          </div>
        )}

        {source === 'ai' && (
          <div className="space-y-2">
            <Textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Deskripsikan visual… contoh: meja kayu dengan kopi hangat, cahaya pagi lembut"
              className="border-zinc-700 bg-zinc-950 text-xs"
            />
            <div className="flex flex-wrap gap-1.5">
              {AI_STYLES.map((st) => (
                <button
                  key={st}
                  onClick={() => setStyle(st)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[10px] transition-colors',
                    style === st
                      ? 'border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200'
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800',
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
            {gen > 0 ? (
              <div className="space-y-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${gen}%` }} />
                </div>
                <p className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <Loader2 className="h-3 w-3 animate-spin" /> Membuat gambar… {gen}%
                </p>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={runGenerate}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
              >
                <Sparkles className="h-4 w-4" /> Generate Gambar
              </Button>
            )}
          </div>
        )}

        {source === 'upload' && (
          <button
            onClick={() => toast.info('Mockup: fitur upload dinonaktifkan di demo')}
            className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-500 hover:border-violet-500/50 hover:text-zinc-300"
          >
            <Upload className="h-5 w-5" />
            <span className="text-[11px]">Tarik & lepas gambar di sini</span>
            <span className="text-[9px] text-zinc-600">PNG / JPG · maks 10 MB</span>
          </button>
        )}
      </div>

      {/* animasi */}
      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-zinc-400">Gerakan kamera (Ken Burns)</Label>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="h-4 border-zinc-700 px-1 text-[9px] font-normal text-zinc-500">
              {MOTION_META.find((m) => m.id === scene.motion)?.label}
            </Badge>
            <Button
              size="sm"
              onClick={() => setAnimOpen(true)}
              className="h-6 gap-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2 text-[10px] text-white hover:from-violet-500 hover:to-fuchsia-500"
            >
              <Wand2 className="h-3 w-3" /> Koleksi Animasi
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {MOTION_META.map((m) => {
            const Icon = MOTION_ICONS[m.id]
            const active = scene.motion === m.id
            return (
              <button
                key={m.id}
                onClick={() => updateScene(scene.id, { motion: m.id })}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-md border py-1.5 transition-colors',
                  active
                    ? 'border-violet-500 bg-violet-500/15 text-violet-200'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800',
                )}
                title={m.label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[8.5px] leading-none">{m.label}</span>
              </button>
            )
          })}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Animasi masuk (In)</Label>
          <div className="flex flex-wrap gap-1.5">
            {ANIM_IN_META.map((a) => (
              <button
                key={a.id}
                onClick={() => updateScene(scene.id, { animIn: a.id })}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[10px] transition-colors',
                  scene.animIn === a.id
                    ? 'border-violet-400/60 bg-violet-500/15 text-violet-200'
                    : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-400">Animasi keluar (Out)</Label>
          <div className="flex flex-wrap gap-1.5">
            {ANIM_OUT_META.map((a) => (
              <button
                key={a.id}
                onClick={() => updateScene(scene.id, { animOut: a.id })}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[10px] transition-colors',
                  scene.animOut === a.id
                    ? 'border-violet-400/60 bg-violet-500/15 text-violet-200'
                    : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Repeat className="h-3.5 w-3.5 text-violet-400" />
            <Label className="text-xs text-zinc-300">Loop gerakan</Label>
          </div>
          <Switch checked={scene.loop} onCheckedChange={(v) => updateScene(scene.id, { loop: v })} aria-label="Loop gerakan" />
        </div>
        <p className="text-[10px] leading-snug text-zinc-500">
          {scene.loop
            ? 'Gerakan berlanjut sepanjang durasi scene.'
            : 'Gerakan hanya pada awal scene, lalu diam.'}
        </p>

        <div>
          <div className="flex justify-between text-xs">
            <Label className="text-zinc-400">Durasi transisi antar scene</Label>
            <span className="font-mono text-violet-300">{transition.toFixed(1)}s</span>
          </div>
          <Slider
            value={[transition]}
            min={0.1}
            max={1.5}
            step={0.1}
            onValueChange={([v]) => setTransition(v)}
            className="mt-1.5"
            aria-label="Durasi transisi"
          />
        </div>
      </div>

      {/* sumber aset gratis */}
      <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06]">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2.5 text-left">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-200">Sumber Aset Gratis (Rp0)</span>
            </span>
            <ChevronDown className={cn('h-3.5 w-3.5 text-emerald-300/70 transition-transform', sourcesOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 border-t border-emerald-500/20 px-3 pb-3 pt-2.5">
            <p className="text-[10.5px] leading-relaxed text-emerald-100/70">
              Semua situs di bawah punya paket gratis untuk tahap awal — salin linknya ke kolom <span className="font-mono">aset</span> di Google Sheets.
            </p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setCat('all')}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[9.5px] transition-colors',
                  cat === 'all' ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800',
                )}
              >
                Semua
              </button>
              {CATEGORY_META.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[9.5px] transition-colors',
                    cat === c.id ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200' : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800',
                  )}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <div className="max-h-52 space-y-1.5 overflow-y-auto thin-scroll pr-1">
              {sourceList.map((f) => (
                <a
                  key={`${f.name}-${f.category}`}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-zinc-800 bg-zinc-900/80 p-2 transition-colors hover:border-emerald-500/40 hover:bg-zinc-800/80"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-zinc-100">{f.name}</span>
                    <span className="flex items-center gap-1 text-[9px] text-emerald-300/80">
                      {f.license} <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-zinc-400">{f.desc}</span>
                </a>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <p className="flex gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 p-2.5 text-[11px] leading-relaxed text-zinc-500">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        Semua perubahan langsung terlihat di preview — tekan ▶ untuk memutar. Versi jadi akan mengambil stok dari API
        Pexels & generate gambar via AI.
      </p>

      <AnimationLibrary open={animOpen} onOpenChange={setAnimOpen} />
    </div>
  )
}

