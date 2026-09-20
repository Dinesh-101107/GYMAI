import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '../src/config/db.js';
import {
  bookSlotPessimistic,
  bookSlotOptimistic,
  SlotFullError,
  AlreadyBookedError,
} from '../src/services/bookingService.js';

describe('Class-Slot Booking Concurrency & Guard Safety', () => {
  let testSlotId: string;
  let member1Id: string;
  let member2Id: string;

  beforeEach(async () => {
    // Create members and slot for test
    const slot = await prisma.classSlot.create({
      data: {
        name: 'Concurrency Test Class',
        capacity: 1, // Only 1 spot available!
        bookedCount: 0,
        startTime: new Date(Date.now() + 24 * 3600 * 1000),
        endTime: new Date(Date.now() + 25 * 3600 * 1000),
        version: 0,
      },
    });
    testSlotId = slot.id;

    const m1 = await prisma.member.findFirst({ where: { name: 'Alex Hunter' } });
    const m2 = await prisma.member.findFirst({ where: { name: 'Jordan Reed' } });

    member1Id = m1?.id || 'm1';
    member2Id = m2?.id || 'm2';

    // Clean any prior bookings for testSlot
    await prisma.booking.deleteMany({ where: { slotId: testSlotId } });
  });

  it('should book successfully with optimistic locking when spot is open', async () => {
    const result = await bookSlotOptimistic(prisma, testSlotId, member1Id);
    expect(result.slotId).toBe(testSlotId);
    expect(result.bookedCount).toBe(1);
    expect(result.capacity).toBe(1);
    expect(result.lockingMethodUsed).toBe('optimistic');
  });

  it('should prevent double-booking by the same member (AlreadyBookedError)', async () => {
    await bookSlotOptimistic(prisma, testSlotId, member1Id);
    await expect(bookSlotOptimistic(prisma, testSlotId, member1Id)).rejects.toThrow(AlreadyBookedError);
  });

  it('should reject second booking with SlotFullError when capacity reached', async () => {
    // Member 1 books the only spot
    await bookSlotOptimistic(prisma, testSlotId, member1Id);

    // Member 2 tries to book full slot
    await expect(bookSlotOptimistic(prisma, testSlotId, member2Id)).rejects.toThrow(SlotFullError);
  });

  it('should support pessimistic locking and reject overbooking', async () => {
    // Create fresh slot
    const slotPessimistic = await prisma.classSlot.create({
      data: {
        name: 'Pessimistic Test Class',
        capacity: 1,
        bookedCount: 0,
        startTime: new Date(Date.now() + 30 * 3600 * 1000),
        endTime: new Date(Date.now() + 31 * 3600 * 1000),
        version: 0,
      },
    });

    // Member 1 takes slot
    const res = await bookSlotPessimistic(prisma, slotPessimistic.id, member1Id);
    expect(res.bookedCount).toBe(1);

    // Member 2 rejected with SlotFullError
    await expect(bookSlotPessimistic(prisma, slotPessimistic.id, member2Id)).rejects.toThrow(SlotFullError);

    // Cleanup
    await prisma.booking.deleteMany({ where: { slotId: slotPessimistic.id } });
    await prisma.classSlot.delete({ where: { id: slotPessimistic.id } });
  });
});
