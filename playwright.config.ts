import { defineConfig, devices } from "@playwright/test";

const localChrome =
  process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined;

export default defineConfig({
  testDir: "./tests",
  // 长时间无障碍扫描后，低内存主机创建下一页上下文可能短暂变慢；功能测试正文通常在数秒内完成。
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // 经藏集成测试会现场解析超长 TEI；串行运行可避免多个浏览器同时耗尽服务端内存。
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    launchOptions: localChrome ? { executablePath: localChrome } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "desktop-dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm start --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
