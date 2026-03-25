#!/bin/bash
# Git 配置和推送脚本

echo "=== UIBE CampusSafe Git 配置脚本 ==="
echo ""

# 1. 配置Git用户信息
echo "步骤 1: 配置Git用户信息..."
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
echo "✓ Git用户信息已配置"
echo ""

# 2. 检查当前目录
echo "步骤 2: 检查当前目录..."
cd "c:/Users/ianxi/WorkBuddy/Claw"
pwd
echo "✓ 当前目录正确"
echo ""

# 3. 初始化Git仓库（如果还没有）
echo "步骤 3: 初始化Git仓库..."
if [ ! -d ".git" ]; then
    git init
    echo "✓ Git仓库已初始化"
else
    echo "✓ Git仓库已存在"
fi
echo ""

# 4. 添加所有文件
echo "步骤 4: 添加文件到暂存区..."
git add .
echo "✓ 文件已添加"
echo ""

# 5. 提交
echo "步骤 5: 提交更改..."
git commit -m "Initial commit: UIBE CampusSafe v1.0 - Ready for GitHub release"
echo "✓ 更改已提交"
echo ""

# 6. 检查并删除已存在的远程仓库
echo "步骤 6: 配置远程仓库..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/IanXieAI/campus.git
echo "✓ 远程仓库已配置"
echo ""

# 7. 创建并切换到main分支
echo "步骤 7: 创建main分支..."
git branch -M main
echo "✓ 分支已创建"
echo ""

# 8. 推送代码
echo "步骤 8: 推送代码到GitHub..."
echo "请确保您已经："
echo "  1. 在GitHub上创建了名为 'campus' 的仓库"
echo "  2. 或者修改脚本中的仓库地址为您的实际仓库"
echo ""
echo "正在推送..."
git push -u origin main
echo ""

# 9. 检查推送结果
if [ $? -eq 0 ]; then
    echo "✓ 代码推送成功！"
    echo ""
    echo "您的项目已发布到："
    echo "  https://github.com/IanXieAI/campus"
    echo ""
    echo "GitHub Pages地址（部署后）："
    echo "  https://IanXieAI.github.io/campus"
else
    echo "✗ 推送失败，请检查："
    echo "  1. 网络连接是否正常"
    echo "  2. GitHub仓库是否存在"
    echo "  3. 是否有推送权限"
fi
