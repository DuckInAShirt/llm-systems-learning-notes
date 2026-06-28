# Transformer 基础：从 Embedding 到 Attention 输出

这篇笔记整理 Transformer 里几个容易被 shape 绕晕的概念：embedding 维度、QKV 投影、多头注意力、`Attention @ V`、LayerNorm 和残差连接。

## 1. Token 如何变成向量

模型处理文本时，第一步不是直接处理字符串，而是把文本切成 token，再把每个 token 映射成一个向量。

如果序列里有 `T` 个 token，每个 token 用 `C` 维向量表示，那么输入 embedding 可以写成：

```text
[T, C]
```

带 batch 时通常写成：

```text
[B, T, C]
```

这里的 `C` 有很多名字：

```text
C = channel
  = feature dimension
  = embedding size
  = hidden size
  = model dimension
  = n_embd
```

在其他资料里也常用 `h` 表示同样的维度。

## 2. C 是超参数，但 embedding 里的值是参数

`C` 是每个 token 的描述维度数。比如：

```text
GPT-2 small: hidden size = 768
```

这个维度大小是训练前由模型设计者选定的，所以它是超参数。

但是 embedding 表里的具体数值是模型参数，会在训练中被更新：

```text
token embedding matrix:    [vocab_size, C]
position embedding matrix: [max_seq_len, C]
```

一句话区分：

```text
超参数 = 训练前定好的结构和训练规则
参数   = 训练过程中会被更新的数字
```

常见超参数：

```text
hidden size
num_layers
num_heads
learning rate
batch size
dropout rate
max sequence length
```

常见参数：

```text
embedding 表
W_Q, W_K, W_V
W_O
MLP 权重
LayerNorm 的 gamma / beta
```

## 3. LayerNorm：减均值，除标准差

标准化公式：

```text
x' = (x - mean) / std
```

直觉：

```text
减均值：把中心挪到 0
除标准差：把尺度调成 1
```

结果：

```text
mean(x') = 0
std(x') = 1
```

方差衡量一组数离平均值有多远：

```text
variance = [(x1 - μ)^2 + (x2 - μ)^2 + ... + (xn - μ)^2] / n
std = sqrt(variance)
```

在 LayerNorm 中，通常对每个 token 的 hidden vector 做标准化。也就是对这个 token 的 `C` 个维度求均值和标准差。

## 4. gamma 和 beta 是可训练参数

LayerNorm 常见公式：

```text
y = γ * ((x - mean) / std) + β
```

其中：

```text
mean/std：由当前输入算出来，不是训练参数
γ：可训练缩放参数
β：可训练平移参数
```

通常初始化：

```text
γ = 1
β = 0
```

它们被称为 learned weight 和 learned bias，所以不是超参数，而是模型参数。

加入 `γ` 和 `β` 的意义是：标准化让数值稳定，但模型仍然可以学习自己需要的缩放和平移。

## 5. QKV 投影发生在哪

QKV 投影发生在 self-attention 的开头。

简化流程：

```text
输入 X
  ↓
LayerNorm
  ↓
QKV projection
  ↓
Attention score: QK^T
  ↓
Softmax
  ↓
乘 V
  ↓
Output projection
  ↓
Residual connection
  ↓
MLP / FFN
```

QKV 投影就是把输入 `X` 分别线性变换成 `Q`、`K`、`V`：

```text
Q = X W_Q
K = X W_K
V = X W_V
```

也常合并成一次矩阵乘法：

```text
QKV = X W_QKV
```

常见 shape：

```text
X:     [B, T, C]
W_QKV: [C, 3C]
QKV:   [B, T, 3C]
```

再拆成：

```text
Q: [B, T, C]
K: [B, T, C]
V: [B, T, C]
```

## 6. 多头注意力：拆开，分别算，拼回来

多头注意力的核心不是变出多个完整的 hidden size，而是把 `C` 拆成几份：

```text
C = num_heads * d_head
```

例如：

```text
C = 768
num_heads = 12
d_head = 64
```

因为：

```text
768 = 12 * 64
```

Q/K/V 的 shape 变化：

```text
[B, T, C]
→ [B, T, num_heads, d_head]
→ [B, num_heads, T, d_head]
```

每个 head 单独做 attention：

```text
Q @ K^T → softmax → 乘 V
```

每个 head 输出：

```text
[B, T, d_head]
```

多个 head 拼回来：

```text
[B, T, num_heads, d_head] → [B, T, C]
```

一句话：

```text
多头 = 对 hidden 维度做拆分，分别 attention，再拼回 hidden 维度
```

## 7. 输出投影矩阵 W_O

多个 head 拼接后，还会经过输出投影：

```text
O = concat(heads) W_O
```

shape：

```text
concat(heads): [B, T, C]
W_O:           [C, C]
O:             [B, T, C]
```

`W_O` 的作用是把各个 head 的结果重新混合，得到 attention 子层输出。

它不是把 Q/K/V 变回原始输入，而是把“注意力聚合后的信息”再做一次线性变换。

## 8. Attention matrix 为什么要乘 V

attention matrix 的第 `i` 行第 `j` 个元素表示：

```text
第 i 个 token 要从第 j 个 token 拿多少信息
```

而 `V_j` 是第 `j` 个 token 携带的 value 信息。

所以第 `i` 个 token 的输出是：

```text
output_i = a_i1 * V1
         + a_i2 * V2
         + ...
         + a_iT * VT
```

矩阵形式：

```text
Attention: [T, T]
V:         [T, C]
Output:    [T, C]
```

计算：

```text
Output = Attention @ V
```

第 5 个 token 的输出：

```text
Output[5] = Attention[5, :] @ V
```

也就是：

```text
output_5 = a51 * V1
         + a52 * V2
         + a53 * V3
         + a54 * V4
         + a55 * V5
```

不要被可视化里的“行/列”绕住。真正要记的是：

```text
同一个 token 位置 j 的 attention 权重，乘同一个 token 位置 j 的 V 向量。
```

## 9. 残差连接

残差连接的核心：

```text
子层输出 + 子层开始前的输入
```

如果第一层刚从 embedding 进入 Transformer block：

```text
X = token embedding + position embedding
```

那么 attention 子层之后：

```text
Y = X + Attention(X)
```

更一般地，第 `l` 层：

```text
X_l
↓
Attention 或 MLP 子层
↓
X_l + 子层输出
```

在 Pre-LN Transformer 中：

```text
Y = X + Attention(LayerNorm(X))
```

这里 attention 的输入是 `LayerNorm(X)`，但残差旁路加的是原来的 `X`。

所以残差连接不是一定和“归一化后的输入”相加，而是和这个子层开始前的输入相加。

## 10. 小结

1. `C` / `h` 是每个 token 的表示维度，通常是超参数。
2. embedding 表、QKV 权重、LayerNorm 的 `γ/β` 是可训练参数。
3. 多头注意力是把 hidden 维度拆成多个 head，各自 attention 后再拼回来。
4. `Attention @ V` 本质是对所有 token 的 V 向量做加权求和。
5. 残差连接加的是子层开始前的输入。

