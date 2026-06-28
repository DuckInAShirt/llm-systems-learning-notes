# LLM Systems Learning Notes

一个公开知识库，用来系统整理大模型系统、推理框架、CUDA 算子、K8S 调度、RLHF/GRPO 以及实习项目复盘。

我会把学习过程中的“看不懂”“被维度绕晕”“源码里不知道为什么这么写”都拆开记录下来。目标不是堆链接，而是把一个问题讲到自己真的能复述、能画图、能写代码验证。

## 目录

### 基础概念

- [Transformer 基础：从 Embedding 到 Attention 输出](foundations/transformer/from-embedding-to-attention.md)
- [Linux 文档阅读：man page、通配符和文件层级](foundations/linux/man-page-reading.md)

### vLLM / SGLang 源码阅读

- [vLLM 阅读路线](source-reading/vllm/README.md)
- [SGLang 阅读路线](source-reading/sglang/README.md)

### CUDA 算子入门

- [CUDA 算子学习路线](cuda-kernels/README.md)

### K8S 调度器源码阅读

- [K8S Scheduler 阅读路线](k8s-scheduler/README.md)

### RLHF / GRPO

- [RLHF 与 GRPO 学习路线](rlhf-grpo/README.md)

### 实习 / 项目复盘

- [项目复盘模板](project-reviews/README.md)

### 实验

- [实验记录](labs/README.md)

### 资料

- [资源索引](resources/README.md)

## 写作原则

1. 先讲直觉，再讲公式。
2. 先画清楚 shape，再写代码。
3. 对源码阅读，记录“入口、主流程、关键数据结构、疑问、验证方式”。
4. 对论文复现，记录“问题、方法、公式、伪代码、最小实验、复现坑”。
5. 对项目复盘，记录“背景、目标、方案、结果、问题、下次怎么做”。

## 当前进度

- Transformer embedding、QKV、多头注意力、LayerNorm、残差连接：已开始整理。
- Linux man page 阅读方法：已开始整理。
- vLLM / SGLang / CUDA / K8S / RLHF-GRPO：路线占位，后续逐步补充。

