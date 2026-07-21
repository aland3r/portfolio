'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Custom trigger + floating listbox used wherever an editor needs a status/
 * visibility-style action picker (UC editor, kit doc editor). Native
 * `<select>` is avoided here on purpose — see uc-editor__select-trigger in
 * globals.css for the upright-lock + click handling this buys.
 */
export default function EditorSelect({ value, options, onChange, disabled = false, 'aria-label': ariaLabel }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const [menuStyle, setMenuStyle] = useState(null)
  const selected = options.find((option) => option.value === value) ?? options[0]

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setMenuStyle(null)
      return
    }
    const rect = rootRef.current.getBoundingClientRect()
    setMenuStyle({
      top: `${rect.bottom + 2}px`,
      left: `${rect.left}px`,
      minWidth: `${Math.max(rect.width, 152)}px`,
    })
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onReposition() {
      if (!rootRef.current) return
      const rect = rootRef.current.getBoundingClientRect()
      setMenuStyle({
        top: `${rect.bottom + 2}px`,
        left: `${rect.left}px`,
        minWidth: `${Math.max(rect.width, 152)}px`,
      })
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={`uc-editor__select${open ? ' uc-editor__select--open' : ''}`}
    >
      <button
        type="button"
        className="uc-editor__select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        {selected?.label ?? value}
      </button>
      {open && menuStyle ? (
        <ul
          className="uc-editor__select-menu"
          role="listbox"
          aria-label={ariaLabel}
          style={menuStyle}
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`uc-editor__select-option${isSelected ? ' is-selected' : ''}`}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
