import { ApiError } from "@/api/apiClient";

const ERROR_TRANSLATIONS: Record<string, string> = {
  "Email is already taken": "Ten adres email jest już zajęty.",
  "email is already taken": "Ten adres email jest już zajęty.",
  "Username already exists": "Ta nazwa użytkownika jest już zajęta.",
  "Username is already taken": "Ta nazwa użytkownika jest już zajęta.",
  "Invalid password": "Hasło jest nieprawidłowe.",
  "Invalid old password": "Obecne hasło jest nieprawidłowe.",
  "Bad credentials": "Nieprawidłowe dane logowania.",
  "Invalid username/email or password": "Nieprawidłowy login/email lub hasło.",
  "Task not found": "Nie znaleziono zadania.",
  "Lesson has already been completed": "Ta lekcja została już ukończona.",
  "Lesson has not been started yet":
    "Ta lekcja nie została jeszcze rozpoczęta.",
  "Student does not have access to this lesson":
    "Nie masz dostępu do tej lekcji.",
  "Lesson is not active": "Ta lekcja nie jest aktywna.",
  "Invalid task type": "Nieprawidłowy typ zadania.",
  "Audio file is required": "Plik audio jest wymagany.",
  "Speech-to-text service is unavailable":
    "Usługa rozpoznawania mowy jest chwilowo niedostępna.",
  "Lesson not found": "Nie znaleziono lekcji.",
  "Lesson result not found": "Nie znaleziono wyniku lekcji.",
  "User group not found": "Nie znaleziono grupy.",
  "Group with this name already exists": "Grupa o tej nazwie już istnieje.",
  "Student is already assigned to a group":
    "Uczeń jest już przypisany do grupy.",
  "Only users with role STUDENT can be added to a group":
    "Do grupy można przypisać tylko użytkownika z rolą ucznia.",
  "Selected group does not belong to the selected teacher":
    "Wybrana grupa nie należy do wskazanego nauczyciela.",
  "User is not a member of this group": "Użytkownik nie należy do tej grupy.",
  "User not found": "Nie znaleziono użytkownika.",
  "Selected teacher must have role TEACHER":
    "Wybrany użytkownik musi mieć rolę nauczyciela.",
  "Selected user must have role STUDENT":
    "Wybrany użytkownik musi mieć rolę ucznia.",
  "Only owner teacher can edit/delete this lesson":
    "Tylko właściciel lekcji może ją edytować lub usuwać.",
  "Attachment not found": "Nie znaleziono załącznika.",
  "Only PDF, TXT, DOCX, DOC and ODT files are allowed":
    "Dozwolone są tylko pliki PDF, TXT, DOCX, DOC i ODT.",
  "File is too large. Maximum size is 10 MB.":
    "Plik jest za duży. Maksymalny rozmiar to 10 MB.",
  "Maximum number of attachments (5) reached for this lesson.":
    "Osiągnięto maksymalną liczbę 5 załączników dla tej lekcji.",
  "Lesson must contain at least one task before activation.":
    "Nie można aktywować lekcji bez co najmniej jednego zadania.",
  "must not be blank": "Pole jest wymagane.",
  "must not be null": "Pole jest wymagane.",
  "must not be empty": "Pole jest wymagane.",
  "must be a well-formed email address": "Podaj poprawny adres e-mail.",
  "Title is required": "Tytuł jest wymagany.",
  "Theme is required": "Temat jest wymagany.",
  "Title must be at most 30 characters long":
    "Tytuł może mieć maksymalnie 30 znaków.",
  "Theme must be at most 120 characters long":
    "Temat może mieć maksymalnie 120 znaków.",
  "Username must be at most 50 characters long":
    "Nazwa użytkownika może mieć maksymalnie 50 znaków.",
  "Name must be at most 60 characters long":
    "Nazwa może mieć maksymalnie 60 znaków.",
  "Description must be at most 300 characters long":
    "Opis może mieć maksymalnie 300 znaków.",
  "Task must be at most 300 characters long":
    "Treść zadania może mieć maksymalnie 300 znaków.",
  "Possible answers must be at most 1000 characters long":
    "Lista odpowiedzi może mieć maksymalnie 1000 znaków.",
  "Words must be at most 600 characters long":
    "Lista słów może mieć maksymalnie 600 znaków.",
  "Correct answer must be at most 300 characters long":
    "Poprawna odpowiedź może mieć maksymalnie 300 znaków.",
  "Expected text must be at most 300 characters long":
    "Tekst do rozpoznania może mieć maksymalnie 300 znaków.",
  "Hint must be at most 200 characters long":
    "Podpowiedź może mieć maksymalnie 200 znaków.",
  "Section must be at most 80 characters long":
    "Sekcja może mieć maksymalnie 80 znaków.",
};

const ERROR_CODE_TRANSLATIONS: Record<string, string> = {
  INVALID_CREDENTIALS: "Nieprawidłowy login/email lub hasło.",
  INVALID_OLD_PASSWORD: "Obecne hasło jest nieprawidłowe.",
  TASK_NOT_FOUND: "Nie znaleziono zadania.",
  LESSON_ALREADY_COMPLETED: "Ta lekcja została już ukończona.",
  LESSON_NOT_STARTED: "Ta lekcja nie została jeszcze rozpoczęta.",
  STUDENT_NO_ACCESS: "Nie masz dostępu do tej lekcji.",
  LESSON_NOT_ACTIVE: "Ta lekcja nie jest aktywna.",
  INVALID_TASK_TYPE: "Nieprawidłowy typ zadania.",
  STT_AUDIO_REQUIRED: "Plik audio jest wymagany.",
  STT_SERVICE_UNAVAILABLE:
    "Usługa rozpoznawania mowy jest chwilowo niedostępna.",
  LESSON_NOT_FOUND: "Nie znaleziono lekcji.",
  LESSON_RESULT_NOT_FOUND: "Nie znaleziono wyniku lekcji.",
  USER_GROUP_NOT_FOUND: "Nie znaleziono grupy.",
  GROUP_NAME_ALREADY_EXISTS: "Grupa o tej nazwie już istnieje.",
  STUDENT_ALREADY_IN_GROUP: "Uczeń jest już przypisany do grupy.",
  INVALID_ROLE_FOR_GROUP:
    "Do grupy można przypisać tylko użytkownika z rolą ucznia.",
  GROUP_TEACHER_MISMATCH: "Wybrana grupa nie należy do wskazanego nauczyciela.",
  MEMBER_NOT_IN_GROUP: "Użytkownik nie należy do tej grupy.",
  USER_NOT_FOUND: "Nie znaleziono użytkownika.",
  EMAIL_ALREADY_TAKEN: "Ten adres email jest już zajęty.",
  USERNAME_ALREADY_TAKEN: "Ta nazwa użytkownika jest już zajęta.",
  INVALID_TEACHER_ASSIGNMENT: "Wybrany użytkownik musi mieć rolę nauczyciela.",
  INVALID_STUDENT_ASSIGNMENT: "Wybrany użytkownik musi mieć rolę ucznia.",
  NOT_LESSON_OWNER: "Tylko właściciel lekcji może ją edytować lub usuwać.",
  ATTACHMENT_NOT_FOUND: "Nie znaleziono załącznika.",
  ATTACHMENT_INVALID_FILE_TYPE:
    "Dozwolone są tylko pliki PDF, TXT, DOCX, DOC i ODT.",
  ATTACHMENT_FILE_TOO_LARGE: "Plik jest za duży. Maksymalny rozmiar to 10 MB.",
  ATTACHMENT_LIMIT_REACHED:
    "Osiągnięto maksymalną liczbę 5 załączników dla tej lekcji.",
  LESSON_CANNOT_BE_ACTIVATED_WITHOUT_TASKS:
    "Nie można aktywować lekcji bez co najmniej jednego zadania.",
};

function translateValidationMessage(
  message: string,
  fieldLabels: Record<string, string> = {},
): string {
  if (!message.startsWith("Validation failed:")) {
    return message;
  }

  const rawDetails = message.replace("Validation failed:", "").trim();
  const parts = rawDetails
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf(":");
      if (separatorIndex === -1) {
        return ERROR_TRANSLATIONS[part] ?? part;
      }

      const field = part.slice(0, separatorIndex).trim();
      const detail = part.slice(separatorIndex + 1).trim();
      const label = fieldLabels[field] ?? field;
      const translatedDetail = ERROR_TRANSLATIONS[detail] ?? detail;

      if (
        translatedDetail === "Pole jest wymagane." ||
        translatedDetail === `${label} jest wymagany.` ||
        translatedDetail === `${label} jest wymagana.` ||
        translatedDetail === `${label} jest wymagane.`
      ) {
        return `Uzupełnij pole "${label}".`;
      }

      return `${label}: ${translatedDetail}`;
    });

  if (parts.length === 1) {
    return parts[0];
  }

  return parts.join(" ");
}

export function getApiErrorMessage(
  error: ApiError,
  fallback: string,
  fieldLabels: Record<string, string> = {},
): string {
  const code = error.problem.code;
  if (code && ERROR_CODE_TRANSLATIONS[code]) {
    return ERROR_CODE_TRANSLATIONS[code];
  }

  const detail = error.problem.detail || error.problem.title;
  if (!detail) {
    return fallback;
  }

  if (detail.startsWith("Validation failed:")) {
    return translateValidationMessage(detail, fieldLabels);
  }

  return ERROR_TRANSLATIONS[detail] ?? detail;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return getApiErrorMessage(error, fallback);
  }

  if (error instanceof Error && error.message === "NETWORK_ERROR") {
    return "Brak połączenia z serwerem.";
  }

  return fallback;
}

export function formatOneDecimal(value?: number | null): string {
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

export function formatPercent(value?: number | null): string {
  return `${formatOneDecimal(value)}%`;
}

export function formatRatioPercent(
  score?: number | null,
  maxScore?: number | null,
): string {
  if (score == null || !maxScore || maxScore <= 0) {
    return formatPercent(0);
  }

  return formatPercent((score / maxScore) * 100);
}

export function formatDate(value?: string): string {
  if (!value) {
    return "Brak danych";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
  }).format(date);
}
