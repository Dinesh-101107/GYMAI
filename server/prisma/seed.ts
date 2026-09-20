import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏋️‍♂️ Starting GymMate AI Seed...');

  // Clean existing tables in reverse dependency order
  try {
    await prisma.booking.deleteMany();
    await prisma.classSlot.deleteMany();
    await prisma.aIInsight.deleteMany();
    await prisma.feeReminder.deleteMany();
    await prisma.attendanceLog.deleteMany();
    await prisma.member.deleteMany();
    await prisma.staff.deleteMany();
    await prisma.user.deleteMany();
    await prisma.gymSettings.deleteMany();
  } catch (e) {
    console.log('Clean skipped or fresh DB.');
  }

  // 1. Create Gym Settings
  await prisma.gymSettings.create({
    data: {
      id: 'default',
      gymName: 'GymMate AI — Iron & Plate Gym',
      reminderLeadTimeDays: 5,
      billingCycle: 'monthly',
      attendanceDropThreshold: 40,
      inactivityThresholdDays: 8,
      autoRemindersEnabled: true,
    },
  });

  const salt = await bcrypt.genSalt(10);
  const staffHash = await bcrypt.hash('AdminPass123!', salt);
  const coachHash = await bcrypt.hash('CoachPass123!', salt);
  const memberHash = await bcrypt.hash('MemberPass123!', salt);

  // 2. Create Staff Users
  const staffUser1 = await prisma.user.create({
    data: {
      email: 'admin@gymmate.ai',
      passwordHash: staffHash,
      role: 'STAFF' as any,
      isEmailVerified: true,
      staff: {
        create: {
          name: 'Sarah Connor',
          designation: 'General Manager',
        },
      },
    },
  });

  const staffUser2 = await prisma.user.create({
    data: {
      email: 'coach@gymmate.ai',
      passwordHash: coachHash,
      role: 'STAFF' as any,
      isEmailVerified: true,
      staff: {
        create: {
          name: 'Marcus Brody',
          designation: 'Head Strength Coach',
        },
      },
    },
  });

  console.log('✅ Staff seeded: admin@gymmate.ai / AdminPass123!');

  // 3. Create Fictional Members
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const membersData = [
    {
      email: 'alex@gymmate.ai',
      name: 'Alex Hunter',
      phone: '+91 98765 43210',
      status: 'active',
      feeAmount: 65.0,
      feeDueOffset: 14, // due in 14 days
      lastPaymentOffset: -16,
      attendanceType: 'regular_high', // 4x a week consistent
    },
    {
      email: 'jordan@gymmate.ai',
      name: 'Jordan Reed',
      phone: '+91 98234 56789',
      status: 'active',
      feeAmount: 55.0,
      feeDueOffset: 8,
      lastPaymentOffset: -22,
      attendanceType: 'drop_risk', // Was 4x/wk, dropped to 0-1x in trailing 2 weeks! >40% drop
    },
    {
      email: 'marcus@gymmate.ai',
      name: 'Marcus Vance',
      phone: '+91 97123 45678',
      status: 'active',
      feeAmount: 75.0,
      feeDueOffset: 12,
      lastPaymentOffset: -18,
      attendanceType: 'evening_powerlifter', // strictly Tue & Thu 18:30
    },
    {
      email: 'elena@gymmate.ai',
      name: 'Elena Rostova',
      phone: '+91 99876 54321',
      status: 'active',
      feeAmount: 60.0,
      feeDueOffset: 2, // DUE IN 2 DAYS! Trigger reminder
      lastPaymentOffset: -28,
      attendanceType: 'regular_moderate',
    },
    {
      email: 'samira@gymmate.ai',
      name: 'Samira Khan',
      phone: '+91 98450 12345',
      status: 'expired',
      feeAmount: 50.0,
      feeDueOffset: -4, // EXPIRED 4 DAYS AGO!
      lastPaymentOffset: -34,
      attendanceType: 'inactive',
    },
    {
      email: 'david@gymmate.ai',
      name: 'David Chen',
      phone: '+91 91234 56789',
      status: 'active',
      feeAmount: 55.0,
      feeDueOffset: 20,
      lastPaymentOffset: -10,
      attendanceType: 'morning_warrior', // 6:00 AM check-ins
    },
    {
      email: 'priya@gymmate.ai',
      name: 'Priya Patel',
      phone: '+91 98901 23456',
      status: 'frozen',
      feeAmount: 50.0,
      feeDueOffset: 30,
      lastPaymentOffset: -60,
      attendanceType: 'none',
    },
    {
      email: 'liam@gymmate.ai',
      name: 'Liam O\'Connor',
      phone: '+91 97654 32109',
      status: 'active',
      feeAmount: 70.0,
      feeDueOffset: 16,
      lastPaymentOffset: -14,
      attendanceType: 'recent_new', // joined 2 weeks ago
    },
    {
      email: 'zoe@gymmate.ai',
      name: 'Zoe Martinez',
      phone: '+91 98111 22334',
      status: 'active',
      feeAmount: 85.0,
      feeDueOffset: 5, // Due in 5 days
      lastPaymentOffset: -25,
      attendanceType: 'high_consistency',
    },
    {
      email: 'lucas@gymmate.ai',
      name: 'Lucas Silva',
      phone: '+91 99223 34455',
      status: 'active',
      feeAmount: 60.0,
      feeDueOffset: 18,
      lastPaymentOffset: -12,
      attendanceType: 'weekend_warrior',
    },
  ];

  const createdMembers = [];

  for (const item of membersData) {
    const feeDueDate = new Date(now.getTime() + item.feeDueOffset * dayMs);
    const lastPaymentDate = new Date(now.getTime() + item.lastPaymentOffset * dayMs);
    const joinDate = new Date(now.getTime() - 65 * dayMs);

    const user = await prisma.user.create({
      data: {
        email: item.email,
        passwordHash: memberHash,
        role: 'MEMBER' as any,
        isEmailVerified: true,
        member: {
          create: {
            name: item.name,
            phone: item.phone,
            membershipStatus: item.status as any,
            feeAmount: item.feeAmount,
            feeDueDate,
            lastPaymentDate,
            joinDate,
          },
        },
      },
      include: {
        member: true,
      },
    });

    if (user.member) {
      createdMembers.push({ member: user.member, attendanceType: item.attendanceType });
    }
  }

  console.log(`✅ ${createdMembers.length} Members created with login password: MemberPass123!`);

  // 4. Generate 2 Months Attendance History
  for (const { member, attendanceType } of createdMembers) {
    const logs = [];

    // 60 days history
    for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date(now.getTime() - dayOffset * dayMs);
      const dayOfWeek = targetDate.getDay(); // 0 = Sun, 6 = Sat
      const isTrailing2Weeks = dayOffset <= 14;

      let willAttend = false;
      let checkInHour = 17;
      let checkInMin = 30;

      switch (attendanceType) {
        case 'regular_high':
          // Mon, Tue, Thu, Fri
          willAttend = [1, 2, 4, 5].includes(dayOfWeek);
          checkInHour = 18;
          checkInMin = Math.floor(Math.random() * 20);
          break;

        case 'drop_risk':
          // Baseline (days 15-60): 4x a week (Mon, Wed, Fri, Sat)
          // Trailing 2 weeks: ONLY attended 1 day total! (> 75% drop)
          if (!isTrailing2Weeks) {
            willAttend = [1, 3, 5, 6].includes(dayOfWeek);
          } else {
            willAttend = dayOffset === 9; // Only once in last 14 days
          }
          checkInHour = 19;
          checkInMin = 15;
          break;

        case 'evening_powerlifter':
          // Strict Tue & Thu 18:30
          willAttend = [2, 4].includes(dayOfWeek);
          checkInHour = 18;
          checkInMin = 30;
          break;

        case 'morning_warrior':
          // Mon, Wed, Fri at 06:15
          willAttend = [1, 3, 5].includes(dayOfWeek);
          checkInHour = 6;
          checkInMin = 15;
          break;

        case 'high_consistency':
          // Mon, Tue, Wed, Thu, Fri
          willAttend = [1, 2, 3, 4, 5].includes(dayOfWeek);
          checkInHour = 12;
          checkInMin = 30;
          break;

        case 'weekend_warrior':
          // Sat & Sun
          willAttend = [0, 6].includes(dayOfWeek);
          checkInHour = 10;
          checkInMin = 0;
          break;

        case 'recent_new':
          // Joined 14 days ago, attends 3x/wk
          if (dayOffset <= 14) {
            willAttend = [1, 3, 5].includes(dayOfWeek);
          }
          checkInHour = 17;
          checkInMin = 45;
          break;

        case 'regular_moderate':
          // 2x a week
          willAttend = [2, 6].includes(dayOfWeek);
          checkInHour = 18;
          checkInMin = 0;
          break;

        default:
          willAttend = false;
      }

      if (willAttend) {
        const checkIn = new Date(targetDate);
        checkIn.setHours(checkInHour, checkInMin, 0, 0);

        const checkOut = new Date(checkIn);
        checkOut.setMinutes(checkIn.getMinutes() + 55 + Math.floor(Math.random() * 25));

        logs.push({
          memberId: member.id,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          date: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
        });
      }
    }

    if (logs.length > 0) {
      await prisma.attendanceLog.createMany({ data: logs });
    }
  }

  console.log('✅ 2 Months Attendance History seeded with realistic patterns.');

  // 5. Seed Class Slots (for Concurrency Booking demo)
  const tomorrow = new Date(now.getTime() + 1 * dayMs);
  const slotTimes = [
    { hour: 7, name: 'Iron Grip HIIT Challenge', cap: 10, cat: 'High Intensity', booked: 8 },
    { hour: 17, name: 'Olympic Barbell & Deadlift Club', cap: 6, cat: 'Powerlifting', booked: 5 }, // 1 spot left!
    { hour: 18, name: 'CrossFit WOD: Plate Rush', cap: 12, cat: 'Strength & Conditioning', booked: 12 }, // FULL!
    { hour: 19, name: 'Recovery, Core & Mobility Flow', cap: 15, cat: 'Recovery', booked: 4 },
  ];

  const classSlots = [];
  for (const st of slotTimes) {
    const start = new Date(tomorrow);
    start.setHours(st.hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(st.hour + 1, 0, 0, 0);

    const slot = await prisma.classSlot.create({
      data: {
        name: st.name,
        capacity: st.cap,
        bookedCount: st.booked,
        startTime: start,
        endTime: end,
        category: st.cat,
        instructor: 'Coach Marcus',
        version: 0,
      },
    });
    classSlots.push(slot);
  }

  console.log('✅ Class Slots seeded (including near-full and full slots).');

  // 6. Seed Reminders & AI Insights
  const jordan = createdMembers.find(m => m.attendanceType === 'drop_risk')?.member;
  if (jordan) {
    await prisma.aIInsight.create({
      data: {
        memberId: jordan.id,
        type: 'drop_risk',
        observation: 'Attendance dropped by 75% in the trailing 2 weeks (down from 4 visits/wk to 1 visit/wk).',
        suggestedAction: 'Send a friendly motivational touchpoint with zero guilt, highlighting their favorite 7:00 PM session.',
        confidence: 0.88,
      },
    });
  }

  const marcus = createdMembers.find(m => m.attendanceType === 'evening_powerlifter')?.member;
  if (marcus) {
    await prisma.aIInsight.create({
      data: {
        memberId: marcus.id,
        type: 'optimal_time',
        observation: 'Member shows 92% adherence to Tuesday & Thursday 6:30 PM evening training.',
        suggestedAction: 'Auto-reserve or notify about upcoming Olympic Barbell lifting spots.',
        confidence: 0.94,
      },
    });
  }

  const elena = createdMembers.find(m => m.member.name === 'Elena Rostova')?.member;
  if (elena) {
    await prisma.feeReminder.create({
      data: {
        memberId: elena.id,
        channel: 'email' as any,
        message: 'Hey Elena! Just a quick heads-up: your GymMate membership renews in 2 days ($60.00). Tap here to keep your workouts rolling.',
        status: 'sent' as any,
      },
    });
  }

  console.log('🏁 GymMate AI Database Seed Complete!');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
