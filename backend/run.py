from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from app import create_app
from app.extensions import db

app = create_app()


@app.shell_context_processor
def shell_context():
    return {"db": db}


if __name__ == "__main__":
    app.run(debug=True)
