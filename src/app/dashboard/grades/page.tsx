"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Puzzle, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function GradesPage() {
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-4 py-4 lg:px-8">
          <h1 className="text-xl font-semibold text-foreground lg:text-2xl">შეფასებები და GPA</h1>
          <p className="text-sm text-muted-foreground">აკადემიური მოსწრება</p>
        </div>
      </header>

      <main className="px-4 py-6 lg:px-8">
        {/* EMIS connection required */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary/10">
              <GraduationCap className="size-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">EMIS-თან დაკავშირება საჭიროა</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              ნიშნებისა და GPA-ს სანახავად საჭიროა UniHub Chrome გაფართოების დაყენება,
              რომელიც თქვენს EMIS მონაცემებს ავტომატურად წამოიღებს.
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
