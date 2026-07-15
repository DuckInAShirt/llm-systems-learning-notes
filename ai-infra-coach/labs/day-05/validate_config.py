"""Day 5 reference lab: validate a benchmark configuration."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


REQUIRED = (
    "model",
    "dtype",
    "tp",
    "concurrency",
    "prompt_tokens",
    "output_tokens",
    "warmup",
    "repeats",
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("config", type=Path)
    args = parser.parse_args()

    config = json.loads(args.config.read_text(encoding="utf-8"))
    missing = [key for key in REQUIRED if key not in config]
    if missing:
        raise SystemExit(f"missing required fields: {', '.join(missing)}")

    positive = (
        "tp",
        "concurrency",
        "prompt_tokens",
        "output_tokens",
        "warmup",
        "repeats",
    )
    invalid = [key for key in positive if config[key] <= 0]
    if invalid:
        raise SystemExit(f"must be positive: {', '.join(invalid)}")

    print("valid benchmark config")
    for key in REQUIRED:
        print(f"{key:>16}: {config[key]}")


if __name__ == "__main__":
    main()
