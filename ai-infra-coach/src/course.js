import { plan } from "./plan.js";

const phaseIntroductions = {
  1: "这一阶段先建立 Agent Harness 的执行主链路。面试回答不要停在框架名，要能从模型决策讲到工具执行、状态更新和终止，并说清协议与 Runtime 的责任边界。",
  2: "这一阶段关注 Agent 为什么会失控，以及 Harness 如何把失败限制在可恢复范围内。重点不是背‘重试、沙箱、记忆’几个词，而是说出触发条件、状态变化和工程边界。",
  3: "这一阶段建立 Agent Eval 的完整方法。你需要能定义任务成功、区分最终结果与执行轨迹、选择客观验证器，并把线上失败变成稳定回归样本。",
  4: "这一阶段把知识拼成生产系统。面试时要主动覆盖持久化、并发、成本、安全、发布和评测，体现你能把模型能力接进真实业务，而不只是调用一次 API。",
};

const phaseAnswerGuides = {
  1: [
    ["先说边界", "先区分模型 API、Runtime、Harness、工具协议和框架，避免把不同层混在一起。"],
    ["再走主链路", "按输入、模型决策、工具调用、结果回填、继续决策和终止的顺序回答。"],
    ["最后补失败", "主动说明参数错误、无限循环、工具异常和错误终止由谁处理。"],
  ],
  2: [
    ["先给失败场景", "用一个具体错误说明为什么只靠 Prompt 或模型自律不够。"],
    ["再讲控制机制", "说明状态、权限、预算、重试、checkpoint 或人工审批如何落地。"],
    ["最后讲取舍", "指出可靠性机制带来的延迟、成本、误拦截或维护复杂度。"],
  ],
  3: [
    ["先定义成功", "先说任务、数据分布和成功判据，再谈分数和评测框架。"],
    ["结果与轨迹分层", "优先客观环境验证，再用轨迹指标归因，用 Judge 补充开放质量。"],
    ["最后说可信度", "补充版本、重复运行、分层指标、人工校准和回归门禁。"],
  ],
  4: [
    ["先澄清约束", "明确任务规模、风险、SLO、工具副作用和成本目标。"],
    ["再画系统", "从任务入口讲到 Runtime、工具、状态、队列、观测和评测。"],
    ["最后给演进", "说明灰度、回滚、容量边界和何时选择更复杂的算法或架构。"],
  ],
};

const oralDrill = (day) => ({
  title: `Day ${String(day.day).padStart(2, "0")} · 面试口述验收`,
  goal: "不用写项目代码。闭卷回答当天 5 道题，再用追问检查自己是否真的理解。",
  environment: "20-30 分钟 · 录音或文字均可",
  steps: [
    {
      title: "60 秒回答必答题",
      detail: `围绕“${day.title}”先给一句结论，再讲机制；第一次不要看参考答案。`,
      code: "",
    },
    {
      title: "对照答案补齐边界",
      detail: "只记录自己漏掉的关键词、失败场景和取舍，不要逐字抄整段答案。",
      code: "",
    },
    {
      title: "完成四道高频题",
      detail: "每题控制在 30-60 秒；答案至少包含定义和一条因果链。",
      code: "",
    },
    {
      title: "接受两轮追问",
      detail: "分别回答‘失败了怎么办’和‘如何评测或验证’，说不清的内容标为需要复习。",
      code: "",
    },
  ],
  acceptance: [
    "必答题能在 60-90 秒内脱稿回答。",
    "能说出至少一个失败场景及对应防护。",
    "能回答如何用 Trace、测试或指标验证结论。",
  ],
  deliverable: "5 道题口述结果 + 1 条薄弱点记录",
  code: "",
});

export const course = Object.fromEntries(
  plan.map((day) => {
    const guides = phaseAnswerGuides[day.phase];
    return [
      day.day,
      {
        module: ["Harness 基础", "可靠执行", "Agent 评测", "生产与面试"][day.phase - 1],
        lessonTitle: day.title,
        lesson: phaseIntroductions[day.phase],
        keyPoints: guides.map(([title, body]) => ({ title, body })),
        lab: oralDrill(day),
        resources: [],
      },
    ];
  }),
);

export function courseForDay(day) {
  return course[day];
}
