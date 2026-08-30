import React from "react";
import { Card, Button, Skeleton } from "../../components/ui";
import { EventClassBadge, AnomalyBadge } from "../events/EventClassBadge";
import { PrimaryClass, SubClass } from "../../api/types";
import { Flame, ArrowRight } from "lucide-react";

export interface RecentEventItem {
  id: string;
  primary_class: PrimaryClass | string;
  sub_class: SubClass | string;
  facility_name: string | null;
  latitude: number;
  longitude: number;
  frp: number | null;
  confidence_score: number;
  is_anomalous: boolean;
  created_at: string;
}

export interface RecentEventsPanelProps {
  events: RecentEventItem[];
  isLoading: boolean;
  onNavigate: (route: string) => void;
}

export const RecentEventsPanel: React.FC<RecentEventsPanelProps> = ({
  events,
  isLoading,
  onNavigate,
}) => {
  return (
    <Card className="p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-brand-orange" />
          <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-wider">
            Recent Thermal Events
          </h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("/events")}
          className="text-[11px] font-mono text-text-muted hover:text-text-primary px-2"
          rightIcon={<ArrowRight className="w-3 h-3" />}
        >
          All Events
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2.5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="p-6 text-center text-xs font-mono text-text-muted rounded-lg bg-surface-2/40 border border-border-subtle">
          NO RECENT THERMAL EVENTS
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div className="space-y-2">
          {events.slice(0, 5).map((evt) => (
            <div
              key={evt.id}
              onClick={() => onNavigate(`/events/${evt.id}`)}
              className="p-3 rounded-lg bg-surface-2/50 border border-border-subtle transition-all hover:bg-surface-2 cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-text-primary">
                  EVT-{evt.id.substring(0, 6).toUpperCase()}
                </span>
                <div className="flex items-center gap-1.5">
                  <EventClassBadge
                    primaryClass={evt.primary_class as PrimaryClass}
                    subClass={evt.sub_class as SubClass}
                    size="sm"
                  />
                  <AnomalyBadge isAnomalous={evt.is_anomalous} size="sm" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>
                  {evt.facility_name ? (
                    <span className="text-text-secondary truncate max-w-[140px] inline-block align-bottom">
                      {evt.facility_name}
                    </span>
                  ) : (
                    "Natural / Agricultural"
                  )}
                </span>
                <span className="text-brand-orange font-semibold">
                  {evt.frp ? `${evt.frp} MW` : "Telemetry"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

