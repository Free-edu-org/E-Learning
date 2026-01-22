import { useState } from 'react';
import { LoginView } from './components/LoginView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { LessonEditor } from './components/LessonEditor';
import { LessonView } from './components/LessonView';
import { ResultsView } from './components/ResultsView';
import { StudentResults } from './components/StudentResults';
import { StudentManagement } from './components/StudentManagement';
import { GroupManagement } from './components/GroupManagement';
import { StudentProfileEditor } from './components/StudentProfileEditor';
import { StudentStatistics } from './components/StudentStatistics';
import { Toaster } from './components/ui/sonner';

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  nickname?: string;
  email?: string;
  isArchived?: boolean;
  groupIds?: string[];
}

export type TaskType = 'word-order' | 'fill-gap' | 'multiple-choice';

export interface Task {
  id: string;
  type: TaskType;
  question: string;
  correctAnswer: string | string[];
  options?: string[];
  words?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  topic: string;
  grammarRules: string;
  tasks: Task[];
  teacherId: string;
  createdAt: Date;
  isActive: boolean;
  groupIds?: string[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  studentIds: string[];
  createdAt: Date;
}

export interface StudentAnswer {
  taskId: string;
  answer: string | string[];
  isCorrect: boolean;
}

export interface LessonResult {
  lessonId: string;
  studentId: string;
  answers: StudentAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: Date;
}

type View = 'login' | 'teacher-dashboard' | 'student-dashboard' | 'lesson-editor' | 'lesson-view' | 'results-view' | 'student-results' | 'student-management' | 'group-management' | 'student-profile' | 'student-statistics';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'teacher') {
      setCurrentView('teacher-dashboard');
    } else {
      setCurrentView('student-dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setSelectedLessonId(null);
  };

  const handleCreateLesson = () => {
    setSelectedLessonId(null);
    setCurrentView('lesson-editor');
  };

  const handleEditLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentView('lesson-editor');
  };

  const handleViewResults = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentView('results-view');
  };

  const handleStartLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentView('lesson-view');
  };

  const handleViewStudentResults = () => {
    setCurrentView('student-results');
  };

  const handleManageStudents = () => {
    setCurrentView('student-management');
  };

  const handleManageGroups = () => {
    setCurrentView('group-management');
  };

  const handleEditProfile = () => {
    setCurrentView('student-profile');
  };

  const handleViewStudentStatistics = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentView('student-statistics');
  };

  const handleBackToDashboard = () => {
    if (currentUser?.role === 'teacher') {
      setCurrentView('teacher-dashboard');
    } else {
      setCurrentView('student-dashboard');
    }
    setSelectedLessonId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster />
      {currentView === 'login' && (
        <LoginView onLogin={handleLogin} />
      )}
      
      {currentView === 'teacher-dashboard' && currentUser && (
        <TeacherDashboard
          user={currentUser}
          onLogout={handleLogout}
          onCreateLesson={handleCreateLesson}
          onEditLesson={handleEditLesson}
          onViewResults={handleViewResults}
          onManageStudents={handleManageStudents}
          onManageGroups={handleManageGroups}
        />
      )}

      {currentView === 'student-dashboard' && currentUser && (
        <StudentDashboard
          user={currentUser}
          onLogout={handleLogout}
          onStartLesson={handleStartLesson}
          onViewResults={handleViewStudentResults}
          onEditProfile={handleEditProfile}
        />
      )}

      {currentView === 'lesson-editor' && currentUser && (
        <LessonEditor
          user={currentUser}
          lessonId={selectedLessonId}
          onBack={handleBackToDashboard}
        />
      )}

      {currentView === 'lesson-view' && currentUser && selectedLessonId && (
        <LessonView
          lessonId={selectedLessonId}
          studentId={currentUser.id}
          onComplete={handleBackToDashboard}
        />
      )}

      {currentView === 'results-view' && currentUser && selectedLessonId && (
        <ResultsView
          lessonId={selectedLessonId}
          onBack={handleBackToDashboard}
          onViewStudentStatistics={handleViewStudentStatistics}
        />
      )}

      {currentView === 'student-results' && currentUser && (
        <StudentResults
          studentId={currentUser.id}
          onBack={handleBackToDashboard}
        />
      )}

      {currentView === 'student-management' && currentUser && (
        <StudentManagement
          teacherId={currentUser.id}
          onBack={handleBackToDashboard}
        />
      )}

      {currentView === 'group-management' && currentUser && (
        <GroupManagement
          teacherId={currentUser.id}
          onBack={handleBackToDashboard}
        />
      )}

      {currentView === 'student-profile' && currentUser && (
        <StudentProfileEditor
          studentId={currentUser.id}
          onBack={handleBackToDashboard}
        />
      )}

      {currentView === 'student-statistics' && currentUser && selectedStudentId && (
        <StudentStatistics
          studentId={selectedStudentId}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
}