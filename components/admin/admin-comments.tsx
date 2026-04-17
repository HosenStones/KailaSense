'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface AdminCommentsProps {
  departmentId: string
}

interface Comment {
  id: string
  text: string
  sentiment: 'pos' | 'neg' | 'neu'
  stars: number
  date: string
  time: string
}

export function AdminComments({ departmentId }: AdminCommentsProps) {
  const [filter, setFilter] = useState<'all' | 'pos' | 'neg' | 'neu'>('all')

  const comments: Comment[] = [
    {
      id: '1',
      text: 'הצוות היה מדהים! תודה רבה על הטיפול המסור והיחס האישי',
      sentiment: 'pos',
      stars: 5,
      date: '17.04.26',
      time: '14:32',
    },
    {
      id: '2',
      text: 'הכל היה מעולה, מאוד מרוצה מהשירות',
      sentiment: 'pos',
      stars: 4,
      date: '17.04.26',
      time: '12:15',
    },
    {
      id: '3',
      text: 'זמן ההמתנה היה ארוך מדי, היה קשה לחכות כל כך הרבה זמן',
      sentiment: 'neg',
      stars: 2,
      date: '17.04.26',
      time: '10:08',
    },
    {
      id: '4',
      text: 'הטיפול היה טוב, אבל אפשר לשפר את התקשורת עם המטופל',
      sentiment: 'neu',
      stars: 3,
      date: '16.04.26',
      time: '18:45',
    },
    {
      id: '5',
      text: 'מרוצה מאוד! ממליץ בחום',
      sentiment: 'pos',
      stars: 5,
      date: '16.04.26',
      time: '15:22',
    },
  ]

  const filteredComments = filter === 'all' 
    ? comments 
    : comments.filter(c => c.sentiment === filter)

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-3 py-2 border border-[#e8e7f5] rounded-lg text-sm text-[#1e1c4a] bg-white outline-none focus:border-[#2ecfaa]"
        >
          <option value="all">כל התגובות</option>
          <option value="pos">חיוביות</option>
          <option value="neg">שליליות</option>
          <option value="neu">ניטרליות</option>
        </select>

        <input
          type="date"
          className="px-3 py-2 border border-[#e8e7f5] rounded-lg text-sm text-[#1e1c4a] bg-white outline-none focus:border-[#2ecfaa]"
        />

        <Button
          variant="outline"
          className="mr-auto bg-[#eeedf9] border-[#d4d2f0] text-[#3d3a9e] font-bold text-sm hover:bg-[#d4d2f0]"
        >
          ייצוא לאקסל
        </Button>
      </div>

      {/* Comments Table */}
      <div className="bg-white rounded-2xl border border-[#e8e7f5] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f7f7fc]">
              <th className="text-right px-4 py-3 text-xs font-bold text-[#a8a6c4] uppercase tracking-wide">סנטימנט</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-[#a8a6c4] uppercase tracking-wide">תגובה</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-[#a8a6c4] uppercase tracking-wide">דירוג</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-[#a8a6c4] uppercase tracking-wide">תאריך</th>
            </tr>
          </thead>
          <tbody>
            {filteredComments.map((comment) => (
              <tr key={comment.id} className="border-t border-[#f7f7fc]">
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                      comment.sentiment === 'pos'
                        ? 'bg-[#e4faf5] text-[#0a5c4a]'
                        : comment.sentiment === 'neg'
                        ? 'bg-[#fde8f2] text-[#8a0040]'
                        : 'bg-[#eeedf9] text-[#3d3a9e]'
                    }`}
                  >
                    {comment.sentiment === 'pos' ? 'חיובי' : comment.sentiment === 'neg' ? 'שלילי' : 'ניטרלי'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-[#1e1c4a]">{comment.text}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">{'⭐'.repeat(comment.stars)}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-[#a8a6c4]">{comment.date}</p>
                  <p className="text-xs text-[#a8a6c4]">{comment.time}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
