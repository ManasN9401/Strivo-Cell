'use client'

import { useState } from 'react'

export interface VideoMeta {
  title: string
  description: string
  tags: string[]
  visibility: 'public' | 'unlisted' | 'private'
}

interface Props {
  value: VideoMeta
  onChange: (meta: VideoMeta) => void
}

const VISIBILITY_OPTIONS: { value: VideoMeta['visibility']; label: string; description: string }[] = [
  { value: 'public',   label: 'Public',   description: 'Anyone can watch' },
  { value: 'unlisted', label: 'Unlisted', description: 'Only people with the link' },
  { value: 'private',  label: 'Private',  description: 'Only you' },
]

export default function VideoMetaForm({ value, onChange }: Props) {
  const [tagInput, setTagInput] = useState('')

  function update<K extends keyof VideoMeta>(key: K, val: VideoMeta[K]) {
    onChange({ ...value, [key]: val })
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag || value.tags.includes(tag) || value.tags.length >= 10) return
    update('tags', [...value.tags, tag])
    setTagInput('')
  }

  function removeTag(tag: string) {
    update('tags', value.tags.filter(t => t !== tag))
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="video-title" className="block text-white/70 text-sm font-medium mb-1.5">
          Title <span className="text-red-400" aria-label="required">*</span>
        </label>
        <input
          id="video-title"
          type="text"
          value={value.title}
          onChange={e => update('title', e.target.value)}
          placeholder="Give your video a title…"
          maxLength={100}
          required
          className="w-full bg-strivo-bg border border-white/10 rounded-xl px-4 py-3
                     text-white text-sm placeholder:text-white/25 outline-none
                     focus:border-strivo-accent/50 transition-colors"
        />
        <p className="text-white/25 text-xs mt-1 text-right">{value.title.length}/100</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="video-desc" className="block text-white/70 text-sm font-medium mb-1.5">
          Description
        </label>
        <textarea
          id="video-desc"
          value={value.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Tell viewers about your video…"
          maxLength={5000}
          rows={5}
          className="w-full bg-strivo-bg border border-white/10 rounded-xl px-4 py-3
                     text-white text-sm placeholder:text-white/25 outline-none resize-none
                     focus:border-strivo-accent/50 transition-colors leading-relaxed"
        />
        <p className="text-white/25 text-xs mt-1 text-right">{value.description.length}/5000</p>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="video-tags" className="block text-white/70 text-sm font-medium mb-1.5">
          Tags <span className="text-white/30 font-normal ml-1">({value.tags.length}/10)</span>
        </label>
        <div className="flex gap-2">
          <input
            id="video-tags"
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addTag())}
            placeholder="Add a tag, press Enter"
            maxLength={30}
            className="flex-1 bg-strivo-bg border border-white/10 rounded-xl px-4 py-3
                       text-white text-sm placeholder:text-white/25 outline-none
                       focus:border-strivo-accent/50 transition-colors"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!tagInput.trim() || value.tags.length >= 10}
            className="px-4 py-3 bg-strivo-surface hover:bg-white/10 text-white/60
                       hover:text-white rounded-xl text-sm transition-colors cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strivo-accent"
          >
            Add
          </button>
        </div>
        {value.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3" role="list" aria-label="Tags">
            {value.tags.map(tag => (
              <span key={tag} role="listitem"
                    className="flex items-center gap-1.5 bg-strivo-surface border border-white/10
                               text-white/70 text-xs px-3 py-1.5 rounded-full">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                        className="text-white/30 hover:text-white transition-colors cursor-pointer
                                   focus-visible:outline-none rounded-full">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                       stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M1 1l10 10M11 1L1 11"/>
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Visibility */}
      <div>
        <p className="text-white/70 text-sm font-medium mb-2" id="visibility-label">
          Visibility
        </p>
        <div role="radiogroup" aria-labelledby="visibility-label"
             className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VISIBILITY_OPTIONS.map(opt => {
            const checked = value.visibility === opt.value
            return (
              <label key={opt.value}
                     className={[
                       'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150',
                       checked
                         ? 'border-strivo-accent bg-strivo-accent/10'
                         : 'border-white/10 bg-strivo-surface hover:border-white/20',
                     ].join(' ')}>
                <input type="radio" name="visibility" value={opt.value} checked={checked}
                       onChange={() => update('visibility', opt.value)}
                       className="mt-0.5 accent-[#0915e6] shrink-0" />
                <div>
                  <p className={`text-sm font-semibold ${checked ? 'text-white' : 'text-white/70'}`}>
                    {opt.label}
                  </p>
                  <p className="text-white/35 text-xs mt-0.5">{opt.description}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}