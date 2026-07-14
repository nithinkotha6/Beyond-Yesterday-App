'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, ThumbsUp, X } from 'lucide-react';
import { processVerificationVote } from '@/app/actions/vote';

interface VoteButtonProps {
  logId: string;
  logOwnerId: string;
  voterId: string;
  hasVoted: boolean;
}

/**
 * Client-side Verify/Decline button group for the peer-review queue.
 * Calls processVerificationVote and revalidates page cache on success.
 */
export default function VoteButton({ logId, logOwnerId, voterId, hasVoted }: VoteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTrans] = useTransition();

  async function handleApprove() {
    setError(null);
    startTrans(async () => {
      const res = await processVerificationVote({ logId, vote: 'approve' });
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  async function handleReject() {
    setError(null);
    startTrans(async () => {
      const res = await processVerificationVote({ logId, vote: 'reject' });
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (hasVoted) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] flex-shrink-0 select-none">
        <CheckCircle size={13} />
        Verified
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <div className="flex items-center gap-1.5">
        {/* Approve button */}
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 bg-[#111827] text-white text-xs font-semibold px-3 py-2.5 rounded-xl hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px] cursor-pointer"
          title="Verify activity"
        >
          {isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <ThumbsUp size={12} />
          )}
          Verify
        </button>

        {/* Decline button */}
        <button
          onClick={handleReject}
          disabled={isPending}
          className="flex items-center justify-center bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 p-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px] cursor-pointer"
          title="Decline/Reject activity"
        >
          <X size={14} strokeWidth={3} />
        </button>
      </div>
      {error && (
        <span className="text-[10px] text-[#EF4444] max-w-[120px] text-right leading-tight mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
