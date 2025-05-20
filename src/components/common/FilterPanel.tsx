import React from 'react';
import './FilterPanel.css';

export interface FilterOption {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterPanelProps {
  filters: Record<string, string>;
  options: FilterOption[];
  onChange: (name: string, value: string) => void;
  onReset: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  options,
  onChange,
  onReset,
}) => {
  return (
    <div className="filter-panel">
      <div className="filter-grid">
        {options.map((option) => (
          <div key={option.name} className="filter-item">
            <label htmlFor={option.name}>{option.label}</label>
            {option.type === 'select' ? (
              <select
                id={option.name}
                name={option.name}
                value={filters[option.name]}
                onChange={(e) => onChange(option.name, e.target.value)}
              >
                <option value="">전체</option>
                {option.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={option.type}
                id={option.name}
                name={option.name}
                value={filters[option.name]}
                onChange={(e) => onChange(option.name, e.target.value)}
                placeholder={option.placeholder}
              />
            )}
          </div>
        ))}
      </div>
      <div className="filter-actions">
        <button className="btn-secondary" onClick={onReset}>
          필터 초기화
        </button>
      </div>
    </div>
  );
};

export default FilterPanel; 