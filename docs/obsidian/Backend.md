# Backend

Backend to aplikacja Spring Boot 4.0.1 na Java 25. Uzywa WebFlux jako warstwy HTTP, JPA do dostepu do MySQL, Flyway do migracji, Spring Security z JWT, Lombok i MapStruct.

Glowne moduly:
- [[Security]]
- [[Domena - uzytkownicy]]
- [[Domena - grupy]]
- [[Domena - lekcje]]
- [[Domena - zadania]]
- [[Domena - postep studenta]]
- [[Admin Dashboard]]
- [[Teacher Dashboard]]
- [[Student Dashboard]]
- [[Bledy API]]

Warstwy w kazdym module backendowym:
- controller: endpointy HTTP
- service: logika biznesowa
- repository: JPA
- model: encje
- dto: kontrakty wejscia i wyjscia
- exception: kody bledow domenowych

Najwazniejsze pliki:
- [BackendApplication.java](../../backend/src/main/java/pl/freeedu/backend/BackendApplication.java)
- [pom.xml](../../backend/pom.xml)
- [application.yaml](../../backend/src/main/resources/application.yaml)
