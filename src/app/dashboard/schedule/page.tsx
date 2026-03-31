'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useSchedule } from '@/hooks/use-schedule';
import { useUserGroup } from '@/hooks/use-user-group';
import { useEmisSubjects } from '@/hooks/use-emis-subjects';
import { Skeleton } from '@/components/ui/skeleton';
import type { Lecture } from '@/types';
import {
  buildWeekSchedule,
  detectConflicts,
  extractGroupCodes,
} from '@/lib/schedule-utils';
import { subjectInList } from '@/lib/subject-matcher';
import { WeekGrid } from './components/WeekGrid';
import { SearchPanel, SearchResult } from './components/SearchPanel';
import { GroupPicker } from './components/GroupPicker';
import { EmptyState } from './components/EmptyState';

function getTodayIndex(): number {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return -1;
  return day - 1;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default function SchedulePage() {
  const router = useRouter();
  const { group } = useUserGroup();
  const { subjectNames: emisSubjects } = useEmisSubjects();
  const {
    rawLectures,
    lectures: emisFilteredLectures,
    loading,
    hasNoData,
    refetch,
  } = useSchedule(emisSubjects, { fetchAll: true });

  // View modes and state
  const [viewMode, setViewMode] = useState<'my' | 'search' | 'group'>('my');
  const [highlightedSubject, setHighlightedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActiveResult, setSearchActiveResult] = useState<SearchResult | null>(null);
  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentMinutes());
  const [todayIndex, setTodayIndex] = useState<number>(-1);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize group selection
  useEffect(() => {
    if (group?.groupCode && !selectedGroupCode) {
      setSelectedGroupCode(group.groupCode);
    }
  }, [group?.groupCode, selectedGroupCode]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update today index on mount
  useEffect(() => {
    setTodayIndex(getTodayIndex());
  }, []);

  // Compute derived state
  const allGroupCodes = useMemo(() => extractGroupCodes(rawLectures), [rawLectures]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];

    // Group lectures by group and subject, filter by query
    const grouped: Record<string, Record<string, SearchResult>> = {};

    for (const lecture of rawLectures) {
      if (!subjectInList(lecture.subject, [searchQuery])) continue;

      if (!grouped[lecture.group]) {
        grouped[lecture.group] = {};
      }

      if (!grouped[lecture.group][lecture.subject]) {
        grouped[lecture.group][lecture.subject] = {
          group: lecture.group,
          subject: lecture.subject,
          slots: [],
        };
      }

      const existing = grouped[lecture.group][lecture.subject].slots.find(
        (s) => s.dayOfWeek === lecture.dayOfWeek && s.startTime === lecture.startTime
      );

      if (!existing) {
        grouped[lecture.group][lecture.subject].slots.push({
          dayOfWeek: lecture.dayOfWeek,
          dayNameKa: `${lecture.dayOfWeek === 1 ? 'ორშ' : lecture.dayOfWeek === 2 ? 'სამ' : lecture.dayOfWeek === 3 ? 'ოთხ' : lecture.dayOfWeek === 4 ? 'ხუთ' : 'პარ'}`,
          startTime: lecture.startTime,
          endTime: lecture.endTime,
          room: lecture.room,
          type: lecture.type,
        });
      }
    }

    const results: SearchResult[] = [];
    for (const group of Object.values(grouped)) {
      results.push(...Object.values(group));
    }
    return results;
  }, [rawLectures, searchQuery]);

  const myLectures = useMemo(() => {
    // If EMIS subjects exist, use them; otherwise filter by group
    if (emisSubjects && emisSubjects.length > 0) {
      return emisFilteredLectures;
    }
    if (group?.groupCode) {
      return rawLectures.filter((l) => l.group === group.groupCode);
    }
    return [];
  }, [emisSubjects, emisFilteredLectures, group?.groupCode, rawLectures]);

  const myWeekSchedule = useMemo(() => buildWeekSchedule(myLectures), [myLectures]);

  const groupWeekSchedule = useMemo(() => {
    if (!selectedGroupCode) return [];
    return buildWeekSchedule(rawLectures.filter((l) => l.group === selectedGroupCode));
  }, [rawLectures, selectedGroupCode]);

  const searchWeekSchedule = useMemo(() => {
    if (!searchActiveResult) return [];
    return buildWeekSchedule(rawLectures.filter((l) => l.group === searchActiveResult.group));
  }, [rawLectures, searchActiveResult]);

  // Detect conflicts only in "my" mode
  const conflictIds = useMemo(() => {
    if (viewMode !== 'my') return new Set<string>();
    return detectConflicts(myLectures);
  }, [myLectures, viewMode]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleLectureClick = (lecture: Lecture) => {
    // Highlight all matching subjects
    setHighlightedSubject(lecture.subject);
  };

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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col gap-3 px-4 py-4 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground lg:text-2xl">კვირის ცხრილი</h1>
            {viewMode === 'my' && group?.groupCode && (
              <Badge variant="secondary" className="font-mono text-xs">
                {group.groupCode.toUpperCase()}
              </Badge>
            )}
            {viewMode === 'group' && selectedGroupCode && (
              <Badge variant="secondary" className="font-mono text-xs">
                {selectedGroupCode.toUpperCase()}
              </Badge>
            )}
            {viewMode === 'search' && searchActiveResult && (
              <Badge variant="secondary" className="font-mono text-xs">
                {searchActiveResult.group.toUpperCase()}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start lg:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <div className="p-4 lg:p-8">
        {/* View mode tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'my' | 'search' | 'group')} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="my">ჩემი ცხრილი</TabsTrigger>
            <TabsTrigger value="search">ძებნა</TabsTrigger>
            <TabsTrigger value="group">ჯგუფი</TabsTrigger>
          </TabsList>

          {/* My Schedule */}
          <TabsContent value="my" className="mt-6 space-y-4">
            {hasNoData ? (
              <EmptyState type="no-emis-no-group" onSetup={() => router.push('/setup')} />
            ) : myLectures.length === 0 ? (
              <EmptyState type="no-lectures" />
            ) : (
              <WeekGrid
                weekSchedule={myWeekSchedule}
                todayIndex={todayIndex}
                highlightedSubject={highlightedSubject}
                conflictIds={conflictIds}
                currentMinutes={currentMinutes}
                onLectureClick={handleLectureClick}
              />
            )}
          </TabsContent>

          {/* Search */}
          <TabsContent value="search" className="mt-6 space-y-6">
            <SearchPanel
              query={searchQuery}
              onQueryChange={setSearchQuery}
              results={searchResults}
              onResultClick={(result) => {
                setSearchActiveResult(result);
                setHighlightedSubject(null);
              }}
              hasEmisSubjects={!!emisSubjects?.length}
            />

            {searchActiveResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchActiveResult(null);
                      setSearchQuery('');
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    უკან
                  </Button>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {searchActiveResult.group.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{searchActiveResult.subject}</span>
                </div>

                <WeekGrid
                  weekSchedule={searchWeekSchedule}
                  todayIndex={-1}
                  highlightedSubject={searchActiveResult.subject}
                  conflictIds={new Set()}
                  currentMinutes={-1}
                  onLectureClick={handleLectureClick}
                />
              </div>
            )}
          </TabsContent>

          {/* Group Picker */}
          <TabsContent value="group" className="mt-6 space-y-6">
            {allGroupCodes.length === 0 ? (
              <EmptyState type="no-lectures" />
            ) : (
              <>
                <GroupPicker
                  allGroupCodes={allGroupCodes}
                  selectedGroupCode={selectedGroupCode}
                  onSelect={setSelectedGroupCode}
                />

                {selectedGroupCode && (
                  <WeekGrid
                    weekSchedule={groupWeekSchedule}
                    todayIndex={-1}
                    highlightedSubject={null}
                    conflictIds={new Set()}
                    currentMinutes={-1}
                    onLectureClick={handleLectureClick}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
