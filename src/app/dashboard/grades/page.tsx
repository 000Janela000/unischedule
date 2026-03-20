"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, ArrowUpDown, GraduationCap, Puzzle, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmis } from "@/hooks/use-emis";
import Link from "next/link";

interface Course {
  name: string;
  credits: number;
  grade: string;
  points: number;
  status: "passed" | "failed" | "retaken";
  semester: number;
}

const gradeColors: Record<string, string> = {
  A: "bg-primary/20 text-primary border-primary/30",
  B: "bg-accent/20 text-accent-foreground border-accent/30",
  C: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  D: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  F: "bg-destructive/20 text-destructive border-destructive/30",
};

function letterGrade(points: number): string {
  if (points >= 91) return "A";
  if (points >= 81) return "B";
  if (points >= 71) return "C";
  if (points >= 61) return "D";
  return "F";
}

type SortKey = "name" | "grade" | "credits";

export default function GradesPage() {
  const { callEmis } = useEmis();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [gpa, setGpa] = useState(0);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [requiredCredits] = useState(240);
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const res = await fetch("/api/emis/token");
      const data = await res.json();
      if (data.connected) {
        setConnected(true);
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

      // Parse EMIS response into courses
      // EMIS returns grades in its own format — adapt here
      if (Array.isArray(data?.results || data)) {
        const results = data?.results || data;
        const parsed: Course[] = results.map((r: any, i: number) => ({
          name: r.subjectName || r.subject || `საგანი ${i + 1}`,
          credits: r.credits || r.ects || 0,
          grade: r.grade || letterGrade(r.points || r.mark || 0),
          points: r.points || r.mark || 0,
          status: (r.points || r.mark || 0) >= 51 ? "passed" : "failed",
          semester: r.semester || r.semesterNumber || 1,
        }));
        setCourses(parsed);

        // Calculate GPA (4.0 scale)
        const totalCredits = parsed.reduce((s, c) => s + c.credits, 0);
        const weightedSum = parsed.reduce((s, c) => {
          const gradePoint = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0 }[c.grade] || 0;
          return s + gradePoint * c.credits;
        }, 0);
        setGpa(totalCredits > 0 ? weightedSum / totalCredits : 0);
        setEarnedCredits(parsed.filter((c) => c.status === "passed").reduce((s, c) => s + c.credits, 0));
      }
    } catch (err) {
      console.error("Failed to fetch grades:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setSyncing(true);
    await fetchGrades();
    setSyncing(false);
  }

  // Semesters from data
  const semesters = useMemo(() => {
    const set = new Set(courses.map((c) => c.semester));
    return Array.from(set).sort((a, b) => a - b);
  }, [courses]);

  // Filter and sort
  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => selectedSemester === "all" || c.semester === parseInt(selectedSemester))
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === "name") cmp = a.name.localeCompare(b.name, "ka");
        else if (sortBy === "grade") cmp = a.grade.localeCompare(b.grade);
        else if (sortBy === "credits") cmp = a.credits - b.credits;
        return sortAsc ? cmp : -cmp;
      });
  }, [courses, selectedSemester, sortBy, sortAsc]);

  // Not connected — show setup prompt
  if (!loading && !connected) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-4 lg:px-8">
            <h1 className="text-xl font-semibold text-foreground lg:text-2xl">შეფასებები და GPA</h1>
            <p className="text-sm text-muted-foreground">აკადემიური მოსწრება</p>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
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
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-4 lg:px-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-1 h-4 w-32" />
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </main>
      </div>
    );
  }

  // Connected — show real grades
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 lg:px-8">
          <div>
            <h1 className="text-xl font-semibold text-foreground lg:text-2xl">შეფასებები და GPA</h1>
            <p className="text-sm text-muted-foreground">აკადემიური მოსწრება</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={syncing} className="gap-2">
            <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
            განახლება
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 lg:px-8">
        {/* GPA Hero */}
        <Card className="mb-6 overflow-hidden border-border bg-gradient-to-br from-primary/10 via-card to-accent/5">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-6">
                <div className="flex size-24 items-center justify-center rounded-2xl bg-primary/20 ring-2 ring-primary/30">
                  <GraduationCap className="size-12 text-primary" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold tracking-tight text-foreground">
                      {gpa.toFixed(2)}
                    </span>
                    <span className="text-lg font-medium text-muted-foreground">GPA</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">კრედიტები (ECTS)</span>
                  <span className="font-medium text-foreground">
                    {earnedCredits} / {requiredCredits}
                  </span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${(earnedCredits / requiredCredits) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  დარჩენილია {requiredCredits - earnedCredits} კრედიტი
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Semester filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={selectedSemester === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSemester("all")}
            className="rounded-full"
          >
            ყველა
          </Button>
          {semesters.map((sem) => (
            <Button
              key={sem}
              variant={selectedSemester === String(sem) ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSemester(String(sem))}
              className="rounded-full"
            >
              {["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][sem - 1] || sem} სემესტრი
            </Button>
          ))}
        </div>

        {/* Sort */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">დალაგება:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">სახელი</SelectItem>
              <SelectItem value="grade">შეფასება</SelectItem>
              <SelectItem value="credits">კრედიტი</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => setSortAsc(!sortAsc)}>
            <ArrowUpDown className={cn("size-4", !sortAsc && "rotate-180")} />
          </Button>
        </div>

        {/* Course cards */}
        {filteredCourses.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              საგნები ვერ მოიძებნა
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course, index) => (
              <Card
                key={index}
                className={cn(
                  "border-border transition-all duration-300 hover:shadow-md",
                  course.status === "failed" && "border-destructive/30 bg-destructive/5"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-foreground">{course.name}</h3>
                      <p className="text-sm text-muted-foreground">{course.credits} ECTS</p>
                    </div>
                    <div
                      className={cn(
                        "flex size-12 flex-shrink-0 items-center justify-center rounded-lg border text-xl font-bold",
                        gradeColors[course.grade] || gradeColors.F
                      )}
                    >
                      {course.grade}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {course.points} ქულა
                    </Badge>
                    {course.status === "passed" && (
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/30">ჩაბარებული</Badge>
                    )}
                    {course.status === "failed" && (
                      <Badge variant="destructive">ვერ ჩააბარა</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        <Card className="mt-6 border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                {selectedSemester === "all" ? "სულ" : `${["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][parseInt(selectedSemester) - 1]} სემესტრი`}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {filteredCourses.reduce((s, c) => s + c.credits, 0)} კრედიტი
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">კუმულატიური GPA</p>
              <p className="text-2xl font-bold text-primary">{gpa.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
