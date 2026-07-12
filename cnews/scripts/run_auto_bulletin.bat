@echo off
REM batch script helper to run auto_bulletin.py with the virtualenv Python interpreter

set PYTHON_PATH="C:\Users\grego\Documents\DEV_DIVERS\ia-automation\.venv\Scripts\python.exe"
set SCRIPT_PATH="C:\Users\grego\Documents\DEV_DIVERS\cnews\scripts\auto_bulletin.py"

%PYTHON_PATH% %SCRIPT_PATH% %*
