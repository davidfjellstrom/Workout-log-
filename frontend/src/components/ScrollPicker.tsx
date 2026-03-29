import { useEffect, useRef, useState } from 'react';
import './ScrollPicker.css';

interface Props {
  value: string;
  onChange: (val: string) => void;
  options: number[];
  placeholder?: string;
  required?: boolean;
}

export default function ScrollPicker({ value, onChange, options, placeholder, required }: Props) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      const idx = options.indexOf(Number(value));
      if (idx >= 0) {
        const item = listRef.current.children[idx] as HTMLElement;
        item?.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="scroll-picker-wrapper" ref={wrapperRef}>
      <input
        type="number"
        className="scroll-picker-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={() => setOpen(true)}
        placeholder={placeholder}
        required={required}
        readOnly
      />
      {open && (
        <ul className="scroll-picker-list" ref={listRef}>
          {options.map((n) => (
            <li
              key={n}
              className={`scroll-picker-item${value === String(n) ? ' selected' : ''}`}
              onClick={() => { onChange(String(n)); setOpen(false); }}
            >
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
