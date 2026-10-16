import { PixelSelect } from '@pxlkit/ui-kit'
import { CHAT_MODELS } from './models'

type ModelPickerProps = {
  value: string
  onChange: (modelId: string) => void
  disabled?: boolean
  label: string
  placeholder?: string
}

export function ModelPicker({
  value,
  onChange,
  disabled,
  label,
  placeholder,
}: ModelPickerProps) {
  const options = CHAT_MODELS.map((m) => ({
    value: m.id,
    label: `${m.label} · ~${Math.round(m.vramMB / 100) / 10} GB VRAM`,
  }))

  return (
    <PixelSelect
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      tone="cyan"
      size="sm"
    />
  )
}
