@echo off
title バレンタイン撲滅委員会 - 起動中...

cd /d "%~dp0app"

if not exist "node_modules" (
    echo 初回起動のため、必要なファイルをインストールします...
    echo しばらくお待ちください。
    call npm install
)

set URL=http://localhost:5173

echo.
echo バレンタイン撲滅委員会のサーバーを起動しています...
echo 別ウィンドウが開きます。閉じずにそのままにしておいてください。
echo ゲームを終了するときは、そのウィンドウを閉じてください。
echo.

start "バレンタイン撲滅委員会 - サーバー" cmd /k "chcp 65001 >nul && npm run dev"

echo サーバーの起動を待っています...

set /a COUNT=0

:WAIT_LOOP
curl.exe -s -o nul --max-time 1 %URL%
if %errorlevel%==0 goto SERVER_READY

set /a COUNT+=1
if %COUNT% geq 40 goto TIMEOUT

timeout /t 1 /nobreak >nul
goto WAIT_LOOP

:SERVER_READY
echo 起動しました。
start "" "%URL%"
echo.
echo ブラウザが自動で開かない場合は、次のアドレスを直接開いてください。
echo %URL%
echo.
exit /b 0

:TIMEOUT
echo.
echo サーバーの起動確認ができませんでした。
echo 別ウィンドウに開いた「サーバー」画面にエラーが出ていないか確認してください。
echo エラーが無ければ、少し待ってから %URL% を直接開いてください。
echo.
pause
exit /b 1
