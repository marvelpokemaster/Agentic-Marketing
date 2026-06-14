"""
main.py
────────
Entry point for the Lead Engine.

Usage:
    python main.py --mode 1    # Targeted lead discovery + outreach
    python main.py --mode 2    # Broadcast ad campaign + Instagram post
    python main.py --worker    # Starts the Celery worker process
"""

import sys
import asyncio
import subprocess

def print_banner():
    print("""
╔══════════════════════════════════════╗
║         LEAD ENGINE v2.0             ║
║  Group 2 — Adarsh Binu, Yadhu Vipin  ║
╚══════════════════════════════════════╝

  Mode 1  → Targeted Lead Discovery (Parallel Scrapers, Local or Celery)
  Mode 2  → Broadcast Ad Campaign + Instagram Post
  --worker→ Start Celery Worker Process
""")


def start_worker():
    print_banner()
    print("[System] Starting Celery worker for Lead Engine...")
    try:
        # Run Celery worker command using current python executable
        subprocess.run([
            sys.executable, "-m", "celery",
            "-A", "celery_app",
            "worker",
            "--loglevel=info"
        ])
    except KeyboardInterrupt:
        print("\n[System] Celery worker shut down.")
    except Exception as e:
        print(f"✗ Failed to start Celery worker: {e}")
        print("  Ensure Redis and Celery packages are properly installed.")
        sys.exit(1)


def main():
    # Handle worker command
    if len(sys.argv) >= 2 and sys.argv[1] == "--worker":
        start_worker()
        return

    print_banner()

    # Get mode from argument or prompt
    if len(sys.argv) >= 3 and sys.argv[1] == "--mode":
        mode = sys.argv[2]
    else:
        # Check if first arg is mode
        if len(sys.argv) >= 2 and sys.argv[1] in ["1", "2"]:
            mode = sys.argv[1]
        else:
            mode = input("  Which mode? (1 or 2): ").strip()

    if mode == "1":
        from mode1.targeted_leads import run_mode1
        asyncio.run(run_mode1())

    elif mode == "2":
        from mode2.broadcast_ad import run_mode2
        run_mode2()

    else:
        print("  Invalid mode. Use 1, 2, or start Celery worker with --worker.")
        sys.exit(1)


if __name__ == "__main__":
    main()