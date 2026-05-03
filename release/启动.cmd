@echo off
title TaskFlow Server

echo ========================================
echo   TaskFlow Server
echo ========================================
echo.

where python >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON=python"
    goto python_found
)

where python3 >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON=python3"
    goto python_found
)

where py >nul 2>&1
if %errorlevel% equ 0 (
    set "PYTHON=py -3"
    goto python_found
)

echo Python not found.
echo Install from https://www.python.org/downloads/
echo.
pause
exit /b 1

:python_found
cd /d "%~dp0"
echo Starting server on http://localhost:8080
start http://localhost:8080
%PYTHON% -m http.server 8080
pause
