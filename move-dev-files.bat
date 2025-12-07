@echo off
echo ========================================
echo   Moving development files to _dev/
echo ========================================
echo.

REM Создаём папку _dev если её нет
if not exist "_dev" mkdir _dev
if not exist "_dev\bot" mkdir _dev\bot

REM Перемещаем deployment скрипты
echo Moving deployment scripts...
if exist "deploy-site.bat" move "deploy-site.bat" "_dev\"
if exist "deploy-all.bat" move "deploy-all.bat" "_dev\"
if exist "DEPLOY_GUIDE.md" move "DEPLOY_GUIDE.md" "_dev\"

REM Перемещаем Python скрипты
echo Moving Python scripts...
if exist "server.py" move "server.py" "_dev\"
if exist "analyze_*.py" move "analyze_*.py" "_dev\"

REM Перемещаем CHANGELOG
echo Moving changelog...
if exist "CHANGELOG.md" move "CHANGELOG.md" "_dev\"

REM Перемещаем локальные файлы бота
echo Moving bot development files...
if exist "bot\local-bot.js" move "bot\local-bot.js" "_dev\bot\"
if exist "bot\test-bot.bat" move "bot\test-bot.bat" "_dev\bot\"
if exist "bot\LOCAL_TESTING.md" move "bot\LOCAL_TESTING.md" "_dev\bot\"
if exist "bot\SETUP_GUIDE.md" move "bot\SETUP_GUIDE.md" "_dev\bot\"

REM Копируем deploy.bat бота (оставляем в bot/ для удобства)
if exist "bot\deploy.bat" copy "bot\deploy.bat" "_dev\bot\" >nul

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Development files moved to _dev/
echo.
echo Files on GitHub will be:
echo - index.html, admin.html
echo - *.css, *.js
echo - assets/, candidates/
echo - bot/ (only production files)
echo - README.md, .nojekyll, .gitignore
echo.
echo Files in _dev/ (not on GitHub):
echo - deploy-*.bat
echo - DEPLOY_GUIDE.md
echo - CHANGELOG.md
echo - server.py
echo - bot/local-bot.js, bot/test-bot.bat
echo.
pause
