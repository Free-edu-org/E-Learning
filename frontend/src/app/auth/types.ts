export type Id = number;

// ===== Users / Role =====
export type UserRole = "admin" | "student";

export type User = {
    id: Id;
    email: string;
    username: string;
    role: UserRole;
    createdAt: string;
};

// ===== Groups =====
export type UserGroup = {
    id: Id;
    name: string;
    description: string | null;
};

export type UserInGroup = {
    id: Id;
    userId: Id;
    groupId: Id;
};

// ===== Lessons =====
export type Lesson = {
    id: Id;
    title: string;
    theme: string | null;
    isActive: boolean;
    createdAt: string;
};

export type GroupHasLesson = {
    id: Id;
    groupId: Id;
    lessonId: Id;
};

// ===== Achievements =====
export type Achievement = {
    id: Id;
    name: string;
    description: string | null;
};

export type UserGetAchievement = {
    id: Id;
    userId: Id;
    achievementId: Id;
};

// ===== Tasks =====

export type TaskType = "speak" | "choose" | "write" | "scatter";

export type BaseTask = {
    id: Id;
    lessonId: Id;
    taskText: string;
    type: TaskType;
};

// Speak: uczeń mówi zdanie (STT po backendzie)
export type SpeakTask = BaseTask & {
    type: "speak";
};

// Choose: wybór jednokrotny (possible_answers, correct_answer jako index)
export type ChooseTask = BaseTask & {
    type: "choose";
    possibleAnswers: string[];
    correctAnswerIndex: number;
};

// Write: wpisanie odpowiedzi tekstowej
export type WriteTask = BaseTask & {
    type: "write";
    correctAnswer: string;
};

// Scatter: rozsypanka wyrazowa
export type ScatterTask = BaseTask & {
    type: "scatter";
    words: string[];
    correctAnswer: string;
};

export type Task = SpeakTask | ChooseTask | WriteTask | ScatterTask;

// ===== User answers / results =====
export type UserAnswer = {
    id: Id;
    taskId: Id;
    userId: Id;
    lessonId: Id;
    answer: string;
    isCorrect: boolean;
};