'use client'

import type { Question, Response } from '@/lib/types'
import { EmojiQuestion } from './questions/emoji-question'
import { ChoiceQuestion } from './questions/choice-question'
import { MultiChoiceQuestion } from './questions/multi-choice-question'
import { StarsQuestion } from './questions/stars-question'
import { OpenTextQuestion } from './questions/open-text-question'

interface SurveyQuestionProps {
  question: Question
  response: Partial<Response> | null
  onResponse: (response: Partial<Response>) => void
}

export function SurveyQuestion({ question, response, onResponse }: SurveyQuestionProps) {
  const handleChange = (value: string | string[] | number) => {
    if (question.questionType === 'multi_choice') {
      onResponse({
        questionId: question.id,
        answerValues: value as string[],
      })
    } else if (question.questionType === 'open_text') {
      onResponse({
        questionId: question.id,
        answerText: value as string,
      })
    } else if (question.questionType === 'stars') {
      onResponse({
        questionId: question.id,
        answerValue: String(value),
      })
    } else {
      onResponse({
        questionId: question.id,
        answerValue: value as string,
      })
    }
  }

  switch (question.questionType) {
    case 'emoji':
      return (
        <EmojiQuestion
          question={question}
          value={response?.answerValue || null}
          onChange={(v) => handleChange(v)}
        />
      )
    case 'choice':
      return (
        <ChoiceQuestion
          question={question}
          value={response?.answerValue || null}
          onChange={(v) => handleChange(v)}
        />
      )
    case 'multi_choice':
      return (
        <MultiChoiceQuestion
          question={question}
          values={response?.answerValues || []}
          onChange={(v) => handleChange(v)}
        />
      )
    case 'stars':
      return (
        <StarsQuestion
          question={question}
          value={response?.answerValue ? parseInt(response.answerValue) : null}
          onChange={(v) => handleChange(v)}
        />
      )
    case 'open_text':
      return (
        <OpenTextQuestion
          question={question}
          value={response?.answerText || ''}
          onChange={(v) => handleChange(v)}
        />
      )
    default:
      return null
  }
}
