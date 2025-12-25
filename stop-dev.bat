@echo off
REM Stop all services
pm2 stop all

REM Delete all processes
pm2 delete all
