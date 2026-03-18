'use client';

import type { JwtPayload } from '@supabase/supabase-js';

import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { useUser } from '@kit/supabase/hooks/use-user';

export function ProfileAccountDropdownContainer(props: {
  user?: JwtPayload;
  showProfileName?: boolean;

  account?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  };
}) {
  const signOut = useSignOut();
  const user = useUser(props.user);
  const userData = user.data;

  if (!userData) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      {props.showProfileName && (
        <span className="text-sm font-medium">
          {props.account?.name || userData.email}
        </span>
      )}
      <button
        onClick={() => signOut.mutateAsync()}
        className="text-sm underline cursor-pointer"
      >
        Sign out
      </button>
    </div>
  );
}
