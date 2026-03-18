import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export function AuthErrorAlert({
  error,
}: {
  error: Error | null | undefined | string;
}) {
  if (!error) {
    return null;
  }

  const errorCode = error instanceof Error ? error.message : error;

  return (
    <div className="flex gap-2 p-3 border border-red-500/20 bg-red-500/10 text-red-500 text-sm rounded-lg" data-test="auth-error-message">
      <ExclamationTriangleIcon className="w-4 h-4 mt-0.5" />
      <div>
        <div className="font-bold mb-1">Authentication Error</div>
        <div>{errorCode}</div>
      </div>
    </div>
  );
}
