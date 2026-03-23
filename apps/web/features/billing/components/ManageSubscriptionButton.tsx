'use client';

import { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { createPortalSession } from '../actions';

interface ManageSubscriptionButtonProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function ManageSubscriptionButton({
  workspaceId,
  workspaceSlug,
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);
    await createPortalSession(workspaceId, workspaceSlug);
  }

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4" />
      )}
      {loading ? 'Abrindo portal…' : 'Gerenciar assinatura'}
    </button>
  );
}
