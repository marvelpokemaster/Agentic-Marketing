from celery import Celery
import config

app = Celery(
    "lead_engine",
    broker=config.CELERY_BROKER_URL,
    backend=config.CELERY_RESULT_BACKEND
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    imports=[
        "tasks.google_maps",
        "tasks.justdial",
        "tasks.indiamart",
        "tasks.merge",
    ],
    worker_prefetch_multiplier=1,
)

if __name__ == "__main__":
    app.start()
