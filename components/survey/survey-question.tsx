'use client'

import type { Question, Response } from '@/lib/types'
import { EmojiQuestion } from './questions/emoji-question'
import { StarsQuestion } from './questions/stars-question'
import { ChoiceQuestion } from './questions/choice-question'
import { MultiChoiceQuestion } from './questions/multi-choice-question'
import { OpenTextQuestion } from './questions/open-text-question'
import { ContentBlock } from './questions/content-block'

interface SurveyQuestionProps {
  question: Question
  response: Partial<Response> | null
  onResponse: (response: Partial<Response>) => void
}

export function SurveyQuestion({ question, response, onResponse }: SurveyQuestionProps) {
  // Intercept and display information block if the item is a content slide
  if (question.questionType === 'content') {
    return <ContentBlock question={question} />
  }

  switch (question.questionType) {
    case 'emoji':
      return (
        <EmojiQuestion
          question={question}
          value={response?.answerValue || null}
          onChange={(val) => onResponse({ questionId: question.id, answerValue: val })}
        />
      )
    case 'stars':
      return (
        <StarsQuestion
          question={question}
          value={response?.answerValue ? Number(response.answerValue) : null}
          onChange={(val) => onResponse({ questionId: question.id, answerValue: String(val) })}
        />
      )
    case 'choice':
      return (
        <ChoiceQuestion
          question={question}
          value={response?.answerValue || null}
          onChange={(val) => onResponse({ questionId: question.id, answerValue: val })}
        />
      )
    case 'multi_choice':
      return (
        <MultiChoiceQuestion
          question={question}
          values={response?.answerValues || []}
          onChange={(vals) => onResponse({ questionId: question.id, answerValues: vals })}
        />
      )
    case 'open_text':
      return (
        <OpenTextQuestion
          question={question}
          value={response?.answerText || ''}
          onChange={(val) => onResponse({ questionId: question.id, answerText: val })}
        />
      )
    default:
      return (
        <div className="text-white text-center p-4">
          Unknown item type: {question.questionType}
        </div>
      )
  }
}
