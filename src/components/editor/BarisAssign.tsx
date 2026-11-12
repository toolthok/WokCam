'use client'

/* Satu baris penugasan preset (label · nama terpasang · pilih/ganti · → semua). Dipakai Inspector & panel aset. */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AssignMenu } from '@/components/editor/AssignMenu'
import { cn } from '@/lib/utils'

export function BarisAssign({
  label, nilai, jenis, onPilih, onSemua,
}: {
  label: string
  nilai: string | null
  jenis: 'in' | 'out' | 'loop' | 'transisi' | 'style'
  onPilih: (nama: string | null) => void
  onSemua?: (nama: string | null) => void
}) {
  const [semuaNilai, setSemuaNilai] = useState<string | null>(null)
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="w-[86px] shrink-0 text-[11px] font-medium text-zinc-400">{label}</span>
      <span className={cn('min-w-0 flex-1 truncate text-[11px]', nilai ? 'text-violet-200' : 'text-zinc-500')}>
        {nilai ?? '— belum diatur —'}
      </span>
      <AssignMenu jenis={jenis} terpasang={nilai} onPilih={onPilih} lebar="w-[280px]" align="end">
        <Button variant="outline" size="sm" className="h-7 border-zinc-700 px-2 text-[11px] text-zinc-200 hover:bg-zinc-800">
          {nilai ? 'ganti' : 'pilih'}
        </Button>
      </AssignMenu>
      {onSemua && (
        <AssignMenu
          jenis={jenis}
          terpasang={semuaNilai}
          onPilih={(n) => { setSemuaNilai(n); onSemua(n) }}
          lebar="w-[280px]"
          align="end"
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-[10px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            title={`Terapkan ${label.toLowerCase()} ke semua scene`}
          >
            → semua
          </Button>
        </AssignMenu>
      )}
    </div>
  )
}
