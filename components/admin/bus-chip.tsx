export function BusChip({
  name,
  count,
  attended,
  selected,
  onSelect,
}: {
  name: string
  count: number
  attended?: number
  selected?: boolean
  onSelect?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title="Kelola armada ini"
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-colors duration-200 ${
        selected
          ? 'bg-[#1b4f9c] text-white'
          : 'cursor-pointer bg-[#eef3fb] text-[#1b4f9c] hover:bg-[#dde7f7]'
      }`}
    >
      {name}
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selected ? 'bg-white/20 text-white' : 'bg-white text-[#657080]'}`}>
        {count} peserta
      </span>
      {attended ? (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selected ? 'bg-white/20 text-white' : 'bg-[#e6f4ea] text-[#2ca84a]'}`}>
          {attended} hadir
        </span>
      ) : null}
    </button>
  )
}