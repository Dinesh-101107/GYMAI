import { Request, Response } from 'express';
import prisma from '../config/db.js';
import {
  bookSlotPessimistic,
  bookSlotOptimistic,
  SlotFullError,
  AlreadyBookedError,
  SlotNotFoundError,
  BookingConflictError,
} from '../services/bookingService.js';

export async function getClassSlots(req: Request, res: Response): Promise<void> {
  try {
    const memberId = req.user?.memberId;

    const slots = await prisma.classSlot.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        bookings: {
          select: {
            id: true,
            memberId: true,
            status: true,
          },
        },
      },
    });

    const formatted = slots.map((s) => {
      const isBookedByMe = memberId
        ? s.bookings.some((b) => b.memberId === memberId && b.status === 'confirmed')
        : false;

      return {
        id: s.id,
        name: s.name,
        capacity: s.capacity,
        bookedCount: s.bookedCount,
        spotsRemaining: Math.max(0, s.capacity - s.bookedCount),
        isFull: s.bookedCount >= s.capacity,
        startTime: s.startTime,
        endTime: s.endTime,
        category: s.category,
        instructor: s.instructor,
        version: s.version,
        isBookedByMe,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching class slots:', error);
    res.status(500).json({ error: 'Failed to retrieve class slots.' });
  }
}

export async function createClassSlot(req: Request, res: Response): Promise<void> {
  try {
    const { name, capacity, startTime, endTime, category, instructor } = req.body;

    if (!name || !capacity || !startTime || !endTime) {
      res.status(400).json({ error: 'name, capacity, startTime, and endTime are required.' });
      return;
    }

    const slot = await prisma.classSlot.create({
      data: {
        name,
        capacity: Number(capacity),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        category: category || 'Strength & Conditioning',
        instructor: instructor || 'Staff Coach',
      },
    });

    res.status(201).json({ message: 'Class slot created successfully', slot });
  } catch (error) {
    console.error('Error creating class slot:', error);
    res.status(500).json({ error: 'Failed to create class slot.' });
  }
}

export async function bookSlot(req: Request, res: Response): Promise<void> {
  try {
    const { slotId, lockingType = 'optimistic', memberIdOverride } = req.body;
    const memberId = req.user?.role === 'STAFF' && memberIdOverride
      ? memberIdOverride
      : req.user?.memberId;

    if (!memberId) {
      res.status(403).json({ error: 'Member profile required to book a class slot.' });
      return;
    }

    if (!slotId) {
      res.status(400).json({ error: 'slotId is required.' });
      return;
    }

    let result;
    if (lockingType === 'pessimistic') {
      result = await bookSlotPessimistic(prisma, slotId, memberId);
    } else {
      result = await bookSlotOptimistic(prisma, slotId, memberId);
    }

    res.status(201).json({
      message: `Spot confirmed in '${result.slotName}'!`,
      ...result,
    });
  } catch (err: any) {
    if (err instanceof SlotFullError) {
      res.status(409).json({ error: err.message, code: 'SLOT_FULL' });
      return;
    }
    if (err instanceof AlreadyBookedError) {
      res.status(400).json({ error: err.message, code: 'ALREADY_BOOKED' });
      return;
    }
    if (err instanceof SlotNotFoundError) {
      res.status(404).json({ error: err.message, code: 'SLOT_NOT_FOUND' });
      return;
    }
    if (err instanceof BookingConflictError) {
      res.status(409).json({ error: err.message, code: 'BOOKING_CONFLICT' });
      return;
    }

    console.error('Booking execution error:', err);
    res.status(500).json({ error: 'Unexpected error occurred during booking.' });
  }
}

export async function cancelBooking(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const memberId = req.user?.memberId;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (req.user?.role === 'MEMBER' && booking.memberId !== memberId) {
      res.status(403).json({ error: 'Access denied to cancel this booking' });
      return;
    }

    await prisma.$transaction([
      prisma.booking.delete({ where: { id } }),
      prisma.classSlot.update({
        where: { id: booking.slotId },
        data: {
          bookedCount: { decrement: 1 },
          version: { increment: 1 },
        },
      }),
    ]);

    res.json({ message: 'Booking successfully cancelled. Slot reopened.' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
}
