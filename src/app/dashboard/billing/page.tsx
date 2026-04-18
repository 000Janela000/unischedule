"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Gift, ArrowDownLeft, Puzzle, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmis, EmisSessionExpiredError } from "@/hooks/use-emis";
import Link from "next/link";

interface BillingYear {
  id: number;
  year: string;
  season: string;
  yearSeason: string;
}

interface BillingDetails {
  price: number;
  studentGrantSum: number;
  debt: number;
  paymentSum: number;
}

interface Grant {
  id: number;
  semesterPrice: number;
  fromDate: string;
  toDate: string;
  grant: { name: string; amount: number };
}

interface Payment {
  id: number;
  amount: number;
  date: string;
  bankTransactionId: string;
}

export default function BillingPage() {
  const { callEmis } = useEmis();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<BillingYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [details, setDetails] = useState<BillingDetails | null>(null);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const res = await fetch("/api/emis/token");
      const data = await res.json();
      if (data.connected) {
        setConnected(true);
        await loadYears();
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  async function loadYears() {
    try {
      const data = await callEmis("/student/billing/getActiveYearList");
      if (Array.isArray(data)) {
        setYears(data);
        if (data.length > 0) {
          const latest = data[data.length - 1];
          setSelectedYear(latest.id);
          await loadDetails(latest.id);
        }
      }
    } catch (err) {
      if (err instanceof EmisSessionExpiredError) {
        setConnected(false);
      } else {
        console.error("Failed to load billing years:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(yearId: number) {
    try {
      const [detailsData, grantsData, eventsData] = await Promise.all([
        callEmis("/student/billing/getDetails", { yearId }),
        callEmis("/student/billing/getStudentGrants/?page=1&limit=10", { yearId }),
        callEmis("/student/billing/getStudentEvents/?page=1&limit=50", {}),
      ]);

      if (detailsData) setDetails(detailsData);
      if (grantsData?.data) setGrants(grantsData.data);
      if (eventsData?.data) setPayments(eventsData.data.filter((e: any) => e.action === 1));
    } catch (err) {
      if (err instanceof EmisSessionExpiredError) {
        setConnected(false);
      } else {
        console.error("Failed to load billing details:", err);
      }
    }
  }

  async function handleYearChange(yearId: number) {
    setSelectedYear(yearId);
    await loadDetails(yearId);
  }

  if (!loading && !connected) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-4 lg:px-8">
            <h1 className="text-xl font-semibold text-foreground lg:text-2xl">ფინანსები</h1>
            <p className="text-sm text-muted-foreground">სწავლის საფასური და გრანტი</p>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary/10">
                <Wallet className="size-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">EMIS-თან დაკავშირება საჭიროა</h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                ფინანსური ინფორმაციის სანახავად საჭიროა Chrome გაფართოების დაყენება.
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

  if (loading) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-4 lg:px-8">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-1 h-4 w-56" />
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-4 py-4 lg:px-8">
          <h1 className="text-xl font-semibold text-foreground lg:text-2xl">ფინანსები</h1>
          <p className="text-sm text-muted-foreground">სწავლის საფასური და გრანტი</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
        {/* Year selector */}
        <div className="flex flex-wrap gap-2">
          {years.map((y) => (
            <Button
              key={y.id}
              variant={selectedYear === y.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleYearChange(y.id)}
              className="rounded-full text-xs"
            >
              {y.yearSeason}
            </Button>
          ))}
        </div>

        {/* Tuition overview */}
        {details && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="size-5 text-primary" />
                სწავლის საფასური
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">საფასური</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{details.price} ₾</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">გადახდილი</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{details.paymentSum} ₾</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground">დავალიანება</p>
                  <p className={cn("mt-1 text-2xl font-bold", details.debt > 0 ? "text-destructive" : "text-primary")}>
                    {details.debt} ₾
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grants */}
        {grants.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="size-5 text-primary" />
                გრანტი / სტიპენდია
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grants.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{g.grant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.fromDate} — {g.toDate}
                    </p>
                  </div>
                  <Badge className="bg-primary/20 text-primary">
                    {g.grant.amount} ₾ / სემესტრი
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Payment history */}
        {payments.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowDownLeft className="size-5 text-primary" />
                გადახდის ისტორია
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {payments.slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.amount} ₾</p>
                      <p className="text-xs text-muted-foreground">{p.date}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {p.bankTransactionId}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
