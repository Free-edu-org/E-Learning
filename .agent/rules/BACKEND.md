---
trigger: always_on
---

# Backend Standards: FreeEdu

## Stack
- **Runtime:** Java 25
- **Framework:** Spring Boot 4.0.1 (Spring WebFlux)
- **Database:** MySQL + Flyway
- **Mapping:** MapStruct

## Coding Skills & Flow
- **Reactive Strategy:** Ponieważ używamy blokującego JPA w WebFlux, każda operacja repozytorium MUSI być oddelegowana:
  ```java
  public Mono<UserDto> getUser(Long id) {
      return Mono.fromCallable(() -> repository.findById(id))
                 .subscribeOn(Schedulers.boundedElastic())
                 .map(mapper::toDto);
  }