# Awatary uzytkownikow

Awatary sa czescia profilu uzytkownika. System wspiera dwa warianty:
- upload wlasnego pliku `JPEG` albo `PNG`,
- wybor jednego z presetow `avatar_1` do `avatar_12`.

## Model danych

Awatar jest zapisany jako `avatarUrl` na encji `User`.

Format wartosci:
- `preset:avatar_3` -> preset z `frontend/public/avatars/avatar_3.svg`,
- `/uploads/avatars/1.jpg` -> plik uploadowany przez backend.

Baza:
- migracja `V1_8__add_avatar_to_users.sql` dodaje kolumne `users.avatar_url`.

## API

| Akcja | Endpoint | Dostep | Uwagi |
|---|---|---|---|
| Upload awatara | `POST /api/v1/users/{publicId}/avatar` | admin albo wlasciciel konta | Multipart `file`, tylko JPEG/PNG, max 2 MB. |
| Wybor presetu | `PUT /api/v1/users/{publicId}/avatar/preset` | admin albo wlasciciel konta | Body z `presetName`, np. `avatar_3`. |
| Odczyt pliku | `GET /uploads/avatars/**` | publiczny odczyt pliku | Statyczne pliki uploadowane przez backend. |

Przykladowy preset:

```json
{
  "presetName": "avatar_3"
}
```

Przykladowa odpowiedz profilu:

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@szkola.pl",
  "role": "ADMIN",
  "avatarUrl": "preset:avatar_3"
}
```

## Frontend

Frontend uzywa `UserAvatar` jako wspolnego komponentu wyswietlania awatara.

Miejsca uzycia:
- header dashboardu przez `DashboardHeader`,
- ustawienia konta przez `AccountSettingsDialog`,
- listy uczniow i nauczycieli w panelach,
- lekcje ucznia z awatarem nauczyciela,
- wyniki lekcji i widoki nauczycielskie.

Preset `preset:avatar_X` jest mapowany na `/avatars/avatar_X.svg`. Uploadowany URL jest skladany na podstawie backendu i wskazuje na `/uploads/avatars/...`.

## Walidacje i bledy

| Kod | Kiedy |
|---|---|
| `AVATAR_INVALID_FILE_TYPE` | Plik nie jest `image/jpeg` ani `image/png`. |
| `AVATAR_FILE_TOO_LARGE` | Plik przekracza 2 MB. |
| `AVATAR_INVALID_PRESET` | Nazwa presetu nie jest na liscie dozwolonych presetow. |

## Ryzyka / uwagi

- Upload pliku nadpisuje poprzedni avatar plikowy uzytkownika.
- Presety sa statycznymi assetami frontendu, wiec nowy preset wymaga dodania pliku SVG i dopisania go do listy dozwolonych presetow backendu.
- `UserAvatar` powinien korzystac z konfigurowalnego base URL API, jesli aplikacja ma dzialac poza `localhost:8080`.

## Zrodla

- [User.java](../../backend/src/main/java/pl/freeedu/backend/user/model/User.java)
- [UserController.java](../../backend/src/main/java/pl/freeedu/backend/user/controller/UserController.java)
- [UserService.java](../../backend/src/main/java/pl/freeedu/backend/user/service/UserService.java)
- [SetPresetAvatarRequest.java](../../backend/src/main/java/pl/freeedu/backend/user/dto/SetPresetAvatarRequest.java)
- [V1_8__add_avatar_to_users.sql](../../backend/src/main/resources/db/migration/V1_8__add_avatar_to_users.sql)
- [UserAvatar.tsx](../../frontend/src/components/ui/avatar/UserAvatar.tsx)
- [AccountSettingsDialog.tsx](../../frontend/src/components/ui/panel/AccountSettingsDialog.tsx)
- [userService.ts](../../frontend/src/api/userService.ts)
