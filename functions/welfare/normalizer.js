exports.normalizeService = (service) => {
  const name = service.name || '';
  const summary = service.summary || '';
  const text = (name + ' ' + summary).toLowerCase();

  const tags = {
    age: 'all', // 'elder' | 'adult' | 'child' | 'all'
    mobility: false,
    disability: false
  };

  // Age Tagging (Simple keywords)
  if (text.includes('노인') || text.includes('고령') || text.includes('어르신') || text.includes('경로') || text.includes('치매')) {
    tags.age = 'elder';
  } else if (text.includes('아동') || text.includes('청소년') || text.includes('자녀') || text.includes('영유아') || text.includes('학생')) {
    tags.age = 'child';
  } else if (text.includes('청년') || text.includes('중장년') || text.includes('구직') || text.includes('근로자')) {
    tags.age = 'adult';
  }

  // Mobility Tagging
  // 이동지원, 교통비, 차량, 휠체어, 보행, 바우처택시 등
  if (
    text.includes('이동') || 
    text.includes('교통') || 
    text.includes('차량') || 
    text.includes('휠체어') || 
    text.includes('보행') || 
    text.includes('보장구') || 
    text.includes('바우처택시') ||
    text.includes('주차') ||
    text.includes('택시')
  ) {
    tags.mobility = true;
  }

  // Disability Tagging
  if (text.includes('장애')) {
    tags.disability = true;
  }

  return {
    ...service,
    tags
  };
};
