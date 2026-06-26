import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';

import { createClient } from '~/lib/supabase/server';

export const metadata = {
  title: 'Not Found',
};

const NotFoundPage = async () => {
  const client = await createClient();
  await client.auth.getUser();

  return (
    <div className={'flex h-screen flex-1 flex-col'}>
      <div className={'container m-auto flex w-full flex-1 flex-col items-center justify-center'}>
        <div className={'flex flex-col items-center space-y-12'}>
          <div>
            <h1 className={'font-heading text-8xl font-extrabold xl:text-9xl'}>
              404
            </h1>
          </div>
          <div className={'flex flex-col items-center space-y-8'}>
            <div className={'flex flex-col items-center space-y-2.5'}>
              <div>
                <h1 className="text-4xl font-bold">
                  Page Not Found
                </h1>
              </div>
              <p className={'text-muted-foreground'}>
                Sorry, the page you are looking for does not exist.
              </p>
            </div>
            <Link href={'/'} className="inline-flex items-center px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className={'mr-2 h-4'} />
              Back to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
