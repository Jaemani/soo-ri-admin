import React from 'react';
import MultiSelect from './MultiSelect';
import './FilterPanel.css';

export interface FilterOption {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number' | 'multiselect';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterPanelProps {
  filters: Record<string, string | string[]>;
  options: FilterOption[];
  onChange: (name: string, value: string | string[]) => void;
  onReset: () => void;
  onSearch?: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  options,
  onChange,
  onReset,
  onSearch,
}) => {
  return (
    <div className="filter-panel">
      <div className="filter-grid">
        {options.map((option) => {
          let className = "filter-item";
          if (option.name === 'minAmount') className += " amount-field min-amount";
          if (option.name === 'maxAmount') className += " amount-field max-amount";
          
          return (
          <div key={option.name} className={className}>
            <label htmlFor={option.name}>{option.label}</label>
            {option.type === 'select' ? (
              <select
                id={option.name}
                name={option.name}
                value={filters[option.name] as string}
                onChange={(e) => onChange(option.name, e.target.value)}
              >
                <option value="">전체</option>
                {option.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : option.type === 'multiselect' ? (
              <MultiSelect
                options={option.options || []}
                value={filters[option.name] as string[]}
                onChange={(value) => onChange(option.name, value)}
                placeholder={option.placeholder || "선택하세요"}
              />
            ) : (
              <input
                type={option.type}
                id={option.name}
                name={option.name}
                value={filters[option.name] as string}
                onChange={(e) => onChange(option.name, e.target.value)}
                placeholder={option.placeholder}
                step={option.type === 'number' && (option.name === 'minAmount' || option.name === 'maxAmount') ? "1000" : undefined}
              />
            )}
          </div>
          );
        })}
      </div>
      <div className="filter-actions">
        <button className="btn btn-primary btn-medium" onClick={onReset}>
          필터 초기화
        </button>
        {onSearch && (
          <button className="btn btn-primary btn-medium" onClick={onSearch}>
            검색
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel; 