"""Day 3 reference lab: compare static batching and iteration-level scheduling."""

from __future__ import annotations

import argparse
from dataclasses import dataclass


@dataclass
class Request:
    request_id: str
    output_tokens: int
    arrival: int
    first_token: int | None = None
    finish: int | None = None


def static_batch(requests: list[Request]) -> list[Request]:
    clock = max(request.arrival for request in requests)
    for request in requests:
        request.first_token = clock + 1
        request.finish = clock + request.output_tokens
    return requests


def continuous_batch(
    requests: list[Request], max_requests: int, max_tokens: int
) -> list[Request]:
    waiting = sorted(requests, key=lambda item: item.arrival)
    running: list[Request] = []
    finished: list[Request] = []
    clock = 0

    while waiting or running:
        while waiting and len(running) < max_requests:
            if waiting[0].arrival > clock:
                break
            running.append(waiting.pop(0))

        token_budget = max_tokens
        for request in list(running):
            if token_budget <= 0:
                break
            if request.first_token is None:
                request.first_token = clock + 1
            request.output_tokens -= 1
            token_budget -= 1
            if request.output_tokens == 0:
                request.finish = clock + 1
                running.remove(request)
                finished.append(request)

        clock += 1
        if not running and waiting:
            clock = max(clock, waiting[0].arrival)

    return sorted(finished, key=lambda item: item.request_id)


def print_results(title: str, requests: list[Request]) -> None:
    print(f"\n{title}")
    print("id  first_token  finish")
    for request in requests:
        print(f"{request.request_id}   {request.first_token:>10}  {request.finish:>6}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-requests", type=int, default=2)
    parser.add_argument("--max-tokens", type=int, default=32)
    args = parser.parse_args()

    source = [
        Request("A", output_tokens=8, arrival=0),
        Request("B", output_tokens=32, arrival=1),
        Request("C", output_tokens=12, arrival=2),
    ]
    static = [Request(item.request_id, item.output_tokens, item.arrival) for item in source]
    dynamic = [Request(item.request_id, item.output_tokens, item.arrival) for item in source]
    print_results("static batch", static_batch(static))
    print_results(
        "continuous batch",
        continuous_batch(dynamic, args.max_requests, args.max_tokens),
    )


if __name__ == "__main__":
    main()
