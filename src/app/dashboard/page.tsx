"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  MapPin,
  ExternalLink,
  Mail,
  BookOpen,
  Globe,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSchedule } from "@/hooks/use-schedule";
import { useUserGroup } from "@/hooks/use-user-group";
import { useExams } from "@/hooks/use-exams";

const quickLinks = [
  { label: "EMIS", icon: Globe, href: "https://emis.campus.edu.ge" },
  { label: "ელ-ფოსტა", icon: Mail, href: "https://mail.google.com" },
  { label: "ბიბლიოთეკა", icon: BookOpen, href: "https://opac.agruni.edu.ge" },
  { label: "უნივერსიტეტი", icon: ExternalLink, href: "https://agruni.edu.ge" },
];

function getGeorgianDate() {
  const months = [
    "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
    "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
  ];
  const days = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}

function getExamTypeStyles(type: string) {
  switch (type) {
    case "midterm": return "border-l-amber-500 bg-amber-500/5";
    case "final": return "border-l-red-500 bg-red-500/5";
    case "quiz": return "border-l-blue-500 bg-blue-500/5";
    default: return "border-l-primary";
  }
}

function getExamBadgeStyles(type: string) {
  switch (type) {
    case "midterm": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20";
    case "final": return "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20";
    case "quiz": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20";
    default: return "";
  }
}

function getExamTypeLabel(type: string) {
  switch (type) {
    case "midterm": return "შუალედური";
    case "final": return "ფინალური";
    case "quiz": return "ქვიზი";
    case "retake": return "აღდგენა";
    default: return type;
  }
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { group } = useUserGroup();
  const { exams, loading: examsLoading } = useExams(group?.groupCode || null);
  const { lectures, loading: lecturesLoading } = useSchedule();
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    setCurrentDate(getGeorgianDate());
  }, []);

  const userName = session?.user?.name?.split(" ")[0] || "სტუდენტი";
  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("") || "U";

  // Today's lectures (dayOfWeek: 1=Mon, 5=Fri; JS getDay: 0=Sun, 6=Sat)
  const today = new Date();
  const jsDow = today.getDay(); // 0=Sun ... 6=Sat
  const lectureDow = jsDow === 0 ? 7 : jsDow; // 1=Mon ... 7=Sun
  const todayLectures = lectures
    .filter((l) => l.dayOfWeek === lectureDow)
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
    .slice(0, 4);

  // Upcoming exams (next 3)
  const upcomingExams = exams
    .filter((e) => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 lg:px-8">
          <div>
            <h1 className="text-xl font-semibold text-foreground lg:text-2xl">
              გამარჯობა, {userName}
            </h1>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {currentDate || "\u00A0"}
            </p>
          </div>
          <Avatar className="size-10">
            <AvatarImage src={session?.user?.image || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="p-4 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Today's Schedule */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">დღის ცხრილი</CardTitle>
              <Link href="/dashboard/schedule" className="flex items-center gap-1 text-sm text-primary hover:underline">
                სრულად <ChevronRight className="size-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {lecturesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/50" />
                  ))}
                </div>
              ) : todayLectures.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  დღეს ლექციები არ არის
                </p>
              ) : (
                todayLectures.map((lecture, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      <span className="w-24 font-medium">
                        {lecture.startTime || "—"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{lecture.subject}</p>
                    </div>
                    {lecture.room && (
                      <Badge variant="secondary" className="gap-1">
                        <MapPin className="size-3" />
                        {lecture.room}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Exams */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">მომავალი გამოცდები</CardTitle>
              <Link href="/dashboard/exams" className="flex items-center gap-1 text-sm text-primary hover:underline">
                სრულად <ChevronRight className="size-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {examsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/50" />
                  ))}
                </div>
              ) : upcomingExams.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  მომავალი გამოცდები არ არის
                </p>
              ) : (
                upcomingExams.map((exam, i) => {
                  const days = daysUntil(new Date(exam.date));
                  const examType = exam.examType?.toLowerCase() || "midterm";
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between rounded-lg border-l-4 p-3",
                        getExamTypeStyles(examType)
                      )}
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{exam.subject}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(exam.date).toLocaleDateString("ka-GE")}
                          </span>
                          <Badge className={cn("text-xs", getExamBadgeStyles(examType))}>
                            {getExamTypeLabel(examType)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-foreground">{days}</span>
                        <p className="text-xs text-muted-foreground">დღეში</p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* GPA Card — placeholder until EMIS */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">GPA</CardTitle>
              <Link href="/dashboard/grades" className="flex items-center gap-1 text-sm text-primary hover:underline">
                ნიშნები <ChevronRight className="size-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-foreground">—</span>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">EMIS-თან დაკავშირება საჭიროა</p>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-0 bg-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">სწრაფი ბმულები</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <link.icon className="size-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{link.label}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
