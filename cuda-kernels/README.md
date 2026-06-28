# CUDA 算子入门

## 目标

从最小 CUDA kernel 开始，逐步理解 GPU 编程模型、内存层级、线程组织、矩阵乘法优化和 attention 相关算子。

## 路线

1. CUDA 编程模型：grid、block、thread、warp。
2. 内存层级：global memory、shared memory、register。
3. 向量加法 kernel。
4. 矩阵乘法 naive 实现。
5. tiled matmul。
6. softmax kernel。
7. attention 前向的最小实现。
8. 结合 profiling 分析瓶颈。

## 记录格式

```text
算子目标：
输入输出 shape：
naive 实现：
优化点：
性能数据：
问题：
```

