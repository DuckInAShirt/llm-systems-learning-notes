"""Day 4 reference lab: a tiny KV block allocator with reference counting."""

from __future__ import annotations

import argparse
import math
from dataclasses import dataclass


@dataclass
class PhysicalBlock:
    block_id: int
    ref_count: int = 0


class BlockAllocator:
    def __init__(self, block_count: int, block_size: int) -> None:
        self.block_size = block_size
        self.blocks = [PhysicalBlock(index) for index in range(block_count)]
        self.tables: dict[str, list[int]] = {}

    def allocate(self, request_id: str, token_count: int) -> list[int]:
        needed = math.ceil(token_count / self.block_size)
        free = [block for block in self.blocks if block.ref_count == 0]
        if len(free) < needed:
            raise RuntimeError("out of physical blocks")
        selected = free[:needed]
        for block in selected:
            block.ref_count = 1
        self.tables[request_id] = [block.block_id for block in selected]
        return self.tables[request_id]

    def share_prefix(self, source: str, target: str, block_count: int) -> None:
        prefix = self.tables[source][:block_count]
        for block_id in prefix:
            self.blocks[block_id].ref_count += 1
        self.tables[target] = list(prefix)

    def free(self, request_id: str) -> None:
        for block_id in self.tables.pop(request_id, []):
            self.blocks[block_id].ref_count -= 1

    def snapshot(self) -> dict[str, object]:
        return {
            "tables": self.tables,
            "refs": {block.block_id: block.ref_count for block in self.blocks},
            "free": sum(block.ref_count == 0 for block in self.blocks),
        }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--blocks", type=int, default=16)
    parser.add_argument("--block-size", type=int, default=2)
    args = parser.parse_args()

    allocator = BlockAllocator(args.blocks, args.block_size)
    print("A:", allocator.allocate("A", token_count=5))
    print("B:", allocator.allocate("B", token_count=3))
    print("share A prefix with C")
    allocator.share_prefix("A", "C", block_count=2)
    print(allocator.snapshot())
    allocator.free("A")
    print("after free A:", allocator.snapshot())
    allocator.free("C")
    allocator.free("B")
    print("after free all:", allocator.snapshot())


if __name__ == "__main__":
    main()
