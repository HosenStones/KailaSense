export const CATEGORIES = [
  { id: 'admission', label: '👋 קבלה למחלקה' },
  { id: 'during', label: '🛏️ מהלך אשפוז' },
  { id: 'discharge', label: '🏠 לקראת שחרור' },
  { id: 'after_discharge', label: '⏱️ לאחר שחרור' },
  { id: 'general', label: '⭐ כללי' }
];

export const QUESTION_TYPES = [
  { id: 'emoji', label: '😊 אימוג׳י 1 עד 5' },
  { id: 'stars', label: '⭐ כוכבים 1 עד 5' },
  { id: 'choice', label: '🔘 בחירה יחידה' },
  { id: 'multi_choice', label: '✅ בחירה מרובה' },
  { id: 'open_text', label: '📝 טקסט חופשי' },
  { id: 'content', label: '📺 שקף מידע ותוכן' }
];

export const ROLES = [
  { id: 'admin', label: 'מנהל מערכת' },
  { id: 'manager', label: 'מנהל מחלקה' },
  { id: 'staff', label: 'צוות' }
];

export const getCategoryLabel = (id: string) => CATEGORIES.find(c => c.id === id)?.label || id;
export const getRoleLabel = (id: string) => ROLES.find(r => r.id === id)?.label || id;

export const renderTypeLabelWithIcon = (type: string, contentType?: string) => {
  const baseLabel = QUESTION_TYPES.find(t => t.id === type)?.label || type;
  if (type === 'content') {
    let subIcon = '📝';
    if (contentType === 'image') subIcon = '🖼️';
    if (contentType === 'video') subIcon = '🎬';
    return `${baseLabel} ${subIcon}`;
  }
  return baseLabel;
};

// פונקציית מיון מקיפה למאגר שאלות
export const sortQuestions = (questions: any[]) => {
  const catOrder = CATEGORIES.map(c => c.id);
  const typeOrder = QUESTION_TYPES.map(t => t.id);

  return [...questions].sort((a, b) => {
    // 1. מחלקה (תג) - כללי ראשון
    const tagA = a.tag || 'כללי';
    const tagB = b.tag || 'כללי';
    if (tagA === 'כללי' && tagB !== 'כללי') return -1;
    if (tagB === 'כללי' && tagA !== 'כללי') return 1;
    if (tagA !== tagB) return tagA.localeCompare(tagB, 'he');

    // 2. סטטוס (קטגוריה)
    const catIdxA = catOrder.indexOf(a.category || 'general');
    const catIdxB = catOrder.indexOf(b.category || 'general');
    if (catIdxA !== catIdxB) return (catIdxA === -1 ? 99 : catIdxA) - (catIdxB === -1 ? 99 : catIdxB);

    // 3. סוג שאלה
    const typeIdxA = typeOrder.indexOf(a.type || a.questionType);
    const typeIdxB = typeOrder.indexOf(b.type || b.questionType);
    if (typeIdxA !== typeIdxB) return (typeIdxA === -1 ? 99 : typeIdxA) - (typeIdxB === -1 ? 99 : typeIdxB);

    // 4. טקסט א'-ב'
    const textA = a.text || a.questionText || '';
    const textB = b.text || b.questionText || '';
    return textA.localeCompare(textB, 'he');
  });
};
