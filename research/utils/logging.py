import logging
import json

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)

    def _log(self, level: int, message: str, **kwargs):
        log_entry = {"message": message, **kwargs}
        self.logger.log(level, json.dumps(log_entry))

    def info(self, message: str, **kwargs):
        self._log(logging.INFO, message, **kwargs)

    def error(self, message: str, **kwargs):
        self._log(logging.ERROR, message, **kwargs)

    def warning(self, message: str, **kwargs):
        self._log(logging.WARNING, message, **kwargs)

def get_logger(name: str) -> StructuredLogger:
    return StructuredLogger(name)
