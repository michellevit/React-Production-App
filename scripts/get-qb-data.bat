@echo off
cd C:\Users\Michelle Flandin\Documents\Coding_Projects\Production-Planner

:: Activate the virtual environment
call powershell -NoProfile -ExecutionPolicy Bypass -Command ".\venv\Scripts\Activate.ps1"

@REM for first time app deployment: pip install pyodbc

:: Run Python script
python .\django\api\scripts\check_quickbooks.py

pause
