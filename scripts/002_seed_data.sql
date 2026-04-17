-- Kaila Feedback System - Seed Data
-- Initial department and default questions

-- Insert a demo department (Sheba Medical Center - Cardiology)
INSERT INTO departments (id, name, name_en, logo_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'מחלקת קרדיולוגיה',
  'Cardiology Department',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Insert default questions for the department
INSERT INTO questions (department_id, question_text, question_type, options, is_required, is_default, display_order, is_active)
VALUES 
  -- Question 1: Overall experience (emoji)
  (
    '00000000-0000-0000-0000-000000000001',
    'איך הייתה החוויה הכללית שלך במחלקה?',
    'emoji',
    '[
      {"value": "5", "label": "מצוין", "emoji": "😊"},
      {"value": "4", "label": "טוב", "emoji": "🙂"},
      {"value": "3", "label": "בסדר", "emoji": "😐"},
      {"value": "2", "label": "לא טוב", "emoji": "😕"},
      {"value": "1", "label": "גרוע", "emoji": "😢"}
    ]'::jsonb,
    true,
    true,
    1,
    true
  ),
  
  -- Question 2: Staff attitude (emoji)
  (
    '00000000-0000-0000-0000-000000000001',
    'כיצד היית מדרג/ת את היחס של הצוות הרפואי?',
    'emoji',
    '[
      {"value": "5", "label": "מצוין", "emoji": "😊"},
      {"value": "4", "label": "טוב", "emoji": "🙂"},
      {"value": "3", "label": "בסדר", "emoji": "😐"},
      {"value": "2", "label": "לא טוב", "emoji": "😕"},
      {"value": "1", "label": "גרוע", "emoji": "😢"}
    ]'::jsonb,
    true,
    true,
    2,
    true
  ),
  
  -- Question 3: Waiting time (choice)
  (
    '00000000-0000-0000-0000-000000000001',
    'כמה זמן המתנת לקבלת הטיפול?',
    'choice',
    '[
      {"value": "under_15", "label": "פחות מ-15 דקות"},
      {"value": "15_30", "label": "15-30 דקות"},
      {"value": "30_60", "label": "30-60 דקות"},
      {"value": "over_60", "label": "יותר משעה"}
    ]'::jsonb,
    true,
    true,
    3,
    true
  ),
  
  -- Question 4: Information clarity (emoji)
  (
    '00000000-0000-0000-0000-000000000001',
    'האם ההסברים שקיבלת היו ברורים ומובנים?',
    'emoji',
    '[
      {"value": "5", "label": "מאוד ברור", "emoji": "😊"},
      {"value": "4", "label": "ברור", "emoji": "🙂"},
      {"value": "3", "label": "בסדר", "emoji": "😐"},
      {"value": "2", "label": "לא מספיק", "emoji": "😕"},
      {"value": "1", "label": "לא ברור כלל", "emoji": "😢"}
    ]'::jsonb,
    true,
    true,
    4,
    true
  ),
  
  -- Question 5: Recommend (stars)
  (
    '00000000-0000-0000-0000-000000000001',
    'עד כמה היית ממליץ/ה על המחלקה לחבר או בן משפחה?',
    'stars',
    NULL,
    true,
    true,
    5,
    true
  ),
  
  -- Question 6: Open feedback
  (
    '00000000-0000-0000-0000-000000000001',
    'האם יש משהו נוסף שתרצה לשתף אותנו?',
    'open_text',
    NULL,
    false,
    true,
    6,
    true
  )
ON CONFLICT DO NOTHING;
