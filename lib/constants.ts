export const CATEGORIES = [
  { id: 'admission', label: '👋 קבלה למחלקה' },
  { id: 'discharge', label: '🏠 לקראת שחרור' },
  { id: 'after_discharge', label: '⏱️ לאחר שחרור' },
  { id: 'during', label: '🛏️ מהלך אשפוז' },
  { id: 'general', label: '⭐ כללי' }
].sort((a, b) => a.label.localeCompare(b.label, 'he'));

export const QUESTION_TYPES = [
  { id: 'emoji', label: '😊 אימוג׳י (1 עד 5)' },
  { id: 'choice', label: '🔘 בחירה יחידה' },
  { id: 'multi_choice', label: '✅ בחירה מרובה' },
  { id: 'open_text', label: '📝 טקסט חופשי' },
  { id: 'stars', label: '⭐ כוכבים (1 עד 5)' },
  { id: 'content', label: '📺 שקף מידע ותוכן' }
].sort((a, b) => a.label.localeCompare(b.label, 'he'));

export const ROLES = [
  { id: 'manager', label: 'מנהל מחלקה' },
  { id: 'super_admin', label: 'סופר אדמין' },
  { id: 'staff', label: 'צוות' }
].sort((a, b) => a.label.localeCompare(b.label, 'he'));


export const getCategoryLabel = (id: string) => CATEGORIES.find(c => c.id === id)?.label || id;
export const getTypeLabel = (id: string) => QUESTION_TYPES.find(t => t.id === id)?.label || id;
export const getRoleLabel = (id: string) => ROLES.find(r => r.id === id)?.label || id;
