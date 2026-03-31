# Backend Gap Checklist

## 1. Gap confirmation
- Brak zostal potwierdzony w kodzie backendu, nie tylko w frontendzie.
- Wiadomo, czy chodzi o endpoint, DTO, service, repository, security, migracje czy testy.

## 2. Pattern matching
- Zostal znaleziony analogiczny modul w backendzie.
- Struktura nowej zmiany pasuje do obecnej architektury.

## 3. Security
- Endpoint ma poprawne ograniczenia globalne i lokalne.
- `@PreAuthorize` odzwierciedla role i ownership.
- Nie ma wycieku danych dla nieuprawnionych rol.

## 4. Domain consistency
- Logika biznesowa jest w serwisie.
- DTO i odpowiedzi sa minimalne i celowe.
- Error codes sa spojne z projektem.

## 5. Contract and tests
- `api-contract.md` zostal zaktualizowany.
- Scenariusze 401/403/404/409/400 zostaly sprawdzone.
- Requesty `.http` i testy API zostaly zaktualizowane, jesli dotyczy.

## 6. Verification
- Build/test zostal uruchomiony lub jawnie opisano, czemu nie.
- Raport koncowy opisuje zmiane i ryzyka.
