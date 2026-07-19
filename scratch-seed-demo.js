const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESTAURANT_ID = 'e5621182-4c61-4ba6-949f-dab61f361dff';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n) { return new Date(Date.now() - n * 86400000); }
function daysFromNow(n) { return new Date(Date.now() + n * 86400000); }

function generateCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix + '-';
  for (let i = 0; i < 6; i++) code += chars[randomInt(0, chars.length - 1)];
  return code;
}

// ─── Customer Data ─────────────────────────────────────────────────────────────
const NAMES = [
  // North Indian
  'Rajesh Sharma','Priya Singh','Amit Gupta','Neha Verma','Vikram Tiwari',
  'Pooja Mishra','Suresh Yadav','Sunita Chauhan','Rahul Pandey','Kavita Srivastava',
  'Deepak Joshi','Anita Rawat','Manish Kumar','Shikha Agarwal','Rohit Dubey',
  'Rekha Saxena','Ankit Tripathi','Divya Bhatnagar','Sanjay Agarwal','Meera Jain',
  'Vinod Chaudhary','Renu Kesarwani','Prakash Awasthi','Seema Tiwari','Lokesh Verma',
  'Poonam Rani','Harish Nagar','Saroj Singh','Neeraj Kumar','Mamta Gupta',
  // South Indian
  'Arjun Nair','Deepa Menon','Srinivas Rao','Lakshmi Reddy','Kiran Kumar',
  'Padma Iyer','Venkat Subramanian','Revathi Krishnan','Ashwin Pillai','Gayathri Suresh',
  'Balaji Murugan','Saranya Ramesh','Prasad Iyengar','Kavitha Nambiar','Arun Gopalan',
  'Divya Krishnamurthy','Suresh Babu','Ananya Rajan','Vignesh Natarajan','Meenakshi Chandran',
  'Ramesh Sundaram','Preethi Sekar','Balasubramanian K','Swathi Mohan','Karthi Selvam',
  // West Indian
  'Rohan Mehta','Sneha Patel','Vivek Shah','Ritu Joshi','Harsh Desai',
  'Nalini Bhatt','Yash Parekh','Disha Kulkarni','Nikhil Kapoor','Meenakshi Gandhi',
  'Kamal Trivedi','Hiral Modi','Bhavesh Kothari','Priyanka Thakkar','Sonal Vyas',
  'Chintan Amin','Nisha Mehta','Rajan Pandya','Pooja Solanki','Hardik Rajput',
  // East Indian
  'Riya Banerjee','Sourav Mukherjee','Puja Chatterjee','Anupam Bose','Shreyasi Ghosh',
  'Debashish Roy','Mithun Das','Mitali Sen','Arnab Paul','Taniya Saha',
  'Subhadeep Mondal','Arpita Dey','Saurav Bhattacharya','Debarati Nag','Krishnendu Chakraborty',
  // More mixed
  'Aditya Pandey','Ishita Malhotra','Gaurav Sinha','Preeti Kapoor','Sameer Ahuja',
  'Vandana Sharma','Kunal Bhatia','Rashmi Jain','Tarun Saxena','Nidhi Chauhan',
  'Yuvraj Singh','Simran Kaur','Gurpreet Dhaliwal','Harpreet Sandhu','Manpreet Bedi',
  'Ayesha Khan','Zara Ahmad','Imran Siddiqui','Farhan Qureshi','Nazia Ansari',
  'Roshan D\'Souza','Maria Fernandes','Aaron Pereira','Clara D\'Costa','Sebastian Lobo',
  'Ravi Teja','Sai Priya','Charan Tej','Anushka Raju','Bhanu Prakash',
  'Lalitha Devi','Sarojini Nair','Vidya Sagar','Asha Kumari','Ratna Bai',
  'Dinesh Chandra','Kamla Devi','Mahesh Prasad','Usha Rani','Shanti Devi',
  'Vijay Kumar','Radha Krishnan','Gopal Das','Kamini Singh','Madhavi Lata',
  'Ashok Mishra','Pushpa Devi','Ramesh Gupta','Sarita Sharma','Mukesh Agarwal',
];

const FOOD_PREFS = [
  ...Array(81).fill('Non-Veg'),
  ...Array(72).fill('Veg'),
  ...Array(18).fill('Eggitarian'),
  ...Array(9).fill('Vegan'),
];

// Monthly distribution over last 6 months
// Feb:10, Mar:18, Apr:28, May:38, Jun:45, Jul:41 = 180
function getCreatedAt(index) {
  const schedule = [
    { count: 10, monthsAgo: 5 }, // Feb
    { count: 18, monthsAgo: 4 }, // Mar
    { count: 28, monthsAgo: 3 }, // Apr
    { count: 38, monthsAgo: 2 }, // May
    { count: 45, monthsAgo: 1 }, // Jun
    { count: 41, monthsAgo: 0 }, // Jul
  ];
  let cumulative = 0;
  for (const s of schedule) {
    cumulative += s.count;
    if (index < cumulative) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - s.monthsAgo);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      const range = monthEnd - monthStart;
      return new Date(monthStart.getTime() + Math.random() * range);
    }
  }
  return new Date();
}

function getLastVisit(segment, createdAt) {
  if (segment === 'never') return null;
  const now = Date.now();
  if (segment === 'active') return new Date(now - randomInt(1, 28) * 86400000);
  if (segment === 'at_risk') return new Date(now - randomInt(30, 58) * 86400000);
  if (segment === 'lapsed') return new Date(now - randomInt(61, 88) * 86400000);
}

function getBirthday() {
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  // Return as a date string with year 2000 (year-agnostic)
  return `2000-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

async function seed() {
  console.log('🌶️  Seeding Spice Court demo data...\n');

  // ── 1. BUILD CUSTOMERS ────────────────────────────────────────────────────
  const segments = [
    ...Array(72).fill('active'),
    ...Array(36).fill('at_risk'),
    ...Array(27).fill('lapsed'),
    ...Array(45).fill('never'),
  ];
  // shuffle segments
  segments.sort(() => Math.random() - 0.5);

  const optInStatuses = [
    ...Array(162).fill('opted_in'),
    ...Array(12).fill('pending'),
    ...Array(6).fill('opted_out'),
  ];
  optInStatuses.sort(() => Math.random() - 0.5);

  const foodPrefs = [...FOOD_PREFS];
  foodPrefs.sort(() => Math.random() - 0.5);

  const names = NAMES.slice(0, 180);
  const customers = [];

  for (let i = 0; i < 180; i++) {
    const createdAt = getCreatedAt(i);
    const seg = segments[i];
    const lastVisit = getLastVisit(seg, createdAt);
    const bd = getBirthday();

    customers.push({
      restaurant_id: RESTAURANT_ID,
      name: names[i],
      phone: `91${String(9800000000 + i).slice(1)}`,  // 919800000000 → 919800000179
      opt_in_status: optInStatuses[i],
      food_preference: foodPrefs[i],
      birthday_month: parseInt(bd.split('-')[1]),
      birthday_day: parseInt(bd.split('-')[2]),
      last_visit_at: lastVisit ? lastVisit.toISOString() : null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
    });
  }

  const { data: insertedCustomers, error: cErr } = await supabase
    .from('customers')
    .insert(customers)
    .select('id, name, opt_in_status, created_at');

  if (cErr) { console.error('Customer insert error:', cErr); return; }
  console.log(`✅ Inserted ${insertedCustomers.length} customers`);

  // ── 2. BUILD COUPONS ──────────────────────────────────────────────────────
  const coupons = [];
  const couponMap = []; // { customerId, couponId, type, status }

  // Only opted_in customers get coupons
  const optedInCustomers = insertedCustomers.filter(c => c.opt_in_status === 'opted_in');

  // Welcome coupons: all opted_in (162)
  for (const c of optedInCustomers) {
    const roll = Math.random();
    let status, redeemedAt, billAmountCents, discountAmountCents, expiresAt;
    const discountPercent = 5;
    const createdAt = new Date(c.created_at);

    if (roll < 0.35) { // 35% redeemed
      status = 'redeemed';
      redeemedAt = new Date(createdAt.getTime() + randomInt(1, 20) * 86400000);
      billAmountCents = randomInt(60000, 200000); // ₹600-₹2000
      discountAmountCents = Math.round(billAmountCents * discountPercent / 100);
      expiresAt = new Date(createdAt.getTime() + 30 * 86400000);
    } else if (roll < 0.75) { // 40% active/sent
      status = 'sent';
      redeemedAt = null;
      billAmountCents = null;
      discountAmountCents = null;
      expiresAt = new Date(createdAt.getTime() + 30 * 86400000);
    } else { // 25% expired
      status = 'sent';
      redeemedAt = null;
      billAmountCents = null;
      discountAmountCents = null;
      expiresAt = new Date(createdAt.getTime() + randomInt(5, 25) * 86400000);
      // expired = past date
    }

    const coupon = {
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      type: 'welcome',
      code: generateCode('W05'),
      discount_cents: Math.round(60000 * discountPercent / 100),
      discount_percent: discountPercent,
      status,
      expires_at: expiresAt.toISOString(),
      redeemed_at: redeemedAt ? redeemedAt.toISOString() : null,
      bill_amount_cents: billAmountCents,
      discount_amount_cents: discountAmountCents,
      created_at: createdAt.toISOString(),
    };
    coupons.push(coupon);
  }

  // Birthday coupons: 22 random opted_in customers
  const bdCustomers = optedInCustomers.slice(0, 22);
  for (const c of bdCustomers) {
    const roll = Math.random();
    const discountPercent = 10;
    const createdAt = new Date(Date.now() - randomInt(5, 60) * 86400000);
    let status, redeemedAt, billAmountCents, discountAmountCents;

    if (roll < 0.55) {
      status = 'redeemed';
      redeemedAt = new Date(createdAt.getTime() + randomInt(1, 10) * 86400000);
      billAmountCents = randomInt(80000, 250000);
      discountAmountCents = Math.round(billAmountCents * discountPercent / 100);
    } else {
      status = 'sent';
      redeemedAt = null; billAmountCents = null; discountAmountCents = null;
    }

    coupons.push({
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      type: 'birthday',
      code: generateCode('B10'),
      discount_cents: Math.round(80000 * discountPercent / 100),
      discount_percent: discountPercent,
      status,
      expires_at: daysFromNow(randomInt(2, 14)).toISOString(),
      redeemed_at: redeemedAt ? redeemedAt.toISOString() : null,
      bill_amount_cents: billAmountCents,
      discount_amount_cents: discountAmountCents,
      created_at: createdAt.toISOString(),
    });
  }

  // Winback coupons: 28 customers
  const wbCustomers = optedInCustomers.slice(30, 58);
  for (const c of wbCustomers) {
    const roll = Math.random();
    const discountPercent = 7;
    const createdAt = new Date(Date.now() - randomInt(10, 80) * 86400000);
    let status, redeemedAt, billAmountCents, discountAmountCents;

    if (roll < 0.40) {
      status = 'redeemed';
      redeemedAt = new Date(createdAt.getTime() + randomInt(1, 15) * 86400000);
      billAmountCents = randomInt(70000, 180000);
      discountAmountCents = Math.round(billAmountCents * discountPercent / 100);
    } else {
      status = 'sent';
      redeemedAt = null; billAmountCents = null; discountAmountCents = null;
    }

    coupons.push({
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      type: 'winback',
      code: generateCode('WB7'),
      discount_cents: Math.round(70000 * discountPercent / 100),
      discount_percent: discountPercent,
      status,
      expires_at: daysFromNow(randomInt(-5, 20)).toISOString(),
      redeemed_at: redeemedAt ? redeemedAt.toISOString() : null,
      bill_amount_cents: billAmountCents,
      discount_amount_cents: discountAmountCents,
      created_at: createdAt.toISOString(),
    });
  }

  // Manual coupons: 8
  const manualCustomers = optedInCustomers.slice(100, 108);
  for (const c of manualCustomers) {
    const roll = Math.random();
    const discountPercent = 15;
    const createdAt = new Date(Date.now() - randomInt(5, 30) * 86400000);
    let status, redeemedAt, billAmountCents, discountAmountCents;

    if (roll < 0.50) {
      status = 'redeemed';
      redeemedAt = new Date(createdAt.getTime() + randomInt(1, 5) * 86400000);
      billAmountCents = randomInt(100000, 300000);
      discountAmountCents = Math.round(billAmountCents * discountPercent / 100);
    } else {
      status = 'sent';
      redeemedAt = null; billAmountCents = null; discountAmountCents = null;
    }

    coupons.push({
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      type: 'manual',
      code: generateCode('MAN'),
      discount_cents: Math.round(100000 * discountPercent / 100),
      discount_percent: discountPercent,
      status,
      expires_at: daysFromNow(randomInt(5, 30)).toISOString(),
      redeemed_at: redeemedAt ? redeemedAt.toISOString() : null,
      bill_amount_cents: billAmountCents,
      discount_amount_cents: discountAmountCents,
      created_at: createdAt.toISOString(),
    });
  }

  const { data: insertedCoupons, error: couponErr } = await supabase
    .from('coupons')
    .insert(coupons)
    .select('id, type, status, customer_id, created_at');

  if (couponErr) { console.error('Coupon insert error:', couponErr); return; }
  console.log(`✅ Inserted ${insertedCoupons.length} coupons`);

  // ── 3. BUILD MESSAGE LOGS ──────────────────────────────────────────────────
  const logs = [];

  // Welcome: inbound opt_in + outbound coupon (for all opted_in)
  for (const c of optedInCustomers) {
    const ts = new Date(c.created_at);
    // inbound - customer message
    logs.push({
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      direction: 'inbound',
      type: 'opt_in',
      status: 'received',
      provider_message_id: `in-${c.id}-${Date.now()}-${randomInt(1000,9999)}`,
      created_at: ts.toISOString(),
    });
    // outbound - welcome coupon
    logs.push({
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      direction: 'outbound',
      type: 'opt_in_confirm',
      status: Math.random() < 0.90 ? 'sent' : 'failed',
      provider_message_id: `out-welcome-${c.id}-${randomInt(1000,9999)}`,
      created_at: new Date(ts.getTime() + randomInt(5, 60) * 1000).toISOString(),
    });
  }

  // Welcome reminders: 110 customers
  for (const c of optedInCustomers.slice(0, 110)) {
    const ts = new Date(new Date(c.created_at).getTime() + 2 * 3600000);
    logs.push({
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      direction: 'outbound',
      type: 'welcome_reminder',
      status: Math.random() < 0.89 ? 'sent' : 'failed',
      provider_message_id: `out-reminder-${c.id}-${randomInt(1000,9999)}`,
      created_at: ts.toISOString(),
    });
  }

  // Birthday campaigns: 22
  for (const c of bdCustomers) {
    const ts = new Date(Date.now() - randomInt(1, 55) * 86400000);
    logs.push({
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      direction: 'outbound',
      type: 'birthday_campaign',
      status: Math.random() < 0.91 ? 'sent' : 'failed',
      provider_message_id: `out-bday-${c.id}-${randomInt(1000,9999)}`,
      created_at: ts.toISOString(),
    });
  }

  // Winback campaigns: 28
  for (const c of wbCustomers) {
    const ts = new Date(Date.now() - randomInt(5, 70) * 86400000);
    logs.push({
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      direction: 'outbound',
      type: 'winback_campaign',
      status: Math.random() < 0.89 ? 'sent' : 'failed',
      provider_message_id: `out-winback-${c.id}-${randomInt(1000,9999)}`,
      created_at: ts.toISOString(),
    });
  }

  // Expiry reminders: 18
  for (const c of optedInCustomers.slice(140, 158)) {
    const ts = new Date(Date.now() - randomInt(1, 30) * 86400000);
    logs.push({
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      direction: 'outbound',
      type: 'expiry_reminder',
      status: Math.random() < 0.89 ? 'sent' : 'failed',
      provider_message_id: `out-expiry-${c.id}-${randomInt(1000,9999)}`,
      created_at: ts.toISOString(),
    });
  }

  // Recent activity (last 48h) - make sure there's a rich feed
  const recentCustomers = optedInCustomers.slice(120, 135);
  for (const c of recentCustomers) {
    const ts = new Date(Date.now() - randomInt(1, 47) * 3600000);
    logs.push({
      restaurant_id: RESTAURANT_ID,
      customer_id: c.id,
      direction: randomFrom(['inbound', 'outbound']),
      type: randomFrom(['opt_in_confirm', 'welcome_reminder', 'birthday_campaign', 'winback_campaign']),
      status: Math.random() < 0.88 ? 'sent' : 'failed',
      provider_message_id: `out-recent-${c.id}-${randomInt(10000,99999)}`,
      created_at: ts.toISOString(),
    });
  }

  // Insert logs in batches of 100 to avoid limits
  let totalLogs = 0;
  for (let i = 0; i < logs.length; i += 100) {
    const batch = logs.slice(i, i + 100);
    const { data: insertedLogs, error: logErr } = await supabase
      .from('message_logs')
      .insert(batch)
      .select('id');
    if (logErr) { console.error('Log insert error:', logErr); continue; }
    totalLogs += insertedLogs.length;
  }
  console.log(`✅ Inserted ${totalLogs} message logs`);

  // ── 4. SUMMARY ─────────────────────────────────────────────────────────────
  const redeemedCoupons = insertedCoupons.filter(c => c.status === 'redeemed');
  const sentCoupons = insertedCoupons.filter(c => c.status === 'sent');
  const rate = Math.round((redeemedCoupons.length / insertedCoupons.length) * 100);

  console.log('\n📊 Seeding Complete — Dashboard Preview:');
  console.log('─'.repeat(50));
  console.log(`  Customers inserted   : ${insertedCustomers.length}`);
  console.log(`  Coupons inserted     : ${insertedCoupons.length}`);
  console.log(`    → Redeemed         : ${redeemedCoupons.length}`);
  console.log(`    → Active (sent)    : ${sentCoupons.length}`);
  console.log(`    → Redemption rate  : ${rate}%`);
  console.log(`  Message logs inserted: ${totalLogs}`);
  console.log('─'.repeat(50));
  console.log('\n🎯 Visit http://localhost:3000/dashboard to see the data!');
}

seed().catch(console.error);
