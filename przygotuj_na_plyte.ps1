$source = "C:\Users\ludwi\Documents\E-Learning"
$destination = "C:\Users\ludwi\Documents\E-Learning_Tymczasowy_Folder"
$zipPath = "C:\Users\ludwi\Documents\E-Learning_Gotowe_Na_Plyte.zip"

Write-Host "Rozpoczynam przygotowanie projektu do nagrania na plyte..." -ForegroundColor Cyan

# 1. Kopiowanie projektu do folderu tymczasowego
Write-Host "Kopiowanie plikow (to moze chwile potrwac)..."
if (Test-Path $destination) { Remove-Item -Path $destination -Recurse -Force }
Copy-Item -Path $source -Destination $destination -Recurse -Force

# 2. Usuwanie niepotrzebnych plikow budowania i repozytorium
Write-Host "Oczyszczanie ze zbednych plikow (node_modules, .git, target, dist itp.)..."
$foldersToRemove = @(".git", ".idea", ".vscode", "node_modules", "target", "dist", ".m2", ".mvn", "__pycache__", "logs", ".tmp-sai-final-docx")
$filesToRemove = @("test.log", "backend.log", "eslint_report.json")

foreach ($folder in $foldersToRemove) {
    Get-ChildItem -Path $destination -Recurse -Directory -Filter $folder | Remove-Item -Recurse -Force
}

foreach ($file in $filesToRemove) {
    Get-ChildItem -Path $destination -Recurse -File -Filter $file | Remove-Item -Force
}

# 3. Dodatkowe usuniecie samego skryptu pakujacego z paczki
$scriptInDest = "$destination\przygotuj_na_plyte.ps1"
if (Test-Path $scriptInDest) { Remove-Item $scriptInDest -Force }

# 4. Pakowanie do ZIP
Write-Host "Pakowanie do archiwum ZIP..."
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$destination\*" -DestinationPath $zipPath

# 5. Sprzatanie
Write-Host "Sprzatanie folderow tymczasowych..."
Remove-Item -Path $destination -Recurse -Force

Write-Host "GOTOWE! Twoj wyczyszczony projekt jest spakowany tutaj:" -ForegroundColor Green
Write-Host $zipPath -ForegroundColor Yellow
Write-Host "Mozesz nagrac ten plik na plyte bezposrednio, albo rozpakowac i nagrac same pliki."
