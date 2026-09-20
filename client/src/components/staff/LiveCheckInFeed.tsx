import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext.js';
import api from '../../services/api.js';
import ChalkBadge from '../common/ChalkBadge.js';
import { formatIndianPhone } from '../../utils/phone.js';
import { QrCode, UserCheck, Radio, Wifi, WifiOff } from 'lucide-react';

interface FeedItem {
  id: string;
  memberId: string;
  memberName: string;
  checkInTime: string;
  membershipStatus: string;
  phone?: string;
  method?: 'QR_SCAN' | 'MANUAL';
}

export const LiveCheckInFeed: React.FC = () => {
  const { isConnected, latestCheckIn } = useSocket();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial load of recent check-ins
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get('/attendance/recent');
        const formatted: FeedItem[] = res.data.map((l: any) => ({
          id: l.id,
          memberId: l.memberId,
          memberName: l.member.name,
          checkInTime: l.checkInTime,
          membershipStatus: l.member.membershipStatus,
          phone: l.member.phone,
          method: 'QR_SCAN',
        }));
        setFeed(formatted);
      } catch (err) {
        console.error('Failed to load recent attendance', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  // Prepend live check-ins as they stream from WebSocket
  useEffect(() => {
    if (latestCheckIn) {
      setFeed((prev) => {
        // Prevent immediate duplicates
        if (prev.some((item) => item.id === latestCheckIn.id)) return prev;
        return [latestCheckIn, ...prev.slice(0, 29)];
      });
    }
  }, [latestCheckIn]);

  return (
    <div className="bg-gym-card rounded-xl border border-gym-border shadow-plate overflow-hidden">
      {/* Header with real-time socket connection badge */}
      <div className="p-4 border-b border-gym-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-gym-plate text-gym-red border border-white/5">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Live Front-Desk Check-In Feed
            </h3>
            <p className="text-xs text-gym-muted">
              Auto-updating via WebSocket without page refresh
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-mono">
          {isConnected ? (
            <span className="inline-flex items-center space-x-1 text-gym-greenBright bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              <Wifi className="w-3 h-3" />
              <span>LIVE</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
              <WifiOff className="w-3 h-3" />
              <span>OFFLINE</span>
            </span>
          )}
        </div>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-gym-border/40 max-h-[500px] overflow-y-auto">
        {feed.length === 0 ? (
          <div className="py-12 text-center text-gym-muted text-sm">
            Waiting for member QR scans or manual check-ins...
          </div>
        ) : (
          feed.map((item, idx) => {
            const isLatest = idx === 0 && latestCheckIn?.id === item.id;
            const time = new Date(item.checkInTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={item.id}
                className={`p-3.5 flex items-center justify-between transition-all ${
                  isLatest
                    ? 'bg-gym-red/10 border-l-4 border-gym-red animate-pulse'
                    : 'hover:bg-gym-plate/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      item.method === 'MANUAL'
                        ? 'bg-gym-plate border-gym-border text-gym-subtext'
                        : 'bg-red-950/40 border-gym-red/40 text-gym-red shadow-sm'
                    }`}
                  >
                    {item.method === 'MANUAL' ? (
                      <UserCheck className="w-4 h-4" />
                    ) : (
                      <QrCode className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-white text-sm flex items-center space-x-2">
                      <span>{item.memberName}</span>
                      <ChalkBadge status={item.membershipStatus} size="sm" />
                    </div>
                    <div className="text-[11px] text-gym-muted flex items-center space-x-2">
                      <span className="font-mono">{formatIndianPhone(item.phone)}</span>
                      <span>·</span>
                      <span className="uppercase text-[10px] font-bold text-zinc-400">
                        {item.method === 'MANUAL' ? 'Desk Manual' : 'QR Scan'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs font-semibold text-gym-subtext bg-gym-plate px-2 py-1 rounded border border-gym-border/60">
                    {time}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveCheckInFeed;
