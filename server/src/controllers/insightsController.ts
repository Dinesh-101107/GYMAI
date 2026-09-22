import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { buildInsight } from '../services/aiInsightEngine.js';

export async function getMemberInsight(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const isStaffOrAdmin = req.user?.role === 'STAFF' || req.user?.role === 'ADMIN';
    const targetMemberId = isStaffOrAdmin ? id : req.user?.memberId;

    if (!targetMemberId) {
      res.status(400).json({ error: 'Member ID required' });
      return;
    }

    const member = await prisma.member.findUnique({
      where: { id: targetMemberId },
      include: {
        attendanceLogs: {
          orderBy: { checkInTime: 'desc' },
          take: 70,
        },
        aiInsights: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    // Run pure AI insight engine
    const computed = buildInsight(
      {
        id: member.id,
        name: member.name,
        membershipStatus: member.membershipStatus,
        feeDueDate: member.feeDueDate,
      },
      member.attendanceLogs
    );

    // If no recent insight exists in DB (or if older than 24 hours), persist it
    const lastSaved = member.aiInsights[0];
    const isStale = !lastSaved || (Date.now() - new Date(lastSaved.createdAt).getTime()) > 24 * 60 * 60 * 1000;

    let insightRecord = lastSaved;
    if (isStale) {
      insightRecord = await prisma.aIInsight.create({
        data: {
          memberId: member.id,
          type: computed.type,
          observation: computed.observation,
          suggestedAction: computed.suggestedAction,
          confidence: computed.confidence,
        },
      });
    }

    res.json({
      memberId: member.id,
      memberName: member.name,
      ...computed,
      dbId: insightRecord?.id,
      createdAt: insightRecord?.createdAt || new Date(),
    });
  } catch (error) {
    console.error('Error fetching member insight:', error);
    res.status(500).json({ error: 'Failed to compute AI insights.' });
  }
}

export async function recomputeAllInsights(req: Request, res: Response): Promise<void> {
  try {
    const members = await prisma.member.findMany({
      include: {
        attendanceLogs: {
          orderBy: { checkInTime: 'desc' },
          take: 70,
        },
      },
    });

    const results = [];

    for (const m of members) {
      const computed = buildInsight(
        {
          id: m.id,
          name: m.name,
          membershipStatus: m.membershipStatus,
          feeDueDate: m.feeDueDate,
        },
        m.attendanceLogs
      );

      const saved = await prisma.aIInsight.create({
        data: {
          memberId: m.id,
          type: computed.type,
          observation: computed.observation,
          suggestedAction: computed.suggestedAction,
          confidence: computed.confidence,
        },
      });

      results.push({
        memberId: m.id,
        memberName: m.name,
        insight: saved,
      });
    }

    res.json({
      message: `Recomputed AI insights for ${results.length} members.`,
      insights: results,
    });
  } catch (error) {
    console.error('Error recomputing insights:', error);
    res.status(500).json({ error: 'Failed to recompute insights.' });
  }
}
