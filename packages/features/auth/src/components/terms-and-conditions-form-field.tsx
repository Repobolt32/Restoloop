import Link from 'next/link';

export function TermsAndConditionsFormField(
  props: {
    name?: string;
  } = {},
) {
  const fieldName = props.name ?? 'termsAccepted';
  return (
    <div className="terms-field">
      <label className="flex items-start space-x-2 py-2">
        <input type="checkbox" required name={fieldName} id={fieldName} />
        <div className="text-xs">
          I accept the{' '}
          <Link target="_blank" className="underline" href="/terms-of-service">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link target="_blank" className="underline" href="/privacy-policy">
            Privacy Policy
          </Link>
        </div>
      </label>
    </div>
  );
}
