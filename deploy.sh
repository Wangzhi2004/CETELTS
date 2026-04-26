#!/bin/bash
set -e

echo "========================================="
echo "  CETELTS 阿里云 ECS 部署脚本"
echo "========================================="
echo ""

if [ ! -f .env.production ]; then
  echo "❌ 错误: .env.production 文件不存在!"
  echo ""
  echo "请先创建 .env.production 文件，参考以下格式:"
  echo ""
  echo "  DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/cetelts?sslmode=require"
  echo "  NEXTAUTH_SECRET=你的随机密钥"
  echo "  NEXTAUTH_URL=https://你的域名.com"
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

echo "▶ 步骤 1/6: 检查 Docker..."
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

echo "▶ 步骤 2/6: 构建镜像..."
docker compose build
echo "✅ 构建完成"
echo ""

echo "▶ 步骤 3/6: 推送数据库 schema..."
docker compose run --rm db-setup
echo "✅ 数据库 schema 已同步"
echo ""

echo "▶ 步骤 4/6: 填充种子数据（管理员+演示账户）..."
docker compose run --rm --no-deps db-setup npx tsx prisma/seed.ts
echo "✅ 种子数据已填充"
echo ""
echo "  管理员账户: admin@cetelts.com / admin123"
echo "  演示账户:   demo@cetelts.com / demo123"
echo ""

echo "▶ 步骤 5/6: 启动服务..."
docker compose up -d
echo "✅ 服务启动完成"
echo ""

echo "▶ 步骤 6/6: 验证..."
sleep 5
docker compose ps
echo ""

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
  echo "✅ 网站响应正常"
else
  echo "⚠️  网站可能还在启动中，请稍等后检查"
fi
echo ""

echo "========================================="
echo "  🎉 郶署完成！"
echo "========================================="
echo ""
echo "网站运行在 http://localhost:80"
echo ""
echo "账户信息:"
echo "  管理员: admin@cetelts.com / admin123"
echo "  演示:   demo@cetelts.com / demo123"
echo ""
echo "常用命令:"
echo "  查看日志:    docker compose logs -f"
echo "  查看应用日志: docker compose logs -f app"
echo "  停止服务:    docker compose down"
echo "  重启服务:    docker compose restart"
echo "  重新部署:    ./deploy.sh"
echo ""