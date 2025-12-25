from app import app
import sys

if __name__ == '__main__':
    try:
        print("Iniciando servidor Flask...")
        app.run(debug=True, host='127.0.0.1', port=5000, use_reloader=False)
    except Exception as e:
        print(f"Erro ao iniciar servidor: {e}")
        sys.exit(1)