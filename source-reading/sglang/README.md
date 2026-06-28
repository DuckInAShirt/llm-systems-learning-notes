# SGLang 源码阅读

## 目标

理解 SGLang 的 serving 架构、调度逻辑、RadixAttention、KV cache 复用、前后端交互和结构化生成能力。

## 计划

1. 跑通本地 demo。
2. 梳理 server 启动入口。
3. 阅读请求接收、tokenization、调度和执行路径。
4. 阅读 RadixAttention / prefix cache 相关实现。
5. 对比 vLLM 的设计取舍。

## 对比关注点

```text
调度策略
KV cache 管理
prefix 复用
batching 方式
kernel 调用
服务接口
```

