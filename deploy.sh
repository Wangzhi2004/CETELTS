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
  echo "  OPENAI_API_KEY=sk-xxx"
  echo "  OPENAI_BASE_URL=https://api.openai.com/v1"
  echo "  OPENAI_MODEL=gpt-4o"
  echo "  OPENAI_TEACHER_MODEL=gpt-4o"
  echo ""
  echo "创建方法:"
  echo "  nano .env.production"
  echo ""
  exit 1
fi

echo "✅ 找到 .env.production"
echo ""

echo "▶ 步骤 1/4: 检查 Docker..."
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

echo "▶ 步骤 2/4: 构建镜像..."
docker compose build
echo "✅ 构建完成"
echo ""

echo "▶ 步骤 3/4: 启动服务..."
docker compose up -d
echo "✅ 服务启动完成"
echo ""

echo "▶ 步骤 4/4: 检查状态..."
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
echo "  重新部署:    docker compose build && docker compose up -d"
echo ""