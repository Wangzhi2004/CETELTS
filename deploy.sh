#!/bin/bash
set -e

echo "========================================="
echo "  CETELTS 阿里云 ECS 部署脚本"
echo "========================================="
echo ""

if [ ! -f .env.production ]; then
  echo "❌ 错误: .env.production 文件不存在!"
  echo ""
  echo "请先创建 .env.production 文件，参考 .env.production.example:"
  echo ""
  echo "  DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/cetelts?sslmode=require"
  echo "  OPENAI_API_KEY=sk-你的DashScope-Key"
  echo "  OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1"
  echo "  OPENAI_MODEL=glm-5"
  echo "  OPENAI_TEACHER_MODEL=glm-5"
  echo ""
  echo "创建方法:"
  echo "  nano .env.production"
  echo ""
  exit 1
fi

echo "✅ 找到 .env.production"
echo ""

echo "▶ 步骤 1/5: 检查 Docker..."
if ! command -v docker &> /dev/null; then
  echo "❌ Docker 未安装，正在安装..."
  curl -fsSL https://get.docker.com | sh
  systemctl start docker
  systemctl enable docker
  echo "✅ Docker 安装完成"
else
  echo "✅ Docker 已安装: $(docker --version)"
fi

if ! command -v docker compose &> /dev/null; then
  echo "❌ Docker Compose 未安装"
  exit 1
else
  echo "✅ Docker Compose 已安装"
fi
echo ""

echo "▶ 步骤 2/6: 推送数据库 schema..."
export $(grep -v '^#' .env.production | xargs)
if ! command -v node &> /dev/null; then
  echo "⚠️  Node.js 未安装，跳过 db push（假设数据库 schema 已存在）"
else
  npm install
  npx prisma db push --skip-generate
  echo "✅ 数据库 schema 已同步"
fi
echo ""

echo "▶ 步骤 3/6: 填充种子数据..."
if command -v node &> /dev/null; then
  npx tsx prisma/seed.ts
  echo "✅ 种子数据已填充"
else
  echo "⚠️  Node.js 未安装，跳过 seed"
fi
echo ""

echo "▶ 步骤 4/6: 构建镜像..."
docker compose build
echo "✅ 构建完成"
echo ""

echo "▶ 步骤 5/6: 启动服务..."
docker compose up -d
echo "✅ 服务启动完成"
echo ""

echo "▶ 步骤 6/6: 检查状态..."
sleep 3
docker compose ps
echo ""

echo "========================================="
echo "  🎉 部署完成！"
echo "========================================="
echo ""
echo "网站运行在 http://localhost:80"
echo ""
echo "常用命令:"
echo "  查看日志:    docker compose logs -f"
echo "  查看应用日志: docker compose logs -f app"
echo "  停止服务:    docker compose down"
echo "  重启服务:    docker compose restart"
echo "  重新部署:    ./deploy.sh"
echo ""