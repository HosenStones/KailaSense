'use client'

import type { Question } from '@/lib/types'

interface ContentBlockProps {
  question: Question
}

export function ContentBlock({ question }: ContentBlockProps) {
  return (
    <div className="flex flex-col items-center text-center w-full max-w-md mx-auto p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 text-white shadow-xl animate-in fade-in zoom-in duration-500">
      {/* Slide title */}
      <h2 className="text-2xl font-bold leading-relaxed mb-6 text-white">
        {question.questionText}
      </h2>
      
      {/* Render Image content if available */}
      {question.contentType === 'image' && question.contentUrl && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-6 bg-black/20">
          <img 
            src={question.contentUrl} 
            alt={question.questionText} 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Render Video content if available */}
      {question.contentType === 'video' && question.contentUrl && (
        <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-lg border border-white/10 mb-6 bg-black/20">
          <video 
            src={question.contentUrl} 
            controls 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Render detailed body text if available */}
      {question.contentBody && (
        <div className="w-full text-right text-base md:text-lg leading-relaxed bg-black/10 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
          {question.contentBody}
        </div>
      )}
    </div>
  )
}
