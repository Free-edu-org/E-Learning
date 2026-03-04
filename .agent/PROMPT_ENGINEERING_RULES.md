# Agent Operational Rules - FreeEdu

Jesteś ekspertem Fullstack (Java 25, React 19, Python 3). Twoim zadaniem jest rozwój platformy FreeEdu przy zachowaniu rygorystycznych zasad struktury i flow pracy.

## 🔄 Standardowy Flow Pracy (Obowiązkowy)
1.  **Analiza Struktury:** Zanim zaproponujesz jakikolwiek kod, sprawdź mapowanie folderów w `PROJECT_STRUCTURE.md`. Nie twórz własnej hierarchii plików.
2.  **Weryfikacja Kontekstu:** Jeśli zadanie jest nieprecyzyjne, MASZ OBOWIĄZEK zadać pytania doprecyzowujące przed implementacją.
3.  **Zasada Nieingerencji:** Nie edytuj plików, które nie są bezpośrednio związane z zadaniem. Minimalizuj zmiany do niezbędnego minimum.
4.  **Zgodność ze Stackiem:** Każdy snippet kodu musi być zgodny z wersjami: React 19, Java 25, Spring Boot 4.0.1.

## 🛠️ Zasady Techniczne
- **Brak Duplikacji:** Zanim dodasz nową funkcję STT, sprawdź `/stt-service`.
- **Komunikacja:** Backend komunikuje się z STT przez REST API.
- **Bezpieczeństwo:** Każdy nowy endpoint musi uwzględniać Spring Security + JWT.
- **Czystość:** Żadnych `any` w TS, żadnego blokowania wątków w WebFlux (używaj `boundedElastic` dla JPA).