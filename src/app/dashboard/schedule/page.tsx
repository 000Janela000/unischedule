"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/hooks/use-schedule";
import { useUserGroup } from "@/hooks/use-user-group";
import { Skeleton } from "@/components/ui/skeleton";

type LectureType = "lecture" | "seminar" | "lab" | "unknown";

const typeColors: Record<LectureType, string> = {
  lecture: "border-l-primary",
  seminar: "border-l-accent",
  lab: "border-l-chart-3",
  unknown: "border-l-muted-foreground",
};

function getTodayIndex(): number {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return -1;
  return day - 1;
}

export default function SchedulePage() {
  const [todayIndex, setTodayIndex] = useState<number>(-1);
  const { group } = useUserGroup();
  const { weekSchedule, loading } = useSchedule();

  useEffect(() => {
    setTodayIndex(getTodayIndex());
  }, []);

  const totalLectures = weekSchedule.reduce((acc, day) => acc + day.lectures.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen p-4 lg:p-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64 flex-1 min-w-[160px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col gap-3 px-4 py-4 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground lg:text-2xl">კვირის ცხრილი</h1>
            {group?.groupCode && (
              <Badge variant="secondary" className="font-mono text-xs">
                {group.groupCode.toUpperCase()}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {totalLectures} ლექცია
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-4 lg:px-8">
        <div className="overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          <div className="flex gap-3 min-w-max lg:min-w-0">
            {weekSchedule.map((day, index) => (
              <div
                key={day.dayOfWeek}
                className={cn(
                  "flex-1 min-w-[160px] lg:min-w-0 rounded-xl border border-border bg-card p-3",
                  todayIndex === index && "bg-primary/5 border-primary/30"
                )}
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                  <h2
                    className={cn(
                      "font-medium text-sm",
                      todayIndex === index ? "text-primary" : "text-foreground"
                    )}
                  >
                    {day.dayNameKa}
                  </h2>
                  {day.lectures.length > 0 && (
                    <Badge
                      variant={todayIndex === index ? "default" : "secondary"}
                      className="text-xs h-5 px-1.5"
                    >
                      {day.lectures.length}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {day.lectures.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-lg">—</div>
                  ) : (
                    day.lectures.map((lecture) => (
                      <div
                        key={lecture.id}
                        className={cn(
                          "rounded-lg border border-border bg-background p-2.5",
                          "hover:border-primary/40 hover:bg-primary/5 transition-colors",
                          "border-l-[3px]",
                          typeColors[lecture.type as LectureType] || typeColors.unknown
                        )}
                      >
                        <p className="font-mono text-[10px] text-muted-foreground mb-1">
                          {lecture.startTime}–{lecture.endTime}
                        </p>
                        <p className="font-medium text-sm text-foreground line-clamp-2 leading-tight mb-1">
                          {lecture.subject}
                        </p>
                        {lecture.lecturer && (
                          <p className="text-[10px] text-muted-foreground mb-1 truncate">
                            {lecture.lecturer}
                          </p>
                        )}
                        {lecture.room && (
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {lecture.room}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span>ლექცია</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-accent" />
            <span>სემინარი</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-chart-3" />
            <span>ლაბორატორია</span>
          </div>
        </div>
      </div>
    </div>
  );
}
