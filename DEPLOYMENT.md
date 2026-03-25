# 部署指南

本文档介绍如何将 UIBE CampusSafe 部署到各种平台。

---

## 📖 目录

1. [GitHub Pages 部署](#github-pages-部署)
2. [静态服务器部署](#静态服务器部署)
3. [云服务器部署](#云服务器部署)
4. [CDN 加速部署](#cdn-加速部署)
5. [微信小程序部署](#微信小程序部署)

---

## GitHub Pages 部署

GitHub Pages 是最简单、最快速的部署方式，完全免费。

### 步骤 1: 推送代码到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: UIBE CampusSafe v1.0"

# 添加远程仓库
git remote add origin https://github.com/your-username/uibe-campus-safe.git

# 推送代码
git branch -M main
git push -u origin main
```

### 步骤 2: 开启 GitHub Pages

1. 进入仓库页面
2. 点击 `Settings` → `Pages`
3. 在 `Source` 下选择：
   - **Branch**: `main`
   - **Folder**: `/root` (或 `/`)
4. 点击 `Save`

### 步骤 3: 等待部署

- 部署通常需要 1-2 分钟
- 部署成功后会显示访问 URL
- 默认格式：`https://your-username.github.io/uibe-campus-safe/`

### 步骤 4: 自定义域名（可选）

1. 在仓库的 `Settings` → `Pages` 中
2. 在 `Custom domain` 中输入你的域名
3. 在域名 DNS 中添加 CNAME 记录：
   ```
   CNAME  your-domain.com  ->  your-username.github.io
   ```

---

## 静态服务器部署

### Nginx 部署

#### 1. 上传文件

```bash
# 上传到服务器
scp app-fixed.html user@server:/var/www/uibe-campus-safe/
```

#### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/uibe-campus-safe`:

```nginx
server {
    listen 80;
    server_name campus-safe.uibe.edu.cn;

    root /var/www/uibe-campus-safe;
    index app-fixed.html index.html;

    # 开启 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 缓存控制
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /app-fixed.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### 3. 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/uibe-campus-safe /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### Apache 部署

创建 `.htaccess` 文件:

```apache
RewriteEngine On

# SPA 路由支持
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /app-fixed.html [L,QSA]

# 缓存控制
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

---

## 云服务器部署

### Vercel 部署

Vercel 是一个现代化的部署平台，支持自动部署和边缘网络。

#### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

#### 2. 登录

```bash
vercel login
```

#### 3. 部署

```bash
# 开发环境
vercel

# 生产环境
vercel --prod
```

### Netlify 部署

#### 1. 安装 Netlify CLI

```bash
npm i -g netlify-cli
```

#### 2. 登录

```bash
netlify login
```

#### 3. 部署

```bash
# 初始化
netlify init

# 部署
netlify deploy --prod
```

### 阿里云 OSS + CDN

#### 1. 安装 ossutil

```bash
# 下载 ossutil
wget http://gosspublic.alicdn.com/ossutil/1.7.16/ossutil64

# 设置执行权限
chmod 755 ossutil64
```

#### 2. 配置

```bash
./ossutil64 config
```

#### 3. 上传文件

```bash
./ossutil64 cp app-fixed.html oss://your-bucket/index.html
```

#### 4. 配置 CDN

在阿里云 CDN 控制台：
1. 添加 OSS 源站
2. 配置加速域名
3. 配置缓存策略

---

## CDN 加速部署

使用 CDN 可以显著提升访问速度，特别是在全球范围内。

### Cloudflare

1. 注册 Cloudflare 账号
2. 添加你的域名
3. 配置 DNS 记录
4. 启用 Cloudflare CDN
5. 配置缓存规则：
   - 静态资源：缓存 1 年
   - HTML 文件：缓存 1 小时

### 腾讯云 CDN

1. 在腾讯云 CDN 控制台添加加速域名
2. 配置源站信息
3. 配置缓存规则
4. 开启 HTTPS

---

## 微信小程序部署

详细的小程序部署指南请参考：[weixin-miniprogram-migration-guide.md](./weixin-miniprogram-migration-guide.md)

### 快速步骤

1. **下载微信开发者工具**
   - 访问：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
   - 下载并安装

2. **创建小程序项目**
   - AppID: wxa01a88124d29e5a8
   - 项目目录: `miniprogram-weixin`
   - 后端服务: 云开发

3. **开通云开发**
   - 在微信开发者工具中点击"云开发"
   - 创建新环境
   - 记录环境ID

4. **部署云函数**
   - 右键 `cloudfunctions` 目录
   - 选择"上传并部署：云端安装依赖"
   - 逐个部署所有云函数

5. **预览和测试**
   - 点击"预览"按钮
   - 扫码在真机上测试

6. **提交审核**
   - 在微信开发者工具中点击"上传"
   - 在微信公众平台提交审核
   - 等待审核通过后发布

---

## 🔒 安全配置

### HTTPS 证书

#### Let's Encrypt（免费）

```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d campus-safe.uibe.edu.cn

# 自动续期
sudo certbot renew --dry-run
```

### 安全头

在服务器配置中添加安全头：

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

---

## 📊 性能优化

### 1. 启用 Gzip 压缩

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 2. 配置缓存

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. CDN 加速

- 使用 Cloudflare、腾讯云 CDN 或阿里云 CDN
- 配置边缘节点
- 启用 HTTP/2

### 4. 图片优化

- 使用 WebP 格式
- 压缩图片大小
- 懒加载图片

---

## 🚨 监控和日志

### 日志收集

```bash
# Nginx 访问日志
tail -f /var/log/nginx/access.log

# Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### 性能监控

使用以下工具进行性能监控：
- Google Lighthouse
- WebPageTest
- GTmetrix

---

## 🔄 自动部署

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

---

## 📞 获取帮助

如果在部署过程中遇到问题，可以：

1. 查看 [README.md](./README.md)
2. 查看 [GitHub Issues](https://github.com/your-username/uibe-campus-safe/issues)
3. 提交新的 Issue

---

**祝部署顺利！** 🚀
