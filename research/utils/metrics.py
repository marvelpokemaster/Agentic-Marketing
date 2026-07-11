from collections import defaultdict
from typing import Dict

class MetricsRegistry:
    def __init__(self):
        self.counters: Dict[str, int] = defaultdict(int)
        self.timers: Dict[str, float] = defaultdict(float)

    def increment(self, name: str, value: int = 1):
        self.counters[name] += value

    def record_time(self, name: str, seconds: float):
        self.timers[name] += seconds

metrics = MetricsRegistry()
