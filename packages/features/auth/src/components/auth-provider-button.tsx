import { OauthProviderLogoImage } from './oauth-provider-logo-image';

export function AuthProviderButton({
  providerId,
  onClick,
  children,
}: React.PropsWithChildren<{
  providerId: string;
  onClick: () => void;
}>) {
  return (
    <button
      className={'flex w-full items-center justify-center space-x-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-lg transition-colors text-sm font-bold'}
      data-provider={providerId}
      data-test={'auth-provider-button'}
      title={providerId}
      onClick={onClick}
    >
      <OauthProviderLogoImage providerId={providerId} />

      <span>{children}</span>
    </button>
  );
}
