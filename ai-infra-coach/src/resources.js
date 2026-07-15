export const resourceLibrary = {
  vllmDocs: {
    title: "vLLM 官方文档",
    type: "文档",
    url: "https://docs.vllm.ai/",
    note: "查询当前版本的功能、配置和部署方式。",
  },
  vllmQuickstart: {
    title: "vLLM Quickstart",
    type: "文档",
    url: "https://docs.vllm.ai/en/latest/getting_started/quickstart/",
    note: "离线推理和 OpenAI 兼容服务的最小入口。",
  },
  vllmArchitecture: {
    title: "vLLM Architecture Overview",
    type: "文档",
    url: "https://docs.vllm.ai/en/latest/design/arch_overview/",
    note: "API Server、Engine Core、Worker 与多进程拓扑。",
  },
  vllmRepo: {
    title: "vLLM 源码仓库",
    type: "源码",
    url: "https://github.com/vllm-project/vllm",
    note: "固定 commit 后建立自己的源码索引。",
  },
  pagedPaper: {
    title: "PagedAttention 论文",
    type: "论文",
    url: "https://arxiv.org/abs/2309.06180",
    note: "重点阅读 KV Cache 浪费、block table 和实验设计。",
  },
  vllmTalk: {
    title: "Accelerating LLM Inference with vLLM",
    type: "视频",
    url: "https://www.youtube.com/watch?v=qBFENFjKE-M",
    note: "vLLM 核心设计和 PagedAttention 的项目讲解。",
  },
  inferenceVideo: {
    title: "vLLM、KV Cache 与 Continuous Batching",
    type: "视频",
    url: "https://www.youtube.com/watch?v=DNrIu_EZz5k",
    note: "适合第一周建立推理引擎直觉。",
  },
  servingBenchmark: {
    title: "vLLM Online Serving Benchmark",
    type: "文档",
    url: "https://docs.vllm.ai/en/latest/benchmarking/cli/",
    note: "查看 TTFT、ITL、TPOT 等指标和命令参数。",
  },
  benchmarkDataset: {
    title: "vLLM Benchmark Datasets",
    type: "文档",
    url: "https://docs.vllm.ai/en/latest/benchmarking/cli/",
    note: "理解 ShareGPT 等请求数据如何被采样。",
  },
  prefixCaching: {
    title: "Automatic Prefix Caching",
    type: "文档",
    url: "https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/",
    note: "共享前缀如何复用已经计算的 KV Cache。",
  },
  quantization: {
    title: "vLLM Quantization",
    type: "文档",
    url: "https://docs.vllm.ai/en/latest/features/quantization/",
    note: "比较不同量化格式、硬件支持和适用场景。",
  },
  kvQuantization: {
    title: "Quantized KV Cache",
    type: "文档",
    url: "https://docs.vllm.ai/en/latest/features/quantization/quantized_kvcache/",
    note: "区分权重量化与 KV Cache 量化。",
  },
  ncclOverview: {
    title: "NCCL 官方概览",
    type: "文档",
    url: "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/overview.html",
    note: "理解 NCCL 在多 GPU 集合通信中的位置。",
  },
  ncclCollectives: {
    title: "NCCL Collective Operations",
    type: "文档",
    url: "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html",
    note: "AllReduce、AllGather、ReduceScatter 的官方定义。",
  },
  ncclVideo: {
    title: "NCCL Lecture",
    type: "视频",
    url: "https://www.youtube.com/watch?v=T22e3fgit-A",
    note: "从拓扑和算法理解多 GPU 通信。",
  },
  nvidiaMultiGpuVideo: {
    title: "NVIDIA Multi-GPU Communication",
    type: "视频",
    url: "https://www.youtube.com/watch?v=kyQtbyR536I",
    note: "NVIDIA GTC 的多 GPU 通信体系讲解。",
  },
  nsightSystems: {
    title: "NVIDIA Nsight Systems",
    type: "文档",
    url: "https://docs.nvidia.com/nsight-systems/UserGuide/index.html",
    note: "观察 CPU 调度、CUDA Kernel 与通信时间线。",
  },
  rayServeLlm: {
    title: "Ray Serve LLM",
    type: "文档",
    url: "https://docs.ray.io/en/latest/serve/llm/index.html",
    note: "了解推理引擎外面的部署、路由和扩缩容层。",
  },
  rayProduction: {
    title: "Ray Serve Production Guide",
    type: "文档",
    url: "https://docs.ray.io/en/latest/serve/production-guide/index.html",
    note: "部署、监控、KubeRay 和生产配置。",
  },
  rayArchitecture: {
    title: "Ray Serve LLM Architecture",
    type: "文档",
    url: "https://docs.ray.io/en/latest/serve/llm/architecture/overview.html",
    note: "模型副本、路由与分布式服务组件。",
  },
  kubernetesGpu: {
    title: "Kubernetes GPU Scheduling",
    type: "文档",
    url: "https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/",
    note: "GPU 资源声明、设备插件和 Pod 调度基础。",
  },
  sglangDocs: {
    title: "SGLang 官方文档",
    type: "文档",
    url: "https://docs.sglang.io/",
    note: "RadixAttention、prefix caching 与多 GPU 推理入口。",
  },
  sglangBenchmark: {
    title: "SGLang Benchmark and Profiling",
    type: "文档",
    url: "https://docs.sglang.io/docs/developer_guide/benchmark_and_profiling",
    note: "使用一致指标对比 vLLM 与 SGLang。",
  },
  sglangPd: {
    title: "SGLang Prefill-Decode Disaggregation",
    type: "文档",
    url: "https://docs.sglang.io/docs/advanced_features/pd_disaggregation",
    note: "扩展阅读 prefill 与 decode 分离部署。",
  },
  sglangRepo: {
    title: "SGLang 源码仓库",
    type: "源码",
    url: "https://github.com/sgl-project/sglang",
    note: "对照 Scheduler、缓存和 Worker 入口。",
  },
};

const week1 = ["inferenceVideo", "vllmDocs", "pagedPaper"];
const week2 = ["vllmArchitecture", "vllmRepo", "vllmTalk"];
const week3 = ["servingBenchmark", "benchmarkDataset", "nsightSystems"];
const week4 = ["rayServeLlm", "rayProduction", "sglangDocs"];

const resourceGuides = {
  vllmDocs: "遇到参数或概念时查，不需要从首页顺序读完。",
  vllmQuickstart: "先完成离线推理，再启动 OpenAI 兼容服务；每条命令都亲手运行。",
  vllmArchitecture: "先看架构图和组件职责，再带着当天的源码问题阅读。",
  vllmRepo: "固定 commit 后，从课程指定的关键词搜索，不要从目录第一行开始读。",
  pagedPaper: "先读摘要、Figure 1 和系统设计，再回头看实验；第一次不用啃完公式。",
  vllmTalk: "先建立系统直觉，记下不懂的三个词，再回到课程讲义查。",
  inferenceVideo: "重点听 prefill、decode、KV Cache 和 batching，暂时跳过部署细节。",
  servingBenchmark: "先确认请求分布和指标口径，再复制命令；不要只抄最终 TPS。",
  prefixCaching: "重点看命中条件和限制，随后完成 Day 19 的命中/不命中对照实验。",
  quantization: "先看硬件支持表和格式差异，再选择与你的 A30 兼容的模型。",
  kvQuantization: "只用于区分权重量化和 KV 量化，配合 Day 2/20 阅读。",
  ncclOverview: "先理解 rank、communicator 和 collective 三个词，再进入具体通信操作。",
  ncclCollectives: "配合 Day 13 的 NumPy 切分实验，重点看 AllReduce、AllGather、ReduceScatter。",
  ncclVideo: "看完后画一张两卡通信图，不要求记住所有拓扑算法。",
  nvidiaMultiGpuVideo: "带着 TP=1/2/4 的实验结果看，关注 PCIe/NVLink 对通信的影响。",
  nsightSystems: "先学会打开时间线和识别 CUDA/NCCL 区段，不需要一次掌握全部功能。",
  rayServeLlm: "先区分 Ray Serve 与 vLLM 的职责，再看部署示例。",
  rayProduction: "Day 24-28 按故障、监控和生产部署问题定向查询。",
  rayArchitecture: "配合 Day 26 架构图阅读，只追踪一次请求到一个模型副本。",
  kubernetesGpu: "只先掌握设备插件、resource limit 和 Pod/GPU 分配。",
  sglangDocs: "先跑通最小服务，再看 RadixAttention，不要同时比较所有特性。",
  sglangBenchmark: "复用自己的 benchmark 协议，重点检查两边默认参数是否一致。",
  sglangPd: "属于扩展阅读，完成基础对比后再看 prefill/decode 分离。",
  sglangRepo: "从 server、scheduler 和 cache 三个关键词建立源码入口。",
};

const typeDefaults = {
  文档: { time: "20-30 分钟", difficulty: "入门" },
  视频: { time: "20-40 分钟", difficulty: "入门" },
  论文: { time: "40-60 分钟", difficulty: "进阶" },
  源码: { time: "30-60 分钟", difficulty: "进阶" },
};

function buildResource(id, order) {
  const resource = resourceLibrary[id];
  if (!resource) return null;
  return {
    id,
    ...resource,
    ...typeDefaults[resource.type],
    studyGuide: resourceGuides[id] || resource.note,
    order,
    role: order === 1 ? "主修" : "补充",
  };
}

export const dailyResourceIds = {
  1: ["inferenceVideo", "vllmTalk", "vllmDocs"],
  2: ["pagedPaper", "inferenceVideo", "kvQuantization"],
  3: ["inferenceVideo", "vllmTalk", "vllmArchitecture"],
  4: ["pagedPaper", "vllmTalk", "vllmArchitecture"],
  5: ["servingBenchmark", "benchmarkDataset", "vllmDocs"],
  6: ["vllmQuickstart", "servingBenchmark", "nsightSystems"],
  7: week1,
  8: ["vllmArchitecture", "vllmRepo", "vllmDocs"],
  9: ["vllmArchitecture", "vllmRepo", "vllmQuickstart"],
  10: ["vllmArchitecture", "vllmRepo", "vllmTalk"],
  11: ["pagedPaper", "vllmRepo", "vllmArchitecture"],
  12: ["vllmRepo", "vllmArchitecture", "nsightSystems"],
  13: ["ncclOverview", "ncclCollectives", "ncclVideo"],
  14: week2,
  15: ["servingBenchmark", "benchmarkDataset", "nsightSystems"],
  16: ["servingBenchmark", "nsightSystems", "vllmDocs"],
  17: ["servingBenchmark", "pagedPaper", "nsightSystems"],
  18: ["ncclOverview", "ncclCollectives", "nvidiaMultiGpuVideo"],
  19: ["prefixCaching", "servingBenchmark", "pagedPaper"],
  20: ["quantization", "kvQuantization", "servingBenchmark"],
  21: week3,
  22: ["vllmQuickstart", "rayServeLlm", "vllmArchitecture"],
  23: ["rayArchitecture", "rayProduction", "servingBenchmark"],
  24: ["nsightSystems", "rayProduction", "rayArchitecture"],
  25: ["rayProduction", "nsightSystems", "vllmDocs"],
  26: ["kubernetesGpu", "rayServeLlm", "rayProduction"],
  27: ["sglangDocs", "sglangBenchmark", "sglangRepo"],
  28: ["vllmRepo", "servingBenchmark", "rayProduction"],
  29: ["vllmArchitecture", "pagedPaper", "ncclOverview"],
  30: [...week4, "sglangPd"],
};

export function resourcesForIds(ids) {
  const seenUrls = new Set();
  return (ids || [])
    .map((id, index) => buildResource(id, index + 1))
    .filter((resource) => {
      if (!resource || seenUrls.has(resource.url)) return false;
      seenUrls.add(resource.url);
      return true;
    })
    .map((resource, index) => ({
      ...resource,
      order: index + 1,
      role: index === 0 ? "主修" : "补充",
    }));
}

export const allResources = (() => {
  const seenUrls = new Set();
  return Object.keys(resourceLibrary)
    .map((id, index) => buildResource(id, index + 1))
    .filter((resource) => {
      if (!resource || seenUrls.has(resource.url)) return false;
      seenUrls.add(resource.url);
      return true;
    });
})();

export function resourcesForDay(day) {
  return resourcesForIds(dailyResourceIds[day] || []);
}
