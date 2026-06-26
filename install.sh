#!/bin/bash
# FreeEdu VPS Installation Script (Wariant II)
# Ten skrypt instaluje środowisko Docker i wdraża system FreeEdu na czystym serwerze Linux (Ubuntu/Debian)

set -e

echo "Rozpoczynanie instalacji platformy FreeEdu..."

# 1. Sprawdzenie, czy skrypt jest uruchomiony jako root
if [ "$EUID" -ne 0 ]; then 
  echo "Proszę uruchomić instalator jako root (np. sudo ./install.sh)"
  exit 1
fi

# 2. Instalacja zależności i Dockera (jeśli nie istnieje)
if ! command -v docker &> /dev/null; then
    echo "Instalacja silnika Docker..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg lsb-release
    mkdir -m 0755 -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    echo "Docker jest już zainstalowany."
fi

# 3. Utworzenie struktury katalogów
echo "Tworzenie struktury katalogów /opt/freeedu..."
mkdir -p /opt/freeedu
cd /opt/freeedu

# 4. Pobieranie pliku docker-compose.prod.yml z repozytorium
echo "Pobieranie konfiguracji wdrożeniowej..."
# Zakładamy, że ten skrypt będzie leżał w tym samym miejscu lub pobierze compose za pomocą curla. Dla uproszczenia kopiujemy lokalny jeśli istnieje:
if [ -f "docker-compose.prod.yml" ]; then
    echo "Plik docker-compose.prod.yml znaleziony lokalnie."
else
    echo "Zaleca się pobranie najnowszego docker-compose.prod.yml."
fi

# 5. Tworzenie lub weryfikacja pliku .env (Feature Toggles i Konfiguracja)
if [ ! -f ".env" ]; then
    echo "Generowanie domyślnego pliku .env..."
    cat <<EOF > .env
# --- Konfiguracja Sieciowa i SSL (Caddy) ---
# Podepnij pod ten adres rekord A kierujący na IP tego serwera (VPS)
DOMAIN_NAME=freeedu.twojadomena.pl

# --- Konfiguracja Bazy Danych ---
DB_PASSWORD=$(openssl rand -hex 16)
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 24)

# --- Zabezpieczenia JWT ---
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_EXPIRATION=86400000

# --- Feature Toggles (Premium Moduły) ---
# FEATURE_PREMIUM_ANALYTICS=false
# FEATURE_CUSTOM_ACHIEVEMENTS=false

# --- Inne ---
MAIL_ENABLED=false
EOF
    echo "Plik .env wygenerowany. Zaktualizuj adres DOMAIN_NAME przed uruchomieniem produkcyjnym!"
fi

# 5.5 Generowanie pliku Caddyfile
if [ ! -f "Caddyfile" ]; then
    echo "Generowanie konfiguracji serwera Caddy (Reverse Proxy + Let's Encrypt)..."
    cat <<EOF > Caddyfile
{\$DOMAIN_NAME} {
    # Przekierowanie ruchu do kontenera frontendu (Nginx), 
    # który obsłuży pliki statyczne oraz zrzuci /api/ do backendu
    reverse_proxy frontend:80
}
EOF
fi

# 6. Uruchomienie platformy
echo "Pobieranie najnowszych obrazów FreeEdu..."
# UWAGA: Jeśli rejestr (GHCR) jest prywatny, serwer VPS musi się uwierzytelnić (np. za pomocą Personal Access Token - PAT)
# Odkomentuj i uzupełnij poniższą linię, jeśli dostarczasz klientowi dane logowania do pobierania obrazów:
# docker login ghcr.io -u NAZWA_UZYTKOWNIKA -p HASLO_TOKENA

docker compose -f docker-compose.prod.yml pull

echo "Uruchamianie środowiska FreeEdu..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "==========================================================="
echo "Instalacja zakończona sukcesem!"
echo "System FreeEdu działa w tle. (docker ps)"
echo "Jeśli wymagana jest płatna funkcja (np. analityka), edytuj plik /opt/freeedu/.env i wykonaj 'docker compose up -d'."
echo "==========================================================="
