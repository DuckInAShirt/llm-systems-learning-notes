import { plan } from "./plan.js";

export function answerForTask(day, bucket, index) {
  const item = plan[day - 1];
  const tasks = bucket === "fragment" ? item?.fragments : item?.deep;
  return (
    tasks?.[index]?.answer ||
    "先给出一句定义，再说明执行机制、失败边界和验证方法。"
  );
}
