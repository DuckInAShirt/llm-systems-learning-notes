"""Day 1 reference lab: simulate a small inference request timeline."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass


@dataclass
class Request:
    request_id: str
    prompt_tokens: int
    output_tokens: int
    arrival_ms: float
    prefill_start_ms: float = 0.0
    first_token_ms: float = 0.0
    finish_ms: float = 0.0


def simulate(request: Request) -> Request:
    """Use a deliberately simple cost model so the causal relationship is visible."""
    request.prefill_start_ms = request.arrival_ms
    prefill_ms = request.prompt_tokens * 0.4
    decode_ms = request.output_tokens * 1.2
    request.first_token_ms = request.prefill_start_ms + prefill_ms
    request.finish_ms = request.first_token_ms + decode_ms
    return request


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="lab01_results.json")
    args = parser.parse_args()

    requests = [
        Request("A", prompt_tokens=128, output_tokens=8, arrival_ms=0),
        Request("B", prompt_tokens=16, output_tokens=32, arrival_ms=1),
        Request("C", prompt_tokens=64, output_tokens=12, arrival_ms=2),
    ]
    results = [asdict(simulate(request)) for request in requests]
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(results, handle, indent=2)

    print("id  arrival  first_token  finish  ttft")
    for item in results:
        ttft = item["first_token_ms"] - item["arrival_ms"]
        print(
            f"{item['request_id']}   {item['arrival_ms']:>6.1f}"
            f"   {item['first_token_ms']:>10.1f}"
            f"   {item['finish_ms']:>6.1f}   {ttft:>5.1f}ms"
        )
    print(f"\nSaved {args.output}")


if __name__ == "__main__":
    main()
