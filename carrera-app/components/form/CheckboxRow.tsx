type Props = {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

export default function CheckboxRow({ label, checked, onChange }: Props) {
  return (
    <label className="flex cursor-pointer items-center justify-between border-b border-gray-100 py-3 md:py-2.5">
      <span className="text-base md:text-sm">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-carrera-red" />
    </label>
  )
}
