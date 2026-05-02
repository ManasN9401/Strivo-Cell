'use client'

import { useState, useTransition, useRef } from 'react'
import type { Comment } from '@/types/creators'

interface Props {
  videoId: string
  initialComments: Comment[]
  currentUserId: string | null
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function Avatar({ email }: { email?: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-cinema-accent flex items-center justify-center
                    text-white text-xs font-bold shrink-0">
      {email?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function CommentItem({ comment, currentUserId, onDelete, onReply, depth = 0 }: {
  comment: Comment
  currentUserId: string | null
  onDelete: (id: string) => void
  onReply: (parentId: string, body: string) => void
  depth?: number
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const isOwn = currentUserId === comment.user_id

  function submitReply() {
    if (!replyBody.trim()) return
    startTransition(() => {
      onReply(comment.id, replyBody.trim())
      setReplyBody('')
      setShowReply(false)
    })
  }

  return (
    <div className={depth > 0 ? 'ml-10 border-l border-white/[0.06] pl-4' : ''}>
      <div className="flex gap-3 group">
        <Avatar email={comment.user_email} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-white text-xs font-semibold">
              {comment.user_email?.split('@')[0] ?? 'User'}
            </span>
            <span className="text-white/30 text-xs">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-white/80 text-sm mt-1 leading-relaxed">{comment.body}</p>
          <div className="flex items-center gap-3 mt-2">
            {depth === 0 && currentUserId && (
              <button onClick={() => setShowReply(v => !v)}
                      className="text-white/40 hover:text-white text-xs transition-colors cursor-pointer
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded">
                Reply
              </button>
            )}
            {isOwn && (
              <button onClick={() => onDelete(comment.id)}
                      className="text-white/20 hover:text-red-400 text-xs transition-colors cursor-pointer
                                 opacity-0 group-hover:opacity-100 focus-visible:opacity-100
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent rounded"
                      aria-label="Delete comment">
                Delete
              </button>
            )}
          </div>
          {showReply && (
            <div className="flex gap-2 mt-3">
              <input type="text" value={replyBody} onChange={e => setReplyBody(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && submitReply()}
                     placeholder="Write a reply…" maxLength={1000}
                     className="flex-1 bg-cinema-surface border border-white/10 rounded-lg
                                px-3 py-2 text-white text-sm placeholder:text-white/30
                                outline-none focus:border-cinema-accent/50 transition-colors"
                     aria-label="Reply text" />
              <button onClick={submitReply} disabled={isPending || !replyBody.trim()}
                      className="px-3 py-2 bg-cinema-accent text-white text-xs font-semibold
                                 rounded-lg transition-colors cursor-pointer disabled:opacity-50
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent">
                Reply
              </button>
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId}
                         onDelete={onDelete} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentsSection({ videoId, initialComments, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  async function postComment() {
    if (!body.trim() || !currentUserId) return
    const text = body.trim()
    setBody('')
    const temp: Comment = {
      id: `temp-${Date.now()}`, video_id: videoId, user_id: currentUserId,
      parent_id: null, body: text, created_at: new Date().toISOString(), replies: [],
    }
    setComments(prev => [temp, ...prev])
    startTransition(async () => {
      const res = await fetch(`/api/creators/videos/${videoId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: text }),
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      setComments(prev => prev.map(c => c.id === temp.id ? data.comment : c))
    })
  }

  async function deleteComment(id: string) {
    setComments(prev => prev.filter(c => c.id !== id))
    await fetch(`/api/creators/comments/${id}`, { method: 'DELETE' })
  }

  async function addReply(parentId: string, replyBody: string) {
    const res = await fetch(`/api/creators/videos/${videoId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: replyBody, parent_id: parentId }),
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    setComments(prev => prev.map(c =>
      c.id === parentId ? { ...c, replies: [...(c.replies ?? []), data.comment] } : c
    ))
  }

  return (
    <section aria-label="Comments">
      <h2 className="text-white text-base font-semibold mb-5">
        {comments.length} Comment{comments.length !== 1 ? 's' : ''}
      </h2>
      {currentUserId ? (
        <div className="flex gap-3 mb-8">
          <Avatar />
          <div className="flex-1 flex flex-col gap-2">
            <input type="text" value={body} onChange={e => setBody(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && postComment()}
                   placeholder="Add a comment…" maxLength={2000}
                   className="w-full bg-transparent border-b border-white/10 focus:border-cinema-accent/60
                              text-white text-sm placeholder:text-white/30 outline-none pb-2 transition-colors"
                   aria-label="New comment" />
            {body.trim() && (
              <div className="flex justify-end gap-2">
                <button onClick={() => setBody('')}
                        className="text-white/50 hover:text-white text-xs px-3 py-1.5 rounded
                                   transition-colors cursor-pointer">
                  Cancel
                </button>
                <button onClick={postComment} disabled={isPending}
                        className="bg-cinema-accent text-white text-xs font-semibold px-4 py-1.5
                                   rounded-full transition-colors cursor-pointer disabled:opacity-50
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinema-accent">
                  Comment
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-white/40 text-sm mb-6">
          <a href="/login" className="text-cinema-accent hover:underline">Sign in</a> to comment
        </p>
      )}
      <div className="space-y-6">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId}
                       onDelete={deleteComment} onReply={addReply} />
        ))}
      </div>
    </section>
  )
}