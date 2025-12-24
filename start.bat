@echo off
echo ========================================
echo  SISTEMA DE LOGISTICA DE ESTOQUE
echo ========================================
echo.

echo Verificando Python...
python --version
if %errorlevel% neq 0 (
    echo Python nao encontrado! Instale Python 3.8 ou superior.
    pause
    exit /b 1
)

echo.
echo Verificando dependencias...
pip list | find "Flask" >nul
if %errorlevel% neq 0 (
    echo Instalando dependencias...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo Erro ao instalar dependencias!
        pause
        exit /b 1
    )
) else (
    echo Dependencias OK!
)

echo.
echo Testando conexao com MySQL...
cd database
python test_connection.py
if %errorlevel% neq 0 (
    echo Erro na conexao com o banco!
    echo Configure o MySQL e execute create_database.sql
    pause
    cd ..
    exit /b 1
)
cd ..

echo.
echo ========================================
echo  INICIANDO SERVIDOR...
echo ========================================
echo.
echo Acesse: http://localhost:5000
echo Pressione Ctrl+C para parar
echo.

python app.py