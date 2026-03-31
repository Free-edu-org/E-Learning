---
name: freeedu-backend-unit-test-writer
description: Pisze bardzo dobre i precyzyjne testy jednostkowe dla backendu FreeEdu po zmianach w kodzie. Uzyj, gdy trzeba dopisac lub poprawic unit testy dla zmodyfikowanych klas backendowych, szczegolnie serwisow, mapperow i komponentow security, w stylu given-when-then z JUnit 5 i Mockito, z naciskiem na exact assertions, brak rozmytych oczekiwan i pelne pokrycie branchy biznesowych, walidacji, ownership, error code oraz regresji wynikajacych z diffu.
---

# FreeEdu Backend Unit Test Writer

Pisz testy strict code-first: backend jest source of truth, nie kontrakt ani komentarz.

## Cel

Dostarcz precyzyjne testy jednostkowe dla zmian w backendzie, tak aby:
- zabezpieczyc nowe branch'e i regresje,
- odzwierciedlic realna logike serwisu i security,
- testowac konkretne kody bledow, side effecty i brak side effectow,
- unikac ogolnikowych asercji typu "nie rzuca wyjatku" albo "zwraca cos".

## Zakres domyslny

Skup sie na plikach backendowych zmienionych w aktualnym diffie lub wskazanych przez uzytkownika.

Najpierw:
1. sprawdz `git diff --name-only` oraz powiazane klasy,
2. wybierz tylko te klasy, dla ktorych unit test ma sens,
3. nie tworz testow przypadkowych ani oderwanych od zmiany.

Priorytet:
1. serwisy z logika biznesowa,
2. security/ownership checks,
3. mapowanie i warunki walidacyjne,
4. edge cases, ktore moga zostawic brudny stan albo rozjechac kontrakt.

## Stos i styl

Uzywaj:
- JUnit 5,
- Mockito,
- `@ExtendWith(MockitoExtension.class)`,
- `@Mock`, `@InjectMocks`,
- reactor test helpers tylko gdy testowana metoda zwraca `Mono` lub `Flux` i nie da sie sensownie testowac inaczej.

Nie wprowadzaj dodatkowych bibliotek, jesli repo ich nie potrzebuje.

Struktura kazdego testu:
1. `given`
2. `when`
3. `then`

Mozesz uzywac komentarzy `// given`, `// when`, `// then` tylko gdy realnie poprawia czytelnosc. Nazwy testow maja same z siebie komunikowac scenariusz.

Preferowana konwencja nazw:
- `shouldReturn...When...`
- `shouldThrow...When...`
- `shouldNotSave...When...`
- `shouldDelete...When...`

## Jak dobierac scenariusze

Dla kazdej zmienionej klasy wypisz lokalnie:
- co jest happy path,
- jakie sa warunki odmowy,
- jakie sa branch'e walidacyjne,
- jakie side effecty musza zajsc,
- jakie side effecty nie moga zajsc.

Minimalny zestaw dla istotnej zmiany:
- 1 happy path,
- 1 negatywny branch na najwazniejszy warunek biznesowy,
- 1 test na brak ubocznego zapisu przy bledzie, jesli kod zapisuje dane,
- 1 test na dokladny exception/error code, jesli kod mapuje bledy domenowe.

Jesli zmiana dotyczy transakcyjnosci lub kolejnosci operacji, testuj:
- walidacje przed write,
- brak `save(...)` przy niespelnionym precondition,
- brak kolejnych write po pierwszym bledzie,
- dokladne interakcje z repozytoriami (`never()`, `times(1)`).

Jesli zmiana dotyczy ownership/security, testuj:
- owner path,
- non-owner path,
- admin override, jesli istnieje,
- dokladny wynik dla braku encji powiazanej z ownership check.

## Zasady Mockito

Mockito uzywaj precyzyjnie, nie masowo.

Rób:
- stubuj tylko to, co potrzebne dla scenariusza,
- weryfikuj konkretne interakcje,
- sprawdzaj argumenty `ArgumentCaptor` tylko gdy ma to wartosc biznesowa,
- uzywaj `never()` do ochrony przed niechcianym write.

Nie rób:
- nadmiarowego `verifyNoMoreInteractions(...)` wszedzie,
- stubowania rzeczy nieuzywanych,
- testow opartych glownie na implementacyjnych detalach bez wartosci regresyjnej,
- szerokich matcherow, gdy mozna sprawdzic dokladny argument.

## Reaktywnosc

Jesli metoda zwraca `Mono` lub `Flux`:
- testuj wynik przez `StepVerifier`, gdy liczy sie sygnal/reactive error,
- jesli metoda jedynie opakowuje blok synchroniczny, nadal asercje maja byc dokladne,
- po `verifyComplete()` lub `expectErrorSatisfies(...)` sprawdz interakcje z mockami.

## Czego pilnowac w FreeEdu

Szczegolnie sprawdzaj:
- exact `UserException`, `TaskException`, `LessonException`, `UserGroupException`, `AuthException`,
- dokladny `ErrorCode`,
- ownership po grupie, nie po historycznym `teacherId` studenta,
- czy nie zostaje smiec w bazie po branchu bladnym,
- czy `lessonId` z URL rzeczywiscie ogranicza operacje na taskach,
- czy update/delete nie przechodza na obcej encji tylko po samym `id`.

## Oczekiwany wynik

Dostarcz:
- testy w odpowiednim pakiecie `src/test/java/...`,
- spojnosc nazewnictwa z istniejacym stylem repo,
- czytelne scenariusze given-when-then,
- tylko te testy, ktore wynikaja z realnych zmian backendu.

Po napisaniu testow:
1. uruchom najwezszy sensowny zakres testow,
2. jesli cos nie przechodzi, popraw test albo kod na podstawie source of truth,
3. zglos, jesli brak lokalnych warunkow do uruchomienia.
