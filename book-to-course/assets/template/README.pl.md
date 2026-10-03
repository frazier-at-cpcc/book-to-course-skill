# Jak uruchomić kurs

**Najlepiej (zalecane):** uruchom `start.bat` (Windows) albo `./start.sh` (macOS/Linux). Wymagany jest Python 3.
Kurs otworzy się w przeglądarce pod adresem http://127.0.0.1:8765. Dzięki temu:

- Twój postęp zapisuje się w pliku `progress/progress.json` (możesz go skopiować na inny komputer),
- przycisk **▶ Uruchom testy** przy ćwiczeniach uruchamia testy jednostkowe jednym kliknięciem.

**Bez Pythona:** otwórz `index.html` dwuklikiem. Wszystko działa, ale postęp zapisuje się tylko w przeglądarce,
a testy z ćwiczeń uruchamiasz ręcznie w terminalu (polecenie jest pokazane przy każdym ćwiczeniu).

> Na Windowsie, jeśli polecenie `python3` nie działa, użyj `python` albo `py -3`.

## Ćwiczenia programistyczne

Każde ćwiczenie ma folder `exercises/<nazwa>/` z plikami startowymi i testami. Edytuj pliki startowe w swoim edytorze
i uruchamiaj testy, aż wszystkie przejdą. Testy możesz czytać — opisują, co program ma robić.

## Aktualizacja kursu o nowe rozdziały

Rozpakuj nową paczkę na starą (nadpisz pliki). Folder `progress/` nie jest w paczce, więc Twój postęp zostaje.
