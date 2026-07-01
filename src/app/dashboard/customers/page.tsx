import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function maskPhone(phone: string) {
  return phone.slice(0, -4) + '****'
}

const TH_STYLE: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontFamily: 'var(--font-display)',
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: '#FFFFFF',
  background: 'var(--color-foreground)',
  whiteSpace: 'nowrap',
}

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!restaurant) redirect('/dashboard/create')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, opt_in_status, last_visit_at, created_at')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: '2rem' }}>
      <h1
        data-testid="customers-heading"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          color: 'var(--color-foreground)',
          marginBottom: '1.5rem',
        }}
      >
        Active Guests
      </h1>

      {!customers || customers.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-foreground)', opacity: 0.5 }}>
            No guests yet. Share your QR code to get started.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              data-testid="customers-table"
              style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}
            >
              <thead>
                <tr>
                  <th style={TH_STYLE}>Name</th>
                  <th style={TH_STYLE}>Phone</th>
                  <th style={TH_STYLE}>Status</th>
                  <th style={TH_STYLE}>Last Visit</th>
                  <th style={TH_STYLE}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, i) => (
                  <tr
                    key={customer.id}
                    className={i % 2 === 0 ? 'dash-table-row-even' : 'dash-table-row-odd'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--color-foreground)' }}>
                      {customer.name || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-foreground)' }}>
                      {maskPhone(customer.phone)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <OptInBadge status={customer.opt_in_status} />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--color-foreground)', opacity: 0.7 }}>
                      {customer.last_visit_at
                        ? new Date(customer.last_visit_at).toLocaleDateString('en-IN')
                        : <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--color-foreground)', opacity: 0.7 }}>
                      {new Date(customer.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function OptInBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    opted_in:  { background: '#DCFCE7', color: '#166534' },
    opted_out: { background: '#FEE2E2', color: '#991B1B' },
    pending:   { background: '#FEF9C3', color: '#854D0E' },
  }
  const s = styles[status] ?? { background: 'var(--color-muted)', color: 'var(--color-foreground)' }
  return (
    <span style={{ ...s, display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
      {status.replace('_', ' ')}
    </span>
  )
}
