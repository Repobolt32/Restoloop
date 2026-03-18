import { redirect } from 'next/navigation';

export default function RootIndexPage() {
    // Restoloop is an admin/SaaS dashboard tool.
    // The marketing shell has been purged. Forwarding traffic directly into the app.
    redirect('/home');
}
