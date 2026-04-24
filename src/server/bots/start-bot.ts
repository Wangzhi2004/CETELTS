import { startWechatBot } from "./wechat-bot";
import { runProactiveMonitor } from "../services/proactive-monitor";
import { runSelfReflectionPolicyUpdate } from "../ai/self-reflection-worker";

console.log("=========================================");
console.log("启动提分中心 Agent Daemon (微信机器 + 调度引擎)...");
console.log("=========================================");

startWechatBot()
  .then(() => {
    console.log("[Daemon] WeChat Bot 启动成功");
    
    // Start Background Jobs
    console.log("[Daemon] 初始化 Proactive Monitor (每 1 分钟执行一次)...");
    setInterval(() => {
      runProactiveMonitor().catch(err => console.error("[Daemon] Proactive Monitor Error:", err));
    }, 60 * 1000);
    
    console.log("[Daemon] 初始化 Self-Reflection Worker (每 5 分钟执行一次)...");
    setInterval(() => {
      runSelfReflectionPolicyUpdate().catch(err => console.error("[Daemon] Self-Reflection Error:", err));
    }, 5 * 60 * 1000);
    
    // Execute immediately once
    runProactiveMonitor().catch(console.error);
    runSelfReflectionPolicyUpdate().catch(console.error);
  })
  .catch((err) => console.error("Agent Daemon 启动失败", err));
