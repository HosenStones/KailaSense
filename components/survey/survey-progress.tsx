'use client'

interface SurveyProgressProps {
  current: number
  total: number
}

export function SurveyProgress({ current, total }: SurveyProgressProps) {
  const progress = Math.round((current / total) * 100)

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="h-1 w-full bg-[#f7f7fc]">
        <div
          className="h-full bg-[#2ecfaa] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Progress Text */}
      <div className="flex items-center justify-between px-4 pt-2 text-xs text-[#a8a6c4]">
        <span>שאלה {current} מתוך {total}</span>
        <span>{progress}%</span>
      </div>
    </div>
  )
}
