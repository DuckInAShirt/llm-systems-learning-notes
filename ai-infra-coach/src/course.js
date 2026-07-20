import { plan } from "./plan.js";
import { lessonForDay } from "./lessons.js";

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
    return [
      day.day,
      {
        module: ["Harness 基础", "可靠执行", "Agent 评测", "生产与面试"][day.phase - 1],
        lessonTitle: day.title,
        content: lessonForDay(day.day),
        lab: oralDrill(day),
      },
    ];
  }),
);

export function courseForDay(day) {
  return course[day];
}
