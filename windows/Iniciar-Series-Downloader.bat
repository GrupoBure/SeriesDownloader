@echo off
title Series Downloader - Puente local
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0SeriesDownloader-Bridge.ps1"
pause
