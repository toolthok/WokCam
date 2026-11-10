'use client'

import { Type, Mic, ImageIcon, Captions } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEditor } from '@/lib/editor/store'
import { cn } from '@/lib/utils'
import { NaskahTab } from './tabs/NaskahTab'
import { SuaraTab } from './tabs/SuaraTab'
import { VisualTab } from './tabs/VisualTab'
import { TeksTab } from './tabs/TeksTab'

export function Inspector({ className }: { className?: string }) {
  const scenes = useEditor((s) => s.scenes)
  const selectedId = useEditor((s) => s.selectedId)
  const idx = scenes.findIndex((s) => s.id === selectedId)

  return (
    <aside
      className={cn('flex flex-col border-l bg-zinc-950/60', className)}
      aria-label="Pengaturan scene"
    >
      <div className="px-3 pb-2 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Pengaturan</p>
        <p className="text-sm font-semibold text-zinc-200">
          {idx >= 0 ? `Scene ${idx + 1} dari ${scenes.length}` : 'Tidak ada scene'}
        </p>
      </div>

      <Tabs defaultValue="naskah" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 grid h-9 grid-cols-4 gap-1 bg-zinc-900 p-1">
          <TabsTrigger value="naskah" className="gap-1 px-1 text-[11px] data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Type className="h-3.5 w-3.5" /> Naskah
          </TabsTrigger>
          <TabsTrigger value="suara" className="gap-1 px-1 text-[11px] data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Mic className="h-3.5 w-3.5" /> Suara
          </TabsTrigger>
          <TabsTrigger value="visual" className="gap-1 px-1 text-[11px] data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <ImageIcon className="h-3.5 w-3.5" /> Visual
          </TabsTrigger>
          <TabsTrigger value="teks" className="gap-1 px-1 text-[11px] data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Captions className="h-3.5 w-3.5" /> Teks
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="min-h-0 flex-1 max-lg:max-h-none">
          <TabsContent value="naskah" className="mt-0 p-3">
            <NaskahTab />
          </TabsContent>
          <TabsContent value="suara" className="mt-0 p-3">
            <SuaraTab />
          </TabsContent>
          <TabsContent value="visual" className="mt-0 p-3">
            <VisualTab />
          </TabsContent>
          <TabsContent value="teks" className="mt-0 p-3">
            <TeksTab />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  )
}
