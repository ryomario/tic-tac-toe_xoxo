import "./select.css"

export type SelectOption = {
  id: string
  name: string
}

type Props = {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: SelectOption) => void
}

export function Select({
  label,
  value,
  options,
  onChange,
}: Props) {
  return <div className="select">
    <div className="select-label">{label}</div>
    <div className="select-options">
      {options.map(option => (
        <div key={option.id} role="button" className={`select-option ${value == option.id ? 'selected': ''}`}
          onClick={() => onChange(option)}
        >{option.name}</div>
      ))}
    </div>
  </div>
}