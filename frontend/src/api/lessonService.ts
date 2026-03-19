// Mock service – will be replaced with real endpoints when the backend is ready.

export interface Group {
  id: number;
  name: string;
}

export interface Lesson {
  id: number;
  title: string;
  theme: string;
  is_active: boolean;
  created_at: string;
  groups: Group[];
}

export interface TeacherStats {
  totalLessons: number;
  activeLessons: number;
  activeStudents: number;
  avgScore: number; // percentage 0-100
}

// All available groups for this teacher
const ALL_GROUPS: Group[] = [
  { id: 1, name: "Klasa 8A" },
  { id: 2, name: "Klasa 8B" },
  { id: 3, name: "Grupa Advanced" },
  { id: 4, name: "Grupa Intermediate" },
  { id: 5, name: "Koło językowe" },
];

const MOCK_LESSONS: Lesson[] = [
  {
    id: 1,
    title: "Present Simple vs Present Continuous",
    theme: "Czasy teraźniejsze",
    is_active: true,
    created_at: "2024-01-15",
    groups: [{ id: 1, name: "Klasa 8A" }],
  },
  {
    id: 2,
    title: "Modal Verbs",
    theme: "Czasowniki modalne",
    is_active: true,
    created_at: "2024-01-20",
    groups: [
      { id: 1, name: "Klasa 8A" },
      { id: 2, name: "Klasa 8B" },
    ],
  },
  {
    id: 3,
    title: "Word Order in Questions",
    theme: "Szyk wyrazów w pytaniach",
    is_active: false,
    created_at: "2024-01-25",
    groups: [],
  },
  {
    id: 4,
    title: "Past Simple – Regular and Irregular Verbs",
    theme: "Czasy przeszłe",
    is_active: true,
    created_at: "2024-02-03",
    groups: [
      { id: 2, name: "Klasa 8B" },
      { id: 3, name: "Grupa Advanced" },
      { id: 4, name: "Grupa Intermediate" },
    ],
  },
  {
    id: 5,
    title: "Conditional Sentences Type 1 & 2",
    theme: "Tryb warunkowy",
    is_active: true,
    created_at: "2024-02-10",
    groups: [
      { id: 3, name: "Grupa Advanced" },
      { id: 5, name: "Koło językowe" },
    ],
  },
  {
    id: 6,
    title: "Articles: A, An, The",
    theme: "Przedimki",
    is_active: false,
    created_at: "2024-02-18",
    groups: [{ id: 4, name: "Grupa Intermediate" }],
  },
  {
    id: 7,
    title: "Passive Voice",
    theme: "Strona bierna",
    is_active: true,
    created_at: "2024-03-01",
    groups: [
      { id: 1, name: "Klasa 8A" },
      { id: 3, name: "Grupa Advanced" },
    ],
  },
  {
    id: 8,
    title: "Reported Speech",
    theme: "Mowa zależna",
    is_active: false,
    created_at: "2024-03-07",
    groups: [],
  },
  {
    id: 9,
    title: "Future Tenses: Will vs Going To",
    theme: "Czasy przyszłe",
    is_active: true,
    created_at: "2024-03-12",
    groups: [{ id: 5, name: "Koło językowe" }],
  },
  {
    id: 10,
    title: "Relative Clauses",
    theme: "Zdania względne",
    is_active: true,
    created_at: "2024-03-18",
    groups: [
      { id: 1, name: "Klasa 8A" },
      { id: 2, name: "Klasa 8B" },
    ],
  },
  {
    id: 11,
    title: "Adjectives vs Adverbs",
    theme: "Przymiotniki i przysłówki",
    is_active: false,
    created_at: "2024-03-24",
    groups: [],
  },
  {
    id: 12,
    title: "Phrasal Verbs in Context",
    theme: "Czasowniki frazowe",
    is_active: true,
    created_at: "2024-04-01",
    groups: [
      { id: 2, name: "Klasa 8B" },
      { id: 3, name: "Grupa Advanced" },
      { id: 5, name: "Koło językowe" },
    ],
  },
];

const MOCK_STATS: TeacherStats = {
  totalLessons: 12,
  activeLessons: 8,
  activeStudents: 24,
  avgScore: 78,
};

/** Simulates a network delay of ~400 ms */
function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const lessonService = {
  getLessons: (): Promise<Lesson[]> => delay(MOCK_LESSONS),
  getStats: (): Promise<TeacherStats> => delay(MOCK_STATS),
  getGroups: (): Promise<Group[]> => delay(ALL_GROUPS, 200),
};
