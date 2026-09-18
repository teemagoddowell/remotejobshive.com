FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Run via a simple, reliable sleep loop (every 2.4 hours = 10 runs per 24h)
CMD ["python", "-u", "-c", "import subprocess, time; [subprocess.run(['python', 'main.py']) or time.sleep(8640) for _ in iter(int, 1)]"]
# CMD ["python", "-u", "-c", "import subprocess, time; [subprocess.run(['python', 'main.py']) or time.sleep(4000) for _ in iter(int, 1)]"]

