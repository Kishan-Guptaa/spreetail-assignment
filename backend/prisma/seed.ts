import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Clear existing records
  await prisma.auditLog.deleteMany({});
  await prisma.exchangeRate.deleteMany({});
  await prisma.importIssue.deleteMany({});
  await prisma.importSession.deleteMany({});
  await prisma.settlement.deleteMany({});
  await prisma.expenseParticipant.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Default Exchange Rates
  const rates = [
    { fromCurrency: 'USD', toCurrency: 'INR', rate: 83.5 },
    { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.93 },
    { fromCurrency: 'INR', toCurrency: 'USD', rate: 0.012 },
    { fromCurrency: 'INR', toCurrency: 'EUR', rate: 0.011 },
    { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.08 },
    { fromCurrency: 'EUR', toCurrency: 'INR', rate: 90.0 }
  ];

  for (const r of rates) {
    await prisma.exchangeRate.create({ data: r });
  }
  console.log('✔ Exchange rates seeded.');

  // 3. Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const userPasswordHash = await bcrypt.hash('password123', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@expenseflow.com',
      passwordHash: adminPasswordHash,
      name: 'System Administrator',
      role: 'ADMIN',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    }
  });

  const john = await prisma.user.create({
    data: {
      email: 'john@example.com',
      passwordHash: userPasswordHash,
      name: 'John Doe',
      role: 'USER',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
    }
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      passwordHash: userPasswordHash,
      name: 'Sarah Connor',
      role: 'USER',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
    }
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      passwordHash: userPasswordHash,
      name: 'Bob Builder',
      role: 'USER',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
    }
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      passwordHash: userPasswordHash,
      name: 'Alice Wonderland',
      role: 'USER',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
    }
  });

  console.log('✔ Mock users seeded.');

  // 4. Create Group
  const group = await prisma.group.create({
    data: {
      name: 'Euro Trip 2026',
      description: 'Shared expenses for the summer backpacking tour across Europe.',
      baseCurrency: 'EUR',
      createdById: john.id
    }
  });

  // 5. Add Members (Dynamic membership periods)
  const memberJohn = await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: john.id,
      email: john.email,
      name: john.name,
      joinDate: new Date('2026-01-01T00:00:00Z'),
      status: 'ACTIVE'
    }
  });

  const memberSarah = await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: sarah.id,
      email: sarah.email,
      name: sarah.name,
      joinDate: new Date('2026-01-01T00:00:00Z'),
      status: 'ACTIVE'
    }
  });

  const memberBob = await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: bob.id,
      email: bob.email,
      name: bob.name,
      joinDate: new Date('2026-02-15T00:00:00Z'), // Bob joined mid-trip
      status: 'ACTIVE'
    }
  });

  const memberAlice = await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: alice.id,
      email: alice.email,
      name: alice.name,
      joinDate: new Date('2026-01-01T00:00:00Z'),
      leaveDate: new Date('2026-03-31T23:59:59Z'), // Alice left early
      status: 'INACTIVE'
    }
  });

  console.log('✔ Group members invited with active dates.');

  // 6. Create Expenses
  // Expense 1: Accommodations (Paid by John, Split Equally among John, Sarah, Alice - Bob hadn't joined yet)
  const exp1 = await prisma.expense.create({
    data: {
      groupId: group.id,
      title: 'Airbnb Berlin',
      description: 'Cosy apartment in Berlin city center',
      amount: 300.0,
      currency: 'EUR',
      amountInBase: 300.0, // EUR is group base currency
      date: new Date('2026-01-10T12:00:00Z'),
      paidById: memberJohn.id,
      splitType: 'EQUAL'
    }
  });

  const membersExp1 = [memberJohn, memberSarah, memberAlice];
  for (const m of membersExp1) {
    await prisma.expenseParticipant.create({
      data: {
        expenseId: exp1.id,
        memberId: m.id,
        shareValue: 100 / membersExp1.length,
        calculatedShare: 100.0,
        calculatedShareInBase: 100.0
      }
    });
  }

  // Expense 2: Dinner in Prague (Paid by Sarah in Czech currency or EUR. Let's record in USD: $150. Split Equal all 4 members)
  const exp2 = await prisma.expense.create({
    data: {
      groupId: group.id,
      title: 'Prague Castle Dinner',
      description: 'Traditional meals with beer',
      amount: 150.0,
      currency: 'USD',
      amountInBase: 139.5, // 150 * 0.93 = 139.5 EUR
      date: new Date('2026-03-01T20:00:00Z'),
      paidById: memberSarah.id,
      splitType: 'EQUAL'
    }
  });

  const membersExp2 = [memberJohn, memberSarah, memberBob, memberAlice]; // Bob is active on Mar 1st
  for (const m of membersExp2) {
    await prisma.expenseParticipant.create({
      data: {
        expenseId: exp2.id,
        memberId: m.id,
        shareValue: 100 / membersExp2.length,
        calculatedShare: 37.5, // 150 / 4
        calculatedShareInBase: 34.875 // 139.5 / 4
      }
    });
  }

  // Expense 3: Train Ticket (Paid by Bob in INR: ₹10,000. Bob and John split 60/40)
  const exp3 = await prisma.expense.create({
    data: {
      groupId: group.id,
      title: 'Eurail Pass',
      description: 'Train tickets from Germany to France',
      amount: 10000.0,
      currency: 'INR',
      amountInBase: 110.0, // 10000 * 0.011 = 110 EUR
      date: new Date('2026-04-10T09:00:00Z'),
      paidById: memberBob.id,
      splitType: 'PERCENTAGE'
    }
  });

  // Bob: 60%, John: 40% (Alice not active, Sarah didn't travel)
  await prisma.expenseParticipant.create({
    data: {
      expenseId: exp3.id,
      memberId: memberBob.id,
      shareValue: 60.0,
      calculatedShare: 6000.0,
      calculatedShareInBase: 66.0
    }
  });
  await prisma.expenseParticipant.create({
    data: {
      expenseId: exp3.id,
      memberId: memberJohn.id,
      shareValue: 40.0,
      calculatedShare: 4000.0,
      calculatedShareInBase: 44.0
    }
  });

  console.log('✔ Mock expenses seeded.');

  // 7. Settlements
  // Sarah settles with John: Sarah pays €50 to John
  await prisma.settlement.create({
    data: {
      groupId: group.id,
      payerId: memberSarah.id,
      payeeId: memberJohn.id,
      amount: 50.0,
      currency: 'EUR',
      amountInBase: 50.0,
      date: new Date('2026-03-15T15:00:00Z'),
      notes: 'Partial payback for Berlin Airbnb'
    }
  });

  console.log('✔ Settlements recorded.');

  // 8. Audit logs
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_BOOT',
      details: 'Database initialized and seeded with mock information.'
    }
  });

  console.log('Seeding Complete! 🎉');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
