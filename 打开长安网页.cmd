@echo off
cd /d "%~dp0"
python "%~dp0preview.py"
if errorlevel 1 pause
