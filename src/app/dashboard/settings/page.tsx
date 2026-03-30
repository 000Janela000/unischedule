"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor, LogOut, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserGroup } from "@/hooks/use-user-group";
import { decodeGroupCode, buildGroupCode, getFacultyByPrefix } from "@/lib/group-decoder";
import { useEmis } from "@/hooks/use-emis";

type ThemeOption = "light" | "dark" | "system";

const themeOptions: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "ნათელი", icon: Sun },
  { value: "dark", label: "მუქი", icon: Moon },
  { value: "system", label: "სისტემა", icon: Monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { group, setGroup } = useUserGroup();
  const { callEmis } = useEmis();
  const [mounted, setMounted] = useState(false);
  const [emisGroup, setEmisGroup] = useState<string | null>(null);
  const [emisProgram, setEmisProgram] = useState<string | null>(null);
  const [emisSemester, setEmisSemester] = useState<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Auto-correct group from EMIS
  useEffect(() => {
    async function syncEmis() {
      try {
        const tokenRes = await fetch("/api/emis/token");
        const tokenData = await tokenRes.json();
        if (!tokenData.connected) return;

        const data = await callEmis("/student/students/getDetails", {
          studentId: undefined, // extracted from JWT by backend
        });

        if (data?.result === "yes" && data.data) {
          const realGroup = data.data.group;
          if (realGroup) {
            setEmisGroup(realGroup);
            // Auto-correct localStorage if different
            if (group?.groupCode !== realGroup) {
              const decoded = decodeGroupCode(realGroup);
              if (decoded) {
                setGroup({
                  university: "agruni",
                  facultyId: decoded.faculty.id,
                  year: decoded.groupNumber,
                  groupNumber: decoded.groupNumber,
                  groupCode: realGroup,
                });
              }
            }
          }
        }

        // Get program/semester from localStorage token (sync.js writes it)
        try {
          const token = localStorage.getItem("emis_token");
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.view?.currentProgram?.nameEng) setEmisProgram(payload.view.currentProgram.nameEng);
            if (payload.view?.semester) setEmisSemester(payload.view.semester);
          }
        } catch {}
      } catch {}
    }
    syncEmis();
  }, []);

  const currentTheme = mounted ? theme : "system";
  const displayGroup = emisGroup || group?.groupCode;
  const decoded = displayGroup ? decodeGroupCode(displayGroup) : null;
  const enrollmentYear = decoded?.entryYear || "—";
  const semesterLabel = emisSemester ? `მე-${emisSemester} სემესტრი` : enrollmentYear;

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-4 py-4 lg:px-8">
          <h1 className="text-xl font-semibold text-foreground lg:text-2xl">პარამეტრები</h1>
          <p className="text-sm text-muted-foreground">პროფილი და აპლიკაციის პარამეტრები</p>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 p-4 lg:p-8">
        {/* Profile — compact single row */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex gap-4">
            <Avatar className="size-16 shrink-0 border-2 border-border">
              <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ""} />
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {session?.user?.name?.split(" ").map((n) => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground">{session?.user?.name || "სტუდენტი"}</h2>
              <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              {emisProgram && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{emisProgram}</p>
              )}
            </div>
          </div>

          {/* Info grid */}
          {decoded && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground font-medium">ფაკულტეტი</p>
                <p className="text-foreground">{decoded.faculty.nameKa}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">მიღება</p>
                <p className="text-foreground">{semesterLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground font-medium">ჯგუფი</p>
                <p className="text-foreground font-mono">{displayGroup?.toUpperCase() || "—"}</p>
              </div>
            </div>
          )}
        </div>

        {/* Theme — inline pill */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase">თემა</p>
          <div className="flex rounded-lg bg-muted p-1 gap-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = currentTheme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition-all",
                    isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                  title={option.label}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline text-xs">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* About — simple dividers */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase">შესახებ</p>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-muted-foreground">ვერსია</span>
            <span className="font-medium text-foreground">2.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">შექმნილია</span>
            <span className="font-medium text-foreground">agruni.edu.ge-სთვის</span>
          </div>
        </div>

        {/* Sign Out */}
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full justify-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          გასვლა
        </Button>
      </div>
    </div>
  );
}
