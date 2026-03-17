import { redirect } from 'next/navigation';
import { Page, PageNavigation } from '@kit/ui/page';
import { createSupabaseServerClient } from '~/lib/supabase/server';
import { HomeMenuNavigation } from '../home/_components/home-menu-navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout(props: React.PropsWithChildren) {
    const supabase = createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    const userId = authData?.user?.id;
    const adminId = process.env.SUPER_ADMIN_USER_ID;

    if (!userId || !adminId || userId !== adminId) {
        // Basic protection: simply redirect non-admins back to their home
        redirect('/home');
    }

    return (
        <Page style={'header'}>
            <PageNavigation>
                <HomeMenuNavigation />
            </PageNavigation>
            {props.children}
        </Page>
    );
}
