'use client'

import { useState, useEffect } from 'react'
import { getDepartmentStats, getResponsesByDepartment, getQuestionsByDepartment } from '@/lib/firebase/firestore'
import type { Response, Question } from '@/lib/types'
import { Users, Smile, MessageSquare, Clock } from 'lucide-react'

export function AdminInsights({ departmentId }: { departmentId: string }) {
  const [stats, setStats] = useState<any>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInsights() {
      if (!departmentId) return;
      setLoading(true);
      try {
        const [realStats, allResponses, allQuestions] = await Promise.all([
          getDepartmentStats(departmentId),
          getResponsesByDepartment(departmentId),
          getQuestionsByDepartment(departmentId)
        ]);
        setStats(realStats);
        setResponses(allResponses);
        setQuestions(allQuestions);
      } catch (e) {
        console.error("Failed to load insights", e);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, [departmentId]);

  if (loading) return <div className="p-8 text-center text-[#2a7c7c] font-bold">מחשב תובנות...</div>
  if (!stats) return <div className="p-8 text-center text-gray-500">אין נתונים להצגה.</div>

  // Format Average Time
  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'לא ידוע';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m} דק' ו-${s} שנ'` : `${s} שנ'`;
  }

  // Calculate Emoji Distribution (Count occurrences of 1 to 5 values)
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
  let totalRatings = 0;
  
  responses.forEach(r => {
    const val = Number(r.answerValue);
    if (!isNaN(val) && val >= 1 && val <= 5) {
      distribution[val]++;
      totalRatings++;
    }
  });

  // Extract recent open text comments
  const textComments = responses
    .filter(r => r.answerText && r.answerText.trim().length > 0)
    .slice(0, 5); // Take top 5 recent comments

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e8e7f5] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f0f9f9] rounded-full flex items-center justify-center text-[#2a7c7c]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#6b6890] font-bold mb-1">משיבים</p>
            <h3 className="text-2xl font-bold text-[#1e1c4a]">{stats.totalResponses}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e8e7f5] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f0f9f9] rounded-full flex items-center justify-center text-[#2a7c7c]">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#6b6890] font-bold mb-1">אחוז שביעות רצון</p>
            <h3 className="text-2xl font-bold text-[#1e1c4a]">{stats.satisfactionPercentage}%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e8e7f5] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f0f9f9] rounded-full flex items-center justify-center text-[#2a7c7c]">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#6b6890] font-bold mb-1">תגובות</p>
            <h3 className="text-2xl font-bold text-[#1e1c4a]">{stats.totalComments}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e8e7f5] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-[#f0f9f9] rounded-full flex items-center justify-center text-[#2a7c7c]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#6b6890] font-bold mb-1">זמן מילוי ממוצע</p>
            <h3 className="text-xl font-bold text-[#1e1c4a]">{formatTime(stats.avgTimeSeconds)}</h3>
          </div>
        </div>
      </div>

      {/* Middle Section: Charts & Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Emoji Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-[#e8e7f5] shadow-sm">
          <h3 className="text-[#1e1c4a] font-bold mb-6 flex items-center gap-2">
            <Smile className="w-5 h-5 text-[#2a7c7c]" /> פילוג שביעות רצון
          </h3>
          <div className="space-y-4">
            {[
              { val: 5, label: 'מעולה', emoji: '😍', color: 'bg-[#2ecfaa]' },
              { val: 4, label: 'טוב', emoji: '😊', color: 'bg-[#7dd3d3]' },
              { val: 3, label: 'בסדר', emoji: '😐', color: 'bg-[#ffd166]' },
              { val: 2, label: 'לא טוב', emoji: '😟', color: 'bg-[#ff9f43]' },
              { val: 1, label: 'גרוע', emoji: '😡', color: 'bg-[#ff6b6b]' },
            ].map(item => {
              const count = distribution[item.val];
              const percent = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
              return (
                <div key={item.val} className="flex items-center gap-3">
                  <div className="text-xl w-6 text-center">{item.emoji}</div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="w-12 text-left text-xs font-bold text-[#6b6890]">{percent}%</div>
                </div>
              )
            })}
          </div>
          {totalRatings === 0 && <p className="text-sm text-gray-400 mt-4 text-center">אין עדיין דירוגים להצגה.</p>}
        </div>

        {/* Placeholder for future charts */}
        <div className="bg-white p-6 rounded-2xl border border-[#e8e7f5] shadow-sm lg:col-span-2 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#f0f9f9] rounded-full flex items-center justify-center text-[#2a7c7c] mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <h3 className="text-[#1e1c4a] font-bold mb-2">גרפים נוספים בבנייה</h3>
          <p className="text-[#6b6890] text-sm">כאן יופיעו בהמשך פילוגי תשובות על שאלות בחירה מרובה וניתוחי קטגוריות מתקדמים.</p>
        </div>
      </div>

      {/* Recent Comments Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#e8e7f5] shadow-sm">
        <h3 className="text-[#1e1c4a] font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#2a7c7c]" /> תגובות אחרונות
        </h3>
        {textComments.length === 0 ? (
          <p className="text-[#6b6890] text-center p-6">אין עדיין תגובות טקסטואליות מהמטופלים.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {textComments.map(comment => {
              const date = new Date(comment.createdAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <div key={comment.id} className="bg-[#f7f7fc] p-5 rounded-xl border border-[#e8e7f5] relative">
                  <div className="text-[#2a7c7c] opacity-20 text-4xl absolute top-2 right-4">"</div>
                  <p className="text-[#1e1c4a] font-medium text-sm leading-relaxed relative z-10 mt-2 mb-4">
                    {comment.answerText}
                  </p>
                  <div className="text-xs text-[#a8a6c4] border-t border-[#e8e7f5] pt-3">
                    התקבל ב- {date}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
