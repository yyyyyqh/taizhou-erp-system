import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// 加载 .env 配置文件
dotenv.config();

export default defineConfig({
  // 告诉 Drizzle 你的数据表定义（Schema）放在哪里
  schema: "./src/db/schema.ts",
  // 迁移脚本生成的输出目录
  out: "./drizzle",
  // 使用的数据库驱动类型
  dialect: "postgresql",
  dbCredentials: {
    // 从环境变量中读取连接字符串
    url: process.env.DATABASE_URL!,
  },
});
