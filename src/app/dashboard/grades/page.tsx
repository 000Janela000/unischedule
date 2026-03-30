"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Puzzle, ExternalLink, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmis } from "@/hooks/use-emis";
import Link from "next/link";

interface Course {
  name: string;
  nameEn: string;
  code: string;
  credits: number;
  grade: string;
  points: number;
  status: "passed" | "failed";
  semester: number;
  professor: string;
  groupName: string;
  year: string;
  confirm: string; // "yes" or "no"
  estListStatus: string | null; // "active", "archive", or null for imported records
}

interface JwtStats {
  gpa: number;
  earnedCredits: number;
  requiredCredits: number;
  averageScore: number;
  semester: number;
}

const GRADE_CONFIG: Record<string, { label: string; color: string; points: number }> = {
  A: { label: "A", color: "text-emerald-500", points: 4.0 },
  B: { label: "B", color: "text-primary", points: 3.0 },
  C: { label: "C", color: "text-blue-500", points: 2.0 },
  D: { label: "D", color: "text-amber-500", points: 1.0 },
  E: { label: "E", color: "text-orange-500", points: 0.5 },
  F: { label: "F", color: "text-destructive", points: 0 },
};

// Georgian semester labels: "მე-1 სემესტრი", "მე-2 სემესტრი", etc.
const semesterLabel = (n: number): string => `მე-${n} სემესტრი`;

function getJwtStats(): JwtStats | null {
  try {
    const token = localStorage.getItem("emis_token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      gpa: payload.view?.gpa || 0,
      earnedCredits: payload.view?.credit || 0,
      requiredCredits: payload.view?.programCredit || 240,
      averageScore: payload.view?.averageScore || 0,
      semester: payload.view?.semester || 1,
    };
  } catch {
    return null;
  }
}

// Helper functions for grade display logic
function isPending(c: Course): boolean {
  return c.grade === "" && c.estListStatus === "active";
}

function isFailed(c: Course): boolean {
  return c.grade === "F" && (c.confirm === "yes" || c.estListStatus === "archive");
}

function displayGrade(c: Course): string {
  if (isPending(c)) return "—";
  return c.grade || "—";
}

function gradeColor(c: Course): string {
  if (isPending(c)) return "text-muted-foreground";
  return GRADE_CONFIG[c.grade]?.color || "text-muted-foreground";
}

function gradeToGpaPoints(grade: string): number {
  return GRADE_CONFIG[grade]?.points ?? 0;
}

function computeSemesterGpa(courses: Course[]): number {
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);
  if (totalCredits === 0) return 0;
  const weighted = courses.reduce((s, c) => s + gradeToGpaPoints(c.grade) * c.credits, 0);
  return weighted / totalCredits;
}

export default function GradesPage() {
  const { callEmis } = useEmis();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [jwtStats, setJwtStats] = useState<JwtStats | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | "all">("all");
  const [syncing, setSyncing] = useState(false);
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set());

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const res = await fetch("/api/emis/token");
      const data = await res.json();
      if (data.connected) {
        setConnected(true);
        // Read JWT stats synchronously — no race condition
        const stats = getJwtStats();
        setJwtStats(stats);
        // Default to current semester
        if (stats?.semester) {
          setSelectedSemester(stats.semester);
          setExpandedSemesters(new Set([stats.semester]));
        }
        await fetchGrades();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  async function fetchGrades() {
    setLoading(true);
    try {
      const data = await callEmis("/student/result/get", {});

      if (data?.result === "yes" && Array.isArray(data.data)) {
        const allItems: Course[] = [];
        for (const edu of data.data) {
          if (!Array.isArray(edu.items)) continue;
          for (const r of edu.items) {
            allItems.push({
              name: r.bookName || "",
              nameEn: r.bookAltName || "",
              code: r.bookCode || "",
              credits: r.credit || 0,
              grade: r.result || "",
              points: typeof r.score === "number" ? r.score : parseFloat(r.score) || 0,
              status: (r.score || 0) >= 51 ? "passed" : "failed",
              semester: r.semester || 1,
              professor: r.profName || "",
              groupName: r.groupName || "",
              year: r.year || "",
              confirm: r.confirm || "no",
              estListStatus: r.est_list?.status || null,
            });
          }
        }
        setCourses(allItems);
      }
    } catch (err) {
      console.error("Failed to fetch grades:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setSyncing(true);
    setJwtStats(getJwtStats());
    await fetchGrades();
    setSyncing(false);
  }

  // Use JWT GPA (authoritative from EMIS) — never recalculate
  const gpa = jwtStats?.gpa ?? 0;
  const earnedCredits = jwtStats?.earnedCredits ?? 0;
  const requiredCredits = jwtStats?.requiredCredits ?? 240;
  const averageScore = jwtStats?.averageScore ?? 0;
  const currentSemester = jwtStats?.semester ?? 0;

  const semesters = useMemo(() => {
    const set = new Set(courses.map((c) => c.semester));
    return Array.from(set).sort((a, b) => a - b); // oldest first (I → X)
  }, [courses]);

  const coursesBySemester = useMemo(() => {
    const map = new Map<number, Course[]>();
    for (const c of courses) {
      if (!map.has(c.semester)) map.set(c.semester, []);
      map.get(c.semester)!.push(c);
    }
    // Sort courses within each semester by points descending
    map.forEach((list) => {
      list.sort((a: Course, b: Course) => b.points - a.points);
    });
    return map;
  }, [courses]);

  const filteredSemesters = useMemo(() => {
    if (selectedSemester === "all") return semesters;
    return semesters.filter((s) => s === selectedSemester);
  }, [semesters, selectedSemester]);

  const toggleSemester = (sem: number) => {
    setExpandedSemesters((prev) => {
      const next = new Set(prev);
      if (next.has(sem)) next.delete(sem);
      else next.add(sem);
      return next;
    });
  };

  // Grade distribution for stats
  const gradeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const c of courses) {
      dist[c.grade] = (dist[c.grade] || 0) + 1;
    }
    return dist;
  }, [courses]);

  // Not connected
  if (!loading && !connected) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-4 lg:px-8">
            <h1 className="text-xl font-semibold text-foreground lg:text-2xl">შეფასებები</h1>
            <p className="text-sm text-muted-foreground">აკადემიური მოსწრება</p>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary/10">
              <GraduationCap className="size-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">EMIS-თან დაკავშირება საჭიროა</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              ნიშნებისა და GPA-ს სანახავად საჭიროა UniHub Chrome გაფართოების დაყენება.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/setup">
                <Button className="gap-2">
                  <Puzzle className="size-4" />
                  გაფართოების დაყენება
                </Button>
              </Link>
              <a href="https://emis.campus.edu.ge" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  EMIS გახსნა
                  <ExternalLink className="size-4" />
                </Button>
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-4 lg:px-8">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-1 h-4 w-28" />
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}
        </main>
      </div>
    );
  }

  const creditPercent = Math.min((earnedCredits / requiredCredits) * 100, 100);

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 lg:px-8">
          <div>
            <h1 className="text-xl font-semibold text-foreground lg:text-2xl">შეფასებები</h1>
            <p className="text-sm text-muted-foreground">
              {currentSemester > 0 ? `${semesterLabel(currentSemester)} მიმდინარე` : "აკადემიური მოსწრება"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={syncing}>
            <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
          </Button>
        </div>
      </header>

      <main className="px-4 py-5 lg:px-8">
        {/* Stats cards — redesigned */}
        <div className="grid gap-4 mb-6 lg:grid-cols-2">
          {/* GPA card — larger */}
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-2">GPA</p>
            <p className="text-4xl font-bold text-foreground">{gpa.toFixed(2)}</p>
            {averageScore > 0 && (
              <p className="text-xs text-muted-foreground mt-2">საშ. ქულა: {averageScore} (100-ქ. სკალა)</p>
            )}
          </div>

          {/* Credits + semester card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">კრედიტი</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">{earnedCredits}</p>
                <p className="text-sm text-muted-foreground">/{requiredCredits}</p>
              </div>
              {earnedCredits >= requiredCredits ? (
                <p className="text-xs text-primary font-medium mt-1">✓ პროგრამა დასრულებულია</p>
              ) : (
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${creditPercent}%` }}
                  />
                </div>
              )}
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">{currentSemester > 0 ? semesterLabel(currentSemester) : "სემესტრი"}</p>
            </div>
          </div>
        </div>

        {/* Semester tabs — Georgian labels */}
        <div className="mb-5 flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => { setSelectedSemester("all"); setExpandedSemesters(new Set(semesters)); }}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              selectedSemester === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            ყველა
          </button>
          {semesters.map((sem) => (
            <button
              key={sem}
              onClick={() => { setSelectedSemester(sem); setExpandedSemesters(new Set([sem])); }}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                selectedSemester === sem
                  ? "bg-primary text-primary-foreground"
                  : sem === currentSemester
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:bg-secondary"
              )}
            >
              მე-{sem}
              {sem === currentSemester && selectedSemester !== sem && (
                <span className="ml-1 inline-block size-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Semester sections */}
        <div className="space-y-3">
          {filteredSemesters.map((sem) => {
            const semCourses = coursesBySemester.get(sem) || [];
            const isExpanded = expandedSemesters.has(sem);
            const semGpa = computeSemesterGpa(semCourses);
            const semCredits = semCourses.reduce((s, c) => s + c.credits, 0);
            const isCurrent = sem === currentSemester;

            return (
              <div key={sem} className={cn(
                "rounded-xl border overflow-hidden",
                isCurrent ? "border-primary/30" : "border-border",
              )}>
                {/* Semester header */}
                <button
                  onClick={() => toggleSemester(sem)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-left transition-colors",
                    isCurrent ? "bg-primary/5" : "bg-card hover:bg-secondary/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {semesterLabel(sem)}
                    </span>
                    {isCurrent && (
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                        მიმდინარე
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{semCredits} cr</span>
                    <span className="text-sm font-semibold text-foreground">{semGpa.toFixed(2)}</span>
                    <ChevronDown className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                </button>

                {/* Course rows */}
                {isExpanded && (
                  <div className="divide-y divide-border">
                    {semCourses.map((course, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3",
                          isFailed(course) && "bg-destructive/5"
                        )}
                      >
                        {/* Grade pill */}
                        <div className={cn(
                          "shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                          isPending(course) && "bg-muted text-muted-foreground",
                          isFailed(course) && !isPending(course) && "bg-destructive/20 text-destructive",
                          !isPending(course) && !isFailed(course) && GRADE_CONFIG[course.grade] && `${GRADE_CONFIG[course.grade].color.replace('text-', 'bg-')} text-foreground`
                        )}>
                          {displayGrade(course)}
                        </div>

                        {/* Subject info */}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {course.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{course.credits} ECTS</span>
                            {course.professor && (
                              <span className="truncate">· {course.professor}</span>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0 text-xs">
                          <p className="font-semibold text-foreground">{course.points}</p>
                          <p className="text-muted-foreground">ქულა</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredSemesters.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            საგნები ვერ მოიძებნა
          </div>
        )}
      </main>
    </div>
  );
}
