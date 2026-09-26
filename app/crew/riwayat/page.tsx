import { redirect } from 'next/navigation'

type SearchParams = Promise<{ page?: string; q?: string }>

export const dynamic = 'force-dynamic'

export default async function CrewRiwayatPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const p = new URLSearchParams({ tab: 'riwayat' })
  if (typeof sp.q === 'string' && sp.q.trim()) p.set('q', sp.q.trim())
  if (sp.page && Number(sp.page) > 1) p.set('page', String(sp.page))
  redirect(`/crew/profil?${p.toString()}`)
}