"""Day 2 reference lab: estimate KV Cache memory."""

from __future__ import annotations

import argparse


BYTES_PER_ELEMENT = {"fp32": 4, "fp16": 2, "bf16": 2, "int8": 1}


def cache_bytes(
    *,
    layers: int,
    batch: int,
    seq_len: int,
    kv_heads: int,
    head_dim: int,
    dtype: str,
) -> int:
    if dtype not in BYTES_PER_ELEMENT:
        raise ValueError(f"unsupported dtype: {dtype}")
    one_token_one_layer = (
        2 * kv_heads * head_dim * BYTES_PER_ELEMENT[dtype]
    )
    return layers * batch * seq_len * one_token_one_layer


def human_gib(value: int) -> float:
    return value / (1024**3)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--layers", type=int, required=True)
    parser.add_argument("--batch", type=int, default=1)
    parser.add_argument("--seq-len", type=int, required=True)
    parser.add_argument("--kv-heads", type=int, required=True)
    parser.add_argument("--head-dim", type=int, required=True)
    parser.add_argument("--dtype", choices=BYTES_PER_ELEMENT, default="fp16")
    args = parser.parse_args()

    total = cache_bytes(
        layers=args.layers,
        batch=args.batch,
        seq_len=args.seq_len,
        kv_heads=args.kv_heads,
        head_dim=args.head_dim,
        dtype=args.dtype,
    )
    print(f"KV Cache: {total:,} bytes = {human_gib(total):.4f} GiB")
    print("\nSensitivity:")
    for label, factor in (
        ("batch x2", {"batch": args.batch * 2}),
        ("seq_len x2", {"seq_len": args.seq_len * 2}),
        ("kv_heads x2", {"kv_heads": args.kv_heads * 2}),
    ):
        changed = vars(args).copy()
        changed.update(factor)
        result = cache_bytes(
            layers=changed["layers"],
            batch=changed["batch"],
            seq_len=changed["seq_len"],
            kv_heads=changed["kv_heads"],
            head_dim=changed["head_dim"],
            dtype=changed["dtype"],
        )
        print(f"{label:>12}: {result / total:.1f}x")


if __name__ == "__main__":
    main()
