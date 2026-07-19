export const resourceLibrary = {
  openaiTools: {
    title: "OpenAI Function Calling / Tools",
    type: "文档",
    url: "https://platform.openai.com/docs/guides/function-calling",
    note: "理解 tool schema、tool call 和结果回填的基本协议。",
  },
  openaiAgents: {
    title: "OpenAI Agents SDK",
    type: "文档",
    url: "https://openai.github.io/openai-agents-python/",
    note: "从 Agent loop、handoff、guardrail、session 和 tracing 看 SDK 抽象。",
  },
  mcpSpec: {
    title: "Model Context Protocol Specification",
    type: "文档",
    url: "https://modelcontextprotocol.io/specification/latest",
    note: "重点看架构、生命周期、tools 与 transports，不需要一次读完全部规范。",
  },
  mcpTools: {
    title: "MCP Tools",
    type: "文档",
    url: "https://modelcontextprotocol.io/specification/latest/server/tools",
    note: "对照 tools/list、tools/call、name、description 和 inputSchema。",
  },
  reactPaper: {
    title: "ReAct: Synergizing Reasoning and Acting",
    type: "论文",
    url: "https://arxiv.org/abs/2210.03629",
    note: "先读摘要和方法图，理解 Thought、Action、Observation 的循环。",
  },
  langgraph: {
    title: "LangGraph Concepts",
    type: "文档",
    url: "https://langchain-ai.github.io/langgraph/concepts/",
    note: "用图、状态、持久化和中断理解有状态 Agent 编排。",
  },
  anthropicBuilding: {
    title: "Building Effective Agents",
    type: "文档",
    url: "https://www.anthropic.com/research/building-effective-agents",
    note: "区分 Workflow 与 Agent，并阅读常见编排模式和适用边界。",
  },
  anthropicContext: {
    title: "Effective Context Engineering for AI Agents",
    type: "文档",
    url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
    note: "关注上下文选择、压缩、工具结果和长任务管理。",
  },
  openaiEval: {
    title: "OpenAI Evaluation Best Practices",
    type: "文档",
    url: "https://platform.openai.com/docs/guides/evaluation-best-practices",
    note: "掌握任务定义、数据集、评判标准和持续评测闭环。",
  },
  agentsEval: {
    title: "OpenAI Agent Evals",
    type: "文档",
    url: "https://platform.openai.com/docs/guides/agent-evals",
    note: "重点理解 trace grading、workflow-level errors 与回归评测。",
  },
  judgePaper: {
    title: "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena",
    type: "论文",
    url: "https://arxiv.org/abs/2306.05685",
    note: "关注 position、verbosity、self-enhancement 等 Judge 偏差。",
  },
  swebench: {
    title: "SWE-bench",
    type: "文档",
    url: "https://www.swebench.com/",
    note: "理解真实仓库 issue、环境复现、补丁与测试判分。",
  },
  swebenchPaper: {
    title: "SWE-bench 论文",
    type: "论文",
    url: "https://arxiv.org/abs/2310.06770",
    note: "阅读任务构造、执行环境、测试验证与基准局限。",
  },
  miniSweAgent: {
    title: "mini-swe-agent",
    type: "源码",
    url: "https://github.com/SWE-agent/mini-swe-agent",
    note: "仅作为你自己的实践主线；八股课程用它映射 Runtime、工具和 Coding Agent 评测概念。",
  },
  sweAgent: {
    title: "SWE-agent",
    type: "源码",
    url: "https://github.com/SWE-agent/SWE-agent",
    note: "用于对照更完整的 Coding Agent Harness 和评测流程。",
  },
  inspectAi: {
    title: "Inspect AI",
    type: "文档",
    url: "https://inspect.aisi.org.uk/",
    note: "学习任务、数据集、solver、scorer、sandbox 和评测日志的组合方式。",
  },
  promptInjection: {
    title: "OWASP LLM Prompt Injection Prevention",
    type: "文档",
    url: "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html",
    note: "关注间接注入、最小权限、输出处理和 HITL 防护。",
  },
  owaspAgent: {
    title: "OWASP Agentic AI Threats and Mitigations",
    type: "文档",
    url: "https://genai.owasp.org/",
    note: "按工具滥用、记忆投毒、权限和供应链问题补安全边界。",
  },
  opentelemetry: {
    title: "OpenTelemetry Traces",
    type: "文档",
    url: "https://opentelemetry.io/docs/concepts/signals/traces/",
    note: "理解 trace、span、context propagation，再映射到 Agent step。",
  },
};

const guides = {
  openaiTools: "配合 Day 2/5，手画 assistant tool call 与 tool result 消息序列。",
  openaiAgents: "配合 Day 4/7/22，只看运行循环、guardrail、session 和 trace 四个入口。",
  mcpSpec: "配合 Day 3，先读架构和生命周期，再看 tools；不用背完整规范。",
  mcpTools: "配合 Day 2/3，把 MCP inputSchema 与模型工具 Schema 并排比较。",
  reactPaper: "配合 Day 6，先能解释为什么观察结果会改变下一步行动。",
  langgraph: "配合 Day 4/14/23，重点看 state、persistence、interrupt。",
  anthropicBuilding: "配合 Day 1/6/7，优先读 workflow/agent 区别与五种组合模式。",
  anthropicContext: "配合 Day 10/11，整理上下文选择、压缩与长期任务策略。",
  openaiEval: "配合 Day 15，按目标、数据、指标和持续评测做一页模板。",
  agentsEval: "配合 Day 16/19/20，重点看 trace 如何帮助定位 workflow 错误。",
  judgePaper: "配合 Day 18，只需掌握 Judge 的常见偏差和校准方法。",
  swebench: "配合 Day 21，弄清任务环境与测试判分，而不是追榜单数字。",
  swebenchPaper: "配合 Day 21，读数据构造、评测过程与 validity threats。",
  miniSweAgent: "实践由你自己推进；课程只要求能把代码映射到 Harness 八股。",
  sweAgent: "当 mini-swe-agent 的抽象过薄时再定向对照，不顺序通读。",
  inspectAi: "配合 Day 15-20，观察 eval task、solver、scorer 和 sandbox 的职责。",
  promptInjection: "配合 Day 11/13，把每种威胁对应到代码级防护。",
  owaspAgent: "配合 Day 13/29，用于补齐系统设计中的安全检查项。",
  opentelemetry: "配合 Day 22，画出一个 Agent task 下的 model/tool 子 span。",
};

const defaults = {
  文档: { time: "20-30 分钟", difficulty: "入门" },
  论文: { time: "30-50 分钟", difficulty: "进阶" },
  源码: { time: "30-60 分钟", difficulty: "进阶" },
};

function buildResource(id, order) {
  const resource = resourceLibrary[id];
  if (!resource) return null;
  return {
    id,
    ...resource,
    ...defaults[resource.type],
    studyGuide: guides[id] || resource.note,
    order,
    role: order === 1 ? "主修" : "补充",
  };
}

const dailyResourceIds = {
  1: ["anthropicBuilding", "openaiAgents"],
  2: ["openaiTools", "mcpTools"],
  3: ["mcpSpec", "mcpTools"],
  4: ["openaiAgents", "langgraph"],
  5: ["openaiTools", "openaiAgents"],
  6: ["reactPaper", "anthropicBuilding"],
  7: ["anthropicBuilding", "langgraph", "openaiAgents"],
  8: ["anthropicBuilding", "langgraph"],
  9: ["openaiTools", "mcpTools"],
  10: ["anthropicContext", "langgraph"],
  11: ["anthropicContext", "promptInjection"],
  12: ["langgraph", "openaiAgents"],
  13: ["promptInjection", "owaspAgent"],
  14: ["langgraph", "openaiAgents"],
  15: ["openaiEval", "inspectAi"],
  16: ["agentsEval", "inspectAi"],
  17: ["openaiEval", "inspectAi"],
  18: ["judgePaper", "openaiEval"],
  19: ["agentsEval", "inspectAi"],
  20: ["openaiEval", "agentsEval"],
  21: ["swebench", "swebenchPaper", "miniSweAgent"],
  22: ["opentelemetry", "openaiAgents"],
  23: ["langgraph", "openaiAgents"],
  24: ["openaiAgents", "opentelemetry"],
  25: ["openaiEval", "agentsEval"],
  26: ["anthropicBuilding", "openaiAgents"],
  27: ["reactPaper", "openaiEval"],
  28: ["openaiEval", "opentelemetry"],
  29: ["owaspAgent", "langgraph", "openaiAgents"],
  30: ["anthropicBuilding", "openaiEval", "miniSweAgent"],
};

export function resourcesForIds(ids) {
  const seen = new Set();
  return (ids || [])
    .map((id, index) => buildResource(id, index + 1))
    .filter((resource) => {
      if (!resource || seen.has(resource.url)) return false;
      seen.add(resource.url);
      return true;
    });
}

export const allResources = resourcesForIds(Object.keys(resourceLibrary));

export function resourcesForDay(day) {
  return resourcesForIds(dailyResourceIds[day] || []);
}
