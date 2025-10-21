@echo off
echo Starting Smart Assistant Server...
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies
    pause
    exit /b 1
)

echo Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo Failed to install client dependencies
    pause
    exit /b 1
)

cd ..
echo.
echo Dependencies installed successfully!
echo.
echo Starting the application...
echo Server will run on http://localhost:5000
echo Client will run on http://localhost:3000
echo.

call npm run dev
