'use client'

import { useState } from 'react'

// Setara `useState` boolean, tapi boleh dikontrol dari luar: kalau `controlled`
// !== undefined, nilai `open` milik pemanggil dan `onChange` ikut dipanggil.
// Dipakai supaya pemicu bisa dipindah ke baris menu (ActionMenu) sementara
// komponen tetap bisa hidup mandiri saat `controlled` tidak diberikan.
export function useModal(controlled?: boolean, onChange?: (open: boolean) => void) {
  const [inner, setInner] = useState(false)
  const open = controlled ?? inner
  return [
    open,
    (value: boolean) => {
      setInner(value)
      onChange?.(value)
    },
  ] as const
}
