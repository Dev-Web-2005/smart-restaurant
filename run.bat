@echo off
echo ========================================
echo Starting Smart Restaurant Services
echo ========================================
echo.

:: Get the current directory
set ROOT_DIR=%~dp0

:: Check if install flag is provided
set INSTALL_FLAG=%1
set INSTALL_DEPS=0

if /i "%INSTALL_FLAG%"=="i" (
    set INSTALL_DEPS=1
    echo Mode: Install dependencies and start services
) else (
    echo Mode: Start services only
)
echo.

:: Backend services array
set "services=identity notification product profile table kitchen order waiter api-gateway"

:: Install and start backend services
echo [1/2] Starting Backend Services...
echo.

for %%s in (%services%) do (
    echo ----------------------------------------
    echo Processing: %%s
    echo ----------------------------------------
    
    cd /d "%ROOT_DIR%src\backend\%%s"
    
    if %INSTALL_DEPS%==1 (
        echo Installing dependencies for %%s...
        call npm install
        if errorlevel 1 (
            echo ERROR: Failed to install dependencies for %%s
            pause
            exit /b 1
        )
    ) else (
        if not exist "node_modules\" (
            echo WARNING: node_modules not found for %%s
            echo Please run with 'i' flag to install dependencies
            pause
            exit /b 1
        )
    )
    
    echo Starting %%s in background...
    start "%%s" cmd /k "npm run start:dev"
    
    :: Wait a bit between service starts
    timeout /t 3 /nobreak >nul
    
    echo %%s started successfully!
    echo.
)

:: Install and start frontend
echo [2/2] Starting Frontend...
echo ----------------------------------------
cd /d "%ROOT_DIR%src\frontend"

if %INSTALL_DEPS%==1 (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    if not exist "node_modules\" (
        echo WARNING: node_modules not found for frontend
        echo Please run with 'i' flag to install dependencies
        pause
        exit /b 1
    )
)

echo Starting frontend development server...
start "Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo All services started successfully!
echo ========================================
echo.
echo Services running:
for %%s in (%services%) do (
    echo   - %%s
)
echo   - frontend
echo.
echo Press any key to return to console...
pause >nul