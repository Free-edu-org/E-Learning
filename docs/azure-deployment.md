# Przewodnik Wdrożenia Produkcyjnego Azure

Dokument opisuje proces wdrożenia aplikacji FreeEdu na platformę Azure przy użyciu **Azure Container Apps** oraz usług towarzyszących.

## 1. Architektura Docelowa
- **Frontend & Backend & STT**: Azure Container Apps (ACA).
- **Database**: Azure Database for MySQL (Flexible Server).
- **Registry**: Azure Container Registry (ACR).
- **Storage**: Azure Blob Storage (dla uploadów).
- **Mail**: Zewnętrzny serwer SMTP (np. SendGrid).

## 2. Kolejność Tworzenia Zasobów

1. **Resource Group**: Wspólna grupa dla wszystkich zasobów.
2. **Azure Container Registry**: Do przechowywania obrazów Docker.
3. **Azure Database for MySQL**: Wybrać **Flexible Server** (wspierana wersja **8.0**). Skonfigurować sieć (Allow access to Azure services).
4. **Azure Storage Account**: Kontener dla plików (Blob Storage).
5. **Azure Container Apps Environment**: Środowisko dla kontenerów.

## 3. Przygotowanie Obrazów (Docker)

```bash
# Logowanie do ACR
az acr login --name <registry_name>

# Build i Push Backend
docker build -t <registry_name>.azurecr.io/freeedu-backend:latest ./backend
docker push <registry_name>.azurecr.io/freeedu-backend:latest

# Build i Push Frontend
docker build -t <registry_name>.azurecr.io/freeedu-frontend:latest ./frontend
docker push <registry_name>.azurecr.io/freeedu-frontend:latest

# Build i Push STT
docker build -t <registry_name>.azurecr.io/freeedu-stt:latest ./stt-service
docker push <registry_name>.azurecr.io/freeedu-stt:latest
```

## 4. Przykładowa Komenda Wdrożenia (CLI)

```bash
# Wdrożenie Backend
az containerapp create \
  --name freeedu-backend \
  --resource-group <resource_group> \
  --environment <aca_env> \
  --image <registry_name>.azurecr.io/freeedu-backend:latest \
  --target-port 8080 \
  --ingress external \
  --env-vars \
    DB_HOST=<db_host> \
    DB_PORT=3306 \
    DB_NAME=freeedu \
    DB_USER=<db_user> \
    DB_PASSWORD=secretpassword \
    JWT_SECRET_KEY=secretjwt \
    FRONTEND_BASE_URL=https://freeedu.pl \
    STT_BASE_URL=http://freeedu-stt \
    SPRING_PROFILES_ACTIVE=prod

> [!IMPORTANT]
> Wszystkie sekrety (jak `DB_PASSWORD` czy `JWT_SECRET_KEY`) muszą zostać nadpisane rzeczywistymi, bezpiecznymi wartościami w panelu Azure (lub zaciągnięte z Azure Key Vault). Wartości w `docker-compose.prod.yml` służą wyłącznie do lokalnych testów. Nie używaj domyślnych haseł w środowisku produkcyjnym.
```

## 5. Konfiguracja Domen i HTTPS
- ACA automatycznie zapewnia certyfikat SSL dla domeny `.azurecontainerapps.io`.
- W przypadku własnej domeny należy ją zweryfikować w sekcji `Custom domains` i przypisać certyfikat Managed.

## 6. Health Checks
Wszystkie serwisy posiadają wbudowane endpointy `/health` lub `/actuator/health`.
- ACA wykorzystuje je do Liveness i Readiness probes (skonfigurowane w Dockerfiles).

## 7. Skalowanie
- Zaleca się skalowanie `backend` w oparciu o CPU/Memory lub liczbę zapytań (KEDA).
- `stt-service` powinien mieć min-replicas=1 ze względu na czas ładowania modelu.
