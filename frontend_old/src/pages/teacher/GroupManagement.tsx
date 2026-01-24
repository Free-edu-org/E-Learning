import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, Trash2, UserPlus, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers/AuthProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Group, User } from '@/types';

// Mock data
const mockGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Klasa 8A',
    description: 'Klasa ósma, poziom średnio-zaawansowany',
    teacherId: 'teacher-1',
    studentIds: ['student-1', 'student-2'],
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'group-2',
    name: 'Klasa 7B',
    description: 'Klasa siódma, poziom podstawowy',
    teacherId: 'teacher-1',
    studentIds: ['student-2', 'student-3'],
    createdAt: new Date('2024-01-05')
  }
];

const mockStudents: User[] = [
  {
    id: 'student-1',
    name: 'Jan Kowalski',
    email: 'jan.kowalski@example.com',
    role: 'student',
    avatar: '👨‍🎓',
    nickname: 'Janek',
    isArchived: false
  },
  {
    id: 'student-2',
    name: 'Anna Nowak',
    email: 'anna.nowak@example.com',
    role: 'student',
    avatar: '👩‍🎓',
    nickname: 'Ania',
    isArchived: false
  },
  {
    id: 'student-3',
    name: 'Piotr Wiśniewski',
    email: 'piotr.wisniewski@example.com',
    role: 'student',
    avatar: '🧑‍🎓',
    isArchived: false
  },
  {
    id: 'student-4',
    name: 'Maria Kowalczyk',
    email: 'maria.kowalczyk@example.com',
    role: 'student',
    avatar: '👧',
    isArchived: false
  }
];

export function GroupManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [students] = useState<User[]>(mockStudents.filter(s => !s.isArchived));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isManageStudentsDialogOpen, setIsManageStudentsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const handleCreateGroup = () => {
    if (!formName) {
      toast.error('Wprowadź nazwę grupy');
      return;
    }

    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: formName,
      description: formDescription,
      teacherId: user?.id ?? 'teacher-1',
      studentIds: selectedStudentIds,
      createdAt: new Date()
    };

    setGroups([...groups, newGroup]);
    setFormName('');
    setFormDescription('');
    setSelectedStudentIds([]);
    setIsCreateDialogOpen(false);
    toast.success(`Grupa "${formName}" została utworzona`);
  };

  const handleEditGroup = () => {
    if (!selectedGroup || !formName) {
      toast.error('Wprowadź nazwę grupy');
      return;
    }

    setGroups(groups.map(g => 
      g.id === selectedGroup.id 
        ? { ...g, name: formName, description: formDescription }
        : g
    ));

    setIsEditDialogOpen(false);
    setSelectedGroup(null);
    toast.success('Grupa zaktualizowana');
  };

  const handleUpdateGroupStudents = () => {
    if (!selectedGroup) return;

    setGroups(groups.map(g => 
      g.id === selectedGroup.id 
        ? { ...g, studentIds: selectedStudentIds }
        : g
    ));

    setIsManageStudentsDialogOpen(false);
    setSelectedGroup(null);
    toast.success('Uczniowie w grupie zaktualizowani');
  };

  const handleDeleteGroup = (group: Group) => {
    if (confirm(`Czy na pewno chcesz usunąć grupę "${group.name}"?`)) {
      setGroups(groups.filter(g => g.id !== group.id));
      toast.success(`Grupa "${group.name}" została usunięta`);
    }
  };

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group);
    setFormName(group.name);
    setFormDescription(group.description || '');
    setIsEditDialogOpen(true);
  };

  const openManageStudentsDialog = (group: Group) => {
    setSelectedGroup(group);
    setSelectedStudentIds(group.studentIds);
    setIsManageStudentsDialogOpen(true);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getStudentById = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/teacher')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1>Zarządzanie grupami</h1>
              <p className="text-gray-600">Twórz grupy i przydzielaj do nich uczniów</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Utwórz grupę
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Utwórz nową grupę</DialogTitle>
                <DialogDescription>
                  Podaj nazwę grupy i przypisz uczniów
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nazwa grupy</Label>
                  <Input
                    id="name"
                    placeholder="np. Klasa 8A"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Opis (opcjonalnie)</Label>
                  <Textarea
                    id="description"
                    placeholder="np. Klasa ósma, poziom średnio-zaawansowany"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uczniowie w grupie</Label>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          checked={selectedStudentIds.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-lg">{student.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-600">{student.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    Wybrano: {selectedStudentIds.length} uczniów
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleCreateGroup}>
                  Utwórz grupę
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Liczba grup</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600" />
                {groups.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Uczniowie w grupach</CardDescription>
              <CardTitle>
                {students.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Średnia wielkość grupy</CardDescription>
              <CardTitle>
                {groups.length > 0 
                  ? Math.round(groups.reduce((sum, g) => sum + g.studentIds.length, 0) / groups.length)
                  : 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Groups List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.length === 0 ? (
            <Card className="col-span-2">
              <CardContent className="text-center py-12 text-gray-500">
                Brak grup. Utwórz pierwszą grupę, aby przypisać do niej uczniów.
              </CardContent>
            </Card>
          ) : (
            groups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                      </div>
                      <CardDescription>{group.description || 'Brak opisu'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">
                        Uczniowie w grupie: {group.studentIds.length}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.studentIds.slice(0, 3).map((studentId) => {
                          const student = getStudentById(studentId);
                          return student ? (
                            <Badge key={studentId} variant="secondary">
                              {student.avatar} {student.name}
                            </Badge>
                          ) : null;
                        })}
                        {group.studentIds.length > 3 && (
                          <Badge variant="outline">
                            +{group.studentIds.length - 3} więcej
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Utworzona: {group.createdAt.toLocaleDateString('pl-PL')}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openManageStudentsDialog(group)}
                        className="flex-1"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Zarządzaj uczniami
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(group)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGroup(group)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edytuj grupę</DialogTitle>
              <DialogDescription>
                Zaktualizuj informacje o grupie
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nazwa grupy</Label>
                <Input
                  id="edit-name"
                  placeholder="np. Klasa 8A"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Opis</Label>
                <Textarea
                  id="edit-description"
                  placeholder="np. Klasa ósma, poziom średnio-zaawansowany"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={handleEditGroup}>
                Zapisz zmiany
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Students Dialog */}
        <Dialog open={isManageStudentsDialogOpen} onOpenChange={setIsManageStudentsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Zarządzaj uczniami w grupie</DialogTitle>
              <DialogDescription>
                Zaznacz uczniów, którzy powinni należeć do grupy "{selectedGroup?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <Checkbox
                    checked={selectedStudentIds.includes(student.id)}
                    onCheckedChange={() => toggleStudentSelection(student.id)}
                  />
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-lg">{student.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-600">{student.email}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Wybrano: {selectedStudentIds.length} uczniów
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsManageStudentsDialogOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={handleUpdateGroupStudents}>
                Zapisz zmiany
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
