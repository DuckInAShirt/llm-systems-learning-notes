# AI Infra Coach Labs

这些 Lab 和网页中的 30 天课程一一对应。

## 使用方式

1. 先看网页当天的讲义和步骤。
2. 不要直接复制参考实现，先自己写出最小版本。
3. 再运行 `day-01` 到 `day-05` 的参考实现，对照输出和自己的结果。
4. 把结果、图表和没有想通的问题记录回网页当天的笔记。

第一周的 5 个 Lab 可以只用 Python 标准库运行：

```bash
python labs/day-01/request_lifecycle.py
python labs/day-02/kv_cache_size.py --layers 32 --kv-heads 8 --head-dim 128 --seq-len 4096 --dtype fp16
python labs/day-03/scheduler_sim.py --max-requests 2 --max-tokens 32
python labs/day-04/block_allocator.py --blocks 16 --block-size 2
python labs/day-05/validate_config.py labs/day-05/benchmark-config.json
```

Day 6 之后的 Lab 需要 vLLM、GPU 或源码环境，网页中的步骤就是实验协议和验收标准。先完成当天的 CPU/源码部分，再接入 4×A30。
