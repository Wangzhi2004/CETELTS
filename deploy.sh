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

echo "▶ 步骤 1/4: 拉取最新代码..."
git pull origin main
echo "✅ 代码已更新"
echo ""

echo "▶ 步骤 2/4: 停止旧容器并构建新镜像..."
docker compose down
docker compose build
echo "✅ 构建完成"
echo ""

echo "▶ 步骤 3/4: 启动服务..."
docker compose up -d
echo "✅ 服务启动完成"
echo ""

echo "▶ 步骤 4/4: 等待应用就绪并验证..."
echo "  等待应用启动..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200\|302"; then
    echo "  ✅ 应用已就绪 (第 ${i} 秒)"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "  ⚠️  应用可能还在启动中，请稍后检查"
    echo "  查看日志: docker compose logs app"
  fi
  sleep 1
done
echo ""

docker compose ps
echo ""

echo "========================================="
echo "  🎉 部署完成！"
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
echo "  重启服务:    docker compose down && docker compose up -d"
echo "  重新部署:    bash deploy.sh"
echo ""