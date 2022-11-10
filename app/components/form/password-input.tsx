import { EyeClose, EyeEmpty } from 'iconoir-react'
import { useState } from 'react'
import Input from './input'

type PasswordInputProps = {
  name: string
  label: string
  labelAlt?: string
  toggleVisibility?: boolean
}

export default function PasswordInput({
  name,
  label,
  labelAlt,
  toggleVisibility,
}: PasswordInputProps) {
  let [showPassword, setShowPassword] = useState(false)

  if (toggleVisibility) {
    return (
      <Input
        name={name}
        label={label}
        labelAlt={labelAlt}
        type={showPassword ? 'text' : 'password'}
        groupAppend={
          <button
            type="button"
            onClick={() => setShowPassword((x) => !x)}
            className={`bg-base-300 swap px-2 ${
              showPassword ? 'swap-active' : ''
            }`}
          >
            <div className="swap-on">
              <EyeClose />
            </div>
            <div className="swap-off">
              <EyeEmpty />
            </div>
          </button>
        }
      />
    )
  } else {
    return <Input name={name} label={label} type="password" />
  }
}
