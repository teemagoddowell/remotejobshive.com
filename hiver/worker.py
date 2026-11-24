import subprocess
import time

while True:
    print("[*] Worker: Initiating batch sync...", flush=True)
    subprocess.run(["python", "main.py"])
    print("[*] Worker: Sleeping for 4 hours until next cycle...", flush=True)
    time.sleep(14400)
