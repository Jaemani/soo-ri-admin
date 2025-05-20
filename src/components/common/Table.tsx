import React, { useState } from 'react';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string | number;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: keyof T | ((record: T) => string);
  onRowClick?: (record: T) => void;
}

function Table<T extends object>({
  data,
  columns,
  loading = false,
  emptyText = '데이터가 없습니다.',
  rowKey,
  onRowClick
}: TableProps<T>) {
  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null);

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    if (rowKey) {
      return String(record[rowKey]);
    }
    return String(index);
  };

  if (loading) {
    return (
      <div style={{
        padding: '40px 0',
        textAlign: 'center',
        color: '#666'
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        border: '1px solid #eee',
        borderRadius: '8px'
      }}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={String(column.key)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #dee2e6',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#495057',
                  width: column.width,
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  ...(index === 0 && {
                    borderTopLeftRadius: '8px',
                  }),
                  ...(index === columns.length - 1 && {
                    borderTopRightRadius: '8px',
                  })
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '40px 0',
                  textAlign: 'center',
                  color: '#666'
                }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((record, index) => {
              const currentRowKey = getRowKey(record, index);
              return (
                <tr
                  key={currentRowKey}
                  onClick={() => onRowClick?.(record)}
                  onMouseEnter={() => setHoveredRowKey(currentRowKey)}
                  onMouseLeave={() => setHoveredRowKey(null)}
                  style={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.2s',
                    backgroundColor: onRowClick && hoveredRowKey === currentRowKey ? '#f8f9fa' : 'transparent'
                  }}
                >
                  {columns.map(column => (
                    <td
                      key={String(column.key)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #eee',
                        fontSize: '0.875rem',
                        color: '#212529',
                        verticalAlign: 'middle'
                      }}
                    >
                      {column.render
                        ? column.render(
                            typeof column.key === 'string' 
                              ? (record as any)[column.key] 
                              : record[column.key],
                            record
                          )
                        : typeof column.key === 'string'
                          ? (record as any)[column.key]
                          : record[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table; 