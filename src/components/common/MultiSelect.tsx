import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './MultiSelect.css';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = "선택하세요",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    const handleResize = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        if (!containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(containerRef.current);
        const viewportHeight = window.innerHeight;
        const optionHeight = 42; // min-height per option
        const borderWidth = 2; // top and bottom borders (1px each)
        const extraPadding = 8; // extra padding for safety
        const idealHeight = (options.length * optionHeight) + borderWidth + extraPadding;
        const maxDropdownHeight = Math.min(idealHeight, 400);
        
        // Check if there's enough space below
        const spaceBelow = viewportHeight - rect.bottom - 20; // 20px margin from bottom
        const spaceAbove = rect.top - 20; // 20px margin from top
        const shouldOpenUpward = spaceBelow < maxDropdownHeight && spaceAbove > spaceBelow;
        
        const finalHeight = shouldOpenUpward 
          ? Math.min(maxDropdownHeight, spaceAbove)
          : Math.min(maxDropdownHeight, spaceBelow);
        
        setDropdownStyle({
          position: 'fixed',
          left: rect.left,
          top: shouldOpenUpward ? rect.top - finalHeight : rect.bottom + 2,
          width: rect.width,
          height: finalHeight,
          zIndex: 9999,
          fontFamily: computedStyle.fontFamily,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
          lineHeight: computedStyle.lineHeight,
          color: computedStyle.color,
        });
      };

      updatePosition();
    }
  }, [isOpen, options.length]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemoveChip = (optionValue: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newValue = value.filter(v => v !== optionValue);
    onChange(newValue);
  };

  const getSelectedLabels = () => {
    return value.map(val => {
      const option = options.find(opt => opt.value === val);
      return option ? option.label : val;
    });
  };

  const dropdown = isOpen ? (
    <div 
      className="multiselect-dropdown" 
      style={dropdownStyle} 
      ref={dropdownRef}
    >
      {options.map(option => (
        <div
          key={option.value}
          className={`multiselect-option ${value.includes(option.value) ? 'selected' : ''}`}
          onClick={(e) => handleOptionClick(option.value, e)}
        >
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            onChange={() => {}} // Handled by parent onClick
            className="multiselect-checkbox"
            readOnly
          />
          <span className="multiselect-option-label">{option.label}</span>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div className={`multiselect ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      <div className="multiselect-control" onClick={handleToggle}>
        <div className="multiselect-value">
          {value.length === 0 ? (
            <span className="multiselect-placeholder">{placeholder}</span>
          ) : (
            <div className="multiselect-chips">
              {getSelectedLabels().map((label, index) => (
                <span key={value[index]} className="multiselect-chip">
                  {label}
                  <button
                    type="button"
                    className="multiselect-chip-remove"
                    onClick={(e) => handleRemoveChip(value[index], e)}
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={`multiselect-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </div>
      </div>
      
      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
};

export default MultiSelect; 