// Utility function to format dates that handles different MongoDB date formats
export const formatDate = (dateInput: string | { $date: string } | Date | any): string => {
  let dateValue: string;
  
  // Handle different date formats from API
  if (typeof dateInput === 'string') {
    dateValue = dateInput;
  } else if (dateInput && typeof dateInput === 'object' && dateInput.$date) {
    dateValue = dateInput.$date;
  } else if (dateInput && typeof dateInput === 'object' && dateInput.getTime) {
    // It's already a Date object
    dateValue = dateInput.toISOString();
  } else if (dateInput === null || dateInput === undefined) {
    return '-';
  } else {
    console.warn('Invalid date format:', dateInput);
    return 'Invalid Date';
  }
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    console.warn('Could not parse date:', dateValue);
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Utility function for formatting date and time
export const formatDateTime = (dateInput: string | { $date: string } | Date | any): string => {
  let dateValue: string;
  
  if (typeof dateInput === 'string') {
    dateValue = dateInput;
  } else if (dateInput && typeof dateInput === 'object' && dateInput.$date) {
    dateValue = dateInput.$date;
  } else if (dateInput && typeof dateInput === 'object' && dateInput.getTime) {
    dateValue = dateInput.toISOString();
  } else if (dateInput === null || dateInput === undefined) {
    return '-';
  } else {
    console.warn('Invalid date format:', dateInput);
    return 'Invalid Date';
  }
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    console.warn('Could not parse date:', dateValue);
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 