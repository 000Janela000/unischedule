"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Download, Clock, User, Users, CalendarPlus, ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExams } from "@/hooks/use-exams";
import { useUserGroup } from "@/hooks/use-user-group";
import { Skeleton } from "@/components/ui/skeleton";
import type { Exam, ExamType } from "@/types";

const examTypeConfig = {
  midterm: { label: "შუალედური", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30", border: "border-l-blue-500" },
  final: { label: "ფინალური", color: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30", border: "border-l-red-500" },
  quiz: { label: "ქვიზი", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30", border: "border-l-purple-500" },
  retake: { label: "აღდგენა", color: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30", border: "border-l-gray-500" },
  additional: { label: "დამატებითი", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", border: "border-l-amber-500" },
  unknown: { label: "სხვა", color: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30", border: "border-l-gray-500" },
} as const;

type ExamTypeKey = keyof typeof examTypeConfig;

const georgianMonths = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];
const georgianDays = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];

function formatGeorgianDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getDate()} ${georgianMonths[date.getMonth()]}, ${georgianDays[date.getDay()]}`;
}

function getCountdown(dateStr: string, time: string): { text: string; isUrgent: boolean } {
  const now = new Date();
  const examDate = new Date(dateStr);
  const diffMs = examDate.getTime() - new Date(now.toDateString()).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "დასრულდა", isUrgent: false };
  if (diffDays === 0) return { text: `დღეს ${time}`, isUrgent: true };
  if (diffDays === 1) return { text: "ხვალ", isUrgent: true };
  return { text: `${diffDays} დღეში`, isUrgent: false };
}

function ExamCard({ exam, index }: { exam: Exam; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const type = (exam.examType as ExamTypeKey) || "unknown";
  const config = examTypeConfig[type] || examTypeConfig.unknown;
  const countdown = getCountdown(exam.date, exam.startTime);

  return (
    <Card
      className={cn(
        "overflow-hidden border-l-4 transition-all duration-300 cursor-pointer",
        config.border,
        countdown.isUrgent && "ring-2 ring-accent/50 bg-accent/5",
        "animate-fade-in"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted/50">
            <Clock className="size-4 text-muted-foreground" />
            <span className="mt-0.5 font-mono text-sm font-medium text-foreground">{exam.startTime}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{exam.subjectClean || exam.subject}</h3>
              <Badge variant="outline" className={cn("text-xs", config.color)}>
                {exam.examTypeLabel || config.label}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className={cn("font-medium", countdown.isUrgent ? "text-accent" : "text-foreground/70")}>
                {countdown.text}
              </span>
            </div>
          </div>
          <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
        </div>

        <div className={cn("grid transition-all duration-300 ease-in-out", isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0")}>
          <div className="overflow-hidden">
            <div className="border-t border-border pt-4 space-y-3">
              {exam.lecturers.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">ლექტორი:</span>
                  <span className="font-medium text-foreground">{exam.lecturers.join(", ")}</span>
                </div>
              )}
              {exam.groups.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">ჯგუფი:</span>
                  <span className="font-medium text-foreground">{exam.groups.join(", ")}</span>
                  {exam.studentCount > 0 && (
                    <span className="text-muted-foreground">({exam.studentCount} სტუდენტი)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExamsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<ExamTypeKey[]>([]);
  const { group } = useUserGroup();
  const { exams, loading } = useExams(group?.groupCode || null);

  const filteredExams = useMemo(() => {
    return exams
      .filter((exam) => {
        const matchesSearch = searchQuery === "" ||
          exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exam.lecturers.some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(exam.examType as ExamTypeKey);
        const isUpcoming = showAll || new Date(exam.date) >= new Date(new Date().toDateString());
        return matchesSearch && matchesType && isUpcoming;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [exams, searchQuery, selectedTypes, showAll]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Exam[]>();
    filteredExams.forEach((exam) => {
      const key = exam.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(exam);
    });
    return map;
  }, [filteredExams]);

  const toggleTypeFilter = (type: ExamTypeKey) => {
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 lg:p-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-full" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground lg:text-2xl">გამოცდები</h1>
              <Badge variant="secondary" className="font-mono">{filteredExams.length}</Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ძებნა..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex rounded-lg border border-border p-1">
              <button
                onClick={() => setShowAll(false)}
                className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", !showAll ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                მომავალი
              </button>
              <button
                onClick={() => setShowAll(true)}
                className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", showAll ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                ყველა
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(["midterm", "final", "quiz", "retake"] as ExamTypeKey[]).map((type) => {
              const config = examTypeConfig[type];
              return (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                    selectedTypes.includes(type)
                      ? config.color
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="px-4 py-6 lg:px-8">
        {filteredExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <Search className="size-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-medium text-foreground">გამოცდები არ მოიძებნა</h2>
            <p className="mt-1 text-sm text-muted-foreground">შეამოწმეთ მოგვიანებით ან შეცვალეთ ფილტრები</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([dateKey, dateExams], groupIndex) => (
              <div key={dateKey} className="space-y-3">
                <div className="sticky top-[145px] z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-sm lg:-mx-8 lg:px-8">
                  <h2 className="text-sm font-semibold text-foreground">{formatGeorgianDate(dateKey)}</h2>
                </div>
                <div className="space-y-3">
                  {dateExams.map((exam, index) => (
                    <ExamCard key={exam.id} exam={exam} index={groupIndex * 10 + index} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
