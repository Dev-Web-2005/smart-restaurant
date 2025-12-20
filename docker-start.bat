@echo off
echo ================================================
echo Docker All-in-One Local Test
echo ================================================
echo.

cd deploy

echo [1/3] Building Docker image...
docker build -f Dockerfile.all-in-one -t smart-restaurant:latest ..

if %errorlevel% neq 0 (
    echo Error: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Stopping old container...
docker stop smart-restaurant 2>nul
docker rm smart-restaurant 2>nul

echo.
echo [3/3] Starting container...
docker run -d ^
    --name smart-restaurant ^
    -p 8888:8888 ^
    -e NODE_ENV=production ^
    -e DATABASE_HOST=aws-1-ap-south-1.pooler.supabase.com ^
    -e DATABASE_PORT=6543 ^
    -e DATABASE_USERNAME=postgres.vzfhpiietyrgfobaxwhj ^
    -e DATABASE_PASSWORD=Cong2642005@@ ^
    -e DATABASE_NAME=postgres ^
    -e HOST_DB=aws-1-ap-south-1.pooler.supabase.com ^
    -e PORT_DB=6543 ^
    -e USERNAME_DB=postgres.vzfhpiietyrgfobaxwhj ^
    -e PASSWORD_DB=Cong2642005@@ ^
    -e DATABASE_DB=postgres ^
    -e JWT_SECRET=test-secret-key-for-development ^
    -e JWT_EXPIRATION=7d ^
    -e JWT_REFRESH_SECRET=test-refresh-secret-key ^
    -e JWT_REFRESH_EXPIRATION=30d ^
    -e IDENTITY_API_KEY=lethanhcong ^
    -e PROFILE_API_KEY=lethanhcong ^
    -e PRODUCT_API_KEY=lethanhcong ^
    -e TABLE_API_KEY=lethanhcong ^
    -e API_GATEWAY_PORT=8888 ^
    -e IDENTITY_PORT=8080 ^
    -e PROFILE_PORT=8081 ^
    -e PRODUCT_PORT=8082 ^
    -e TABLE_PORT=8083 ^
    -e HOST_IDENTITY_SERVICE=localhost ^
    -e PORT_IDENTITY_SERVICE=8080 ^
    -e HOST_PROFILE_SERVICE=localhost ^
    -e PORT_PROFILE_SERVICE=8081 ^
    -e HOST_PRODUCT_SERVICE=localhost ^
    -e PORT_PRODUCT_SERVICE=8082 ^
    -e HOST_TABLE_SERVICE=localhost ^
    -e PORT_TABLE_SERVICE=8083 ^
    smart-restaurant:latest

if %errorlevel% neq 0 (
    echo Error: Container failed to start!
    pause
    exit /b 1
)

echo.
echo ================================================
echo Container started successfully!
echo API Gateway: http://localhost:8888
echo ================================================
echo.
echo View logs: docker logs -f smart-restaurant
echo Stop: docker stop smart-restaurant
echo.
pause
