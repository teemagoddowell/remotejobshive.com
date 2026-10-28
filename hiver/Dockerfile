FROM python:3.11-slim

# Install system certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Run every 4 hours (14,400 seconds) -> 6 runs/day = ~300 verified jobs/day safely under the 3k raw quota
CMD ["python", "-u", "-c", "import subprocess, time; \
while True: \
    print('[*] Worker: Initiating batch sync...', flush=True); \
    subprocess.run(['python', 'main.py']); \
    print('[*] Worker: Sleeping for 4 hours until next scheduled cycle...', flush=True); \
    time.sleep(14400)"]