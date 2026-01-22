import { useState } from 'react';
import { User } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, Archive, KeyRound, Search, UserCheck, UserX } from 'lucide-react';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';

interface StudentManagementProps {
  teacherId: string;
  onBack: () => void;
}

// Mock data
const mockStudents: User[] = [
  {
    id: 'student-1',
    name: 'Jan Kowalski',
    email: 'jan.kowalski@example.com',
    role: 'student',
    avatar: '👨‍🎓',
    nickname: 'Janek',
    isArchived: false,
    groupIds: ['group-1']
  },
  {
    id: 'student-2',
    name: 'Anna Nowak',
    email: 'anna.nowak@example.com',
    role: 'student',
    avatar: '👩‍🎓',
    nickname: 'Ania',
    isArchived: false,
    groupIds: ['group-1', 'group-2']
  },
  {
    id: 'student-3',
    name: 'Piotr Wiśniewski',
    email: 'piotr.wisniewski@example.com',
    role: 'student',
    avatar: '🧑‍🎓',
    isArchived: false,
    groupIds: ['group-2']
  }
];

export function StudentManagement({ teacherId, onBack }: StudentManagementProps) {
  const [students, setStudents] = useState<User[]>(mockStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'active' ? !student.isArchived : student.isArchived;
    return matchesSearch && matchesTab;
  });

  const handleAddStudent = () => {
    if (!formName || !formEmail || !formPassword) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    const newStudent: User = {
      id: `student-${Date.now()}`,
      name: formName,
      email: formEmail,
      role: 'student',
      avatar: '👤',
      isArchived: false,
      groupIds: []
    };

    setStudents([...students, newStudent]);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setIsAddDialogOpen(false);
    toast.success(`Uczeń ${formName} został dodany`);
  };

  const handleEditStudent = () => {
    if (!selectedStudent || !formName || !formEmail) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    setStudents(students.map(s => 
      s.id === selectedStudent.id 
        ? { ...s, name: formName, email: formEmail }
        : s
    ));

    setIsEditDialogOpen(false);
    setSelectedStudent(null);
    toast.success('Dane ucznia zaktualizowane');
  };

  const handleResetPassword = (student: User) => {
    // Mock password reset
    toast.success(`Nowe hasło dla ${student.name} zostało wysłane na adres ${student.email}`);
  };

  const handleArchiveStudent = (student: User) => {
    setStudents(students.map(s => 
      s.id === student.id 
        ? { ...s, isArchived: true }
        : s
    ));
    toast.success(`${student.name} został zarchiwizowany`);
  };

  const handleUnarchiveStudent = (student: User) => {
    setStudents(students.map(s => 
      s.id === student.id 
        ? { ...s, isArchived: false }
        : s
    ));
    toast.success(`${student.name} został przywrócony`);
  };

  const handleDeleteStudent = (student: User) => {
    if (confirm(`Czy na pewno chcesz usunąć ucznia ${student.name}? Ta operacja jest nieodwracalna.`)) {
      setStudents(students.filter(s => s.id !== student.id));
      toast.success(`${student.name} został usunięty`);
    }
  };

  const openEditDialog = (student: User) => {
    setSelectedStudent(student);
    setFormName(student.name);
    setFormEmail(student.email || '');
    setIsEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1>Zarządzanie uczniami</h1>
              <p className="text-gray-600">Dodawaj, edytuj i zarządzaj kontami uczniów</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj ucznia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj nowego ucznia</DialogTitle>
                <DialogDescription>
                  Wprowadź dane nowego ucznia. Login i hasło zostaną wysłane na podany adres email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Imię i nazwisko</Label>
                  <Input
                    id="name"
                    placeholder="np. Jan Kowalski"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Adres email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="np. jan.kowalski@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Hasło tymczasowe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Wprowadź hasło"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleAddStudent}>
                  Dodaj ucznia
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardDescription>Aktywni uczniowie</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-green-600" />
                {students.filter(s => !s.isArchived).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Zarchiwizowani</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-6 h-6 text-gray-600" />
                {students.filter(s => s.isArchived).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Łącznie uczniów</CardDescription>
              <CardTitle>{students.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Szukaj ucznia po imieniu lub emailu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'archived')}>
              <TabsList>
                <TabsTrigger value="active">
                  Aktywni ({students.filter(s => !s.isArchived).length})
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Zarchiwizowani ({students.filter(s => s.isArchived).length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Brak uczniów do wyświetlenia
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="text-2xl">{student.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3>{student.name}</h3>
                        {student.nickname && (
                          <Badge variant="outline">"{student.nickname}"</Badge>
                        )}
                        {student.isArchived && (
                          <Badge variant="secondary">Zarchiwizowany</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      {student.groupIds && student.groupIds.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          <span className="text-xs text-gray-500">Grupy: {student.groupIds.length}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!student.isArchived ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(student)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetPassword(student)}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleArchiveStudent(student)}
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnarchiveStudent(student)}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteStudent(student)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edytuj dane ucznia</DialogTitle>
              <DialogDescription>
                Zaktualizuj informacje o uczniu
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Imię i nazwisko</Label>
                <Input
                  id="edit-name"
                  placeholder="np. Jan Kowalski"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Adres email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="np. jan.kowalski@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={handleEditStudent}>
                Zapisz zmiany
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
