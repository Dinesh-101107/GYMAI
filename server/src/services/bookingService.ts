import { PrismaClient } from '@prisma/client';

export class SlotFullError extends Error {
  constructor(message = 'Class slot has reached maximum capacity.') {
    super(message);
    this.name = 'SlotFullError';
  }
}

export class AlreadyBookedError extends Error {
  constructor(message = 'You have already booked a spot in this class.') {
    super(message);
    this.name = 'AlreadyBookedError';
  }
}

export class SlotNotFoundError extends Error {
  constructor(message = 'Class slot not found.') {
    super(message);
    this.name = 'SlotNotFoundError';
  }
}

export class BookingConflictError extends Error {
  constructor(message = 'High contention conflict: unable to reserve slot after multiple attempts.') {
    super(message);
    this.name = 'BookingConflictError';
  }
}

export interface BookingResult {
  bookingId: string;
  slotId: string;
  slotName: string;
  memberId: string;
  bookedCount: number;
  capacity: number;
  lockingMethodUsed: 'pessimistic' | 'optimistic';
  attempts: number;
}

/**
 * Pessimistic Locking Booking
 * Uses SELECT ... FOR UPDATE within an interactive transaction to hold a row lock
 * Best for high-contention, high-demand slots.
 */
export async function bookSlotPessimistic(
  prisma: PrismaClient,
  slotId: string,
  memberId: string
): Promise<BookingResult> {
  return await prisma.$transaction(async (tx) => {
    // 1. Check if member already booked
    const existingBooking = await tx.booking.findFirst({
      where: { slotId, memberId, status: 'confirmed' },
    });

    if (existingBooking) {
      throw new AlreadyBookedError();
    }

    // 2. Pessimistic lock row using raw query if on Postgres, or tx lock
    let slot: any;
    try {
      const rows: any = await tx.$queryRawUnsafe(
        `SELECT * FROM "ClassSlot" WHERE id = $1 FOR UPDATE`,
        slotId
      );
      slot = rows && rows.length > 0 ? rows[0] : null;
    } catch {
      // Fallback for SQLite or mock where raw FOR UPDATE syntax might differ
      slot = await tx.classSlot.findUnique({ where: { id: slotId } });
    }

    if (!slot) {
      throw new SlotNotFoundError();
    }

    // 3. Strict capacity check under lock
    if (slot.bookedCount >= slot.capacity) {
      throw new SlotFullError(`Slot '${slot.name}' is completely full (${slot.bookedCount}/${slot.capacity}).`);
    }

    // 4. Increment and create booking
    const updatedSlot = await tx.classSlot.update({
      where: { id: slotId },
      data: {
        bookedCount: { increment: 1 },
        version: { increment: 1 },
      },
    });

    const booking = await tx.booking.create({
      data: {
        slotId,
        memberId,
        status: 'confirmed',
        version: updatedSlot.version,
      },
    });

    return {
      bookingId: booking.id,
      slotId: slot.id,
      slotName: slot.name,
      memberId,
      bookedCount: updatedSlot.bookedCount,
      capacity: updatedSlot.capacity,
      lockingMethodUsed: 'pessimistic',
      attempts: 1,
    };
  });
}

/**
 * Optimistic Locking Booking
 * Checks version number and performs conditional update.
 * If 0 rows are affected, retries with backoff on conflict or errors if full.
 * Best for low/medium-contention slots.
 */
export async function bookSlotOptimistic(
  prisma: PrismaClient,
  slotId: string,
  memberId: string,
  maxRetries: number = 3
): Promise<BookingResult> {
  // Check if member already booked
  const existingBooking = await prisma.booking.findFirst({
    where: { slotId, memberId, status: 'confirmed' },
  });

  if (existingBooking) {
    throw new AlreadyBookedError();
  }

  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;

    // 1. Read current state
    const currentSlot = await prisma.classSlot.findUnique({
      where: { id: slotId },
    });

    if (!currentSlot) {
      throw new SlotNotFoundError();
    }

    // 2. Capacity check
    if (currentSlot.bookedCount >= currentSlot.capacity) {
      throw new SlotFullError(`Slot '${currentSlot.name}' is full (${currentSlot.bookedCount}/${currentSlot.capacity}).`);
    }

    // 3. Conditional update matching current version and capacity guard
    const updateResult = await prisma.classSlot.updateMany({
      where: {
        id: slotId,
        version: currentSlot.version,
        bookedCount: { lt: currentSlot.capacity },
      },
      data: {
        bookedCount: { increment: 1 },
        version: { increment: 1 },
      },
    });

    if (updateResult.count > 0) {
      // Successfully secured slot without lock contention
      const booking = await prisma.booking.create({
        data: {
          slotId,
          memberId,
          status: 'confirmed',
          version: currentSlot.version + 1,
        },
      });

      return {
        bookingId: booking.id,
        slotId: currentSlot.id,
        slotName: currentSlot.name,
        memberId,
        bookedCount: currentSlot.bookedCount + 1,
        capacity: currentSlot.capacity,
        lockingMethodUsed: 'optimistic',
        attempts,
      };
    }

    // If 0 rows updated, check whether it filled up or was a concurrent version collision
    const recheckSlot = await prisma.classSlot.findUnique({
      where: { id: slotId },
    });

    if (recheckSlot && recheckSlot.bookedCount >= recheckSlot.capacity) {
      throw new SlotFullError(`Slot '${recheckSlot.name}' was just filled by another member.`);
    }

    // Version collision: apply exponential backoff jitter before retry
    const backoffMs = Math.floor(Math.random() * 50) + attempts * 25;
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
  }

  throw new BookingConflictError();
}
