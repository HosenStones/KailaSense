'use client'

import { Button } from '@/components/ui/button'

interface SurveyNavigationProps {
  canGoBack: boolean
  canGoForward: boolean
  isLastQuestion: boolean
  isAnswered: boolean
  isRequired: boolean
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export function SurveyNavigation({
  canGoBack,
  isLastQuestion,
  isAnswered,
  isRequired,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
}: SurveyNavigationProps) {
  const canProceed = !isRequired || isAnswered

  return (
    <div className="flex items-center gap-3">
      {/* Back button */}
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className={`px-4 py-3 bg-[#f7f7fc] border border-[#e8e7f5] rounded-xl text-sm font-medium text-[#6b6890] whitespace-nowrap transition-colors hover:bg-[#e8e7f5] disabled:opacity-0 disabled:pointer-events-none`}
      >
        {'→ חזרה'}
      </button>

      {/* Next/Submit button */}
      {isLastQuestion ? (
        <Button
          onClick={onSubmit}
          disabled={!canProceed || isSubmitting}
          className="flex-1 bg-[#3d3a9e] hover:bg-[#302d8a] text-white font-bold py-3 rounded-xl text-base disabled:bg-[#c8c7e8] disabled:text-[#9896cc]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              שולח...
            </span>
          ) : (
            'שלח משוב'
          )}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 bg-[#3d3a9e] hover:bg-[#302d8a] text-white font-bold py-3 rounded-xl text-base disabled:bg-[#c8c7e8] disabled:text-[#9896cc]"
        >
          {'המשך ←'}
        </Button>
      )}
    </div>
  )
}
