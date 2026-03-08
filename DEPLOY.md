# 部署指南

## 项目已完成的功能

### 1. 跨设备同步功能 ✅
- 已集成 Supabase 数据库
- 文章的新增、编辑、删除操作会自动同步到云端
- 支持多设备实时同步

### 2. 近期文章补充 ✅
- 添加了2026年3月全国两会期间的重要讲话内容
- 包括江苏代表团审议讲话
- 包括民建工商联界委员联组会讲话

### 3. Vercel部署配置 ✅
- 已创建 `vercel.json` 配置文件
- 支持SPA路由重定向

---

## Vercel 部署步骤

### 方法一：通过 Vercel CLI 部署

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署项目
vercel

# 4. 部署到生产环境
vercel --prod
```

### 方法二：通过 GitHub 自动部署（推荐）

1. **将代码推送到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```

2. **在 Vercel 网站操作**
   - 访问 https://vercel.com
   - 点击 "Add New..." → "Project"
   - 选择 "Import Git Repository"
   - 授权并选择你的 GitHub 仓库
   - Framework Preset 选择 "Vite"
   - 点击 "Deploy"

3. **等待部署完成**
   - Vercel 会自动构建和部署
   - 部署完成后会获得一个 `.vercel.app` 域名

---

## Supabase 数据库配置

项目已配置好 Supabase 连接，但需要确保数据库表已创建：

### 创建 articles 表

在 Supabase SQL Editor 中执行：

```sql
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  category TEXT,
  categoryName TEXT,
  source TEXT,
  summary TEXT,
  url TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS (Row Level Security)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 创建公开读取策略
CREATE POLICY "Allow public read access" ON articles
  FOR SELECT USING (true);

-- 创建公开写入策略
CREATE POLICY "Allow public write access" ON articles
  FOR ALL USING (true);
```

---

## 管理员后台

- 访问地址：`你的域名/#/admin/login`
- 默认密码：已配置在 `src/services/adminAuth.ts`

---

## 功能清单

| 功能 | 状态 |
|------|------|
| 文章列表展示 | ✅ |
| 文章详情页 | ✅ |
| 原文链接跳转 | ✅ |
| 分类筛选 | ✅ |
| 年份筛选 | ✅ |
| 搜索功能 | ✅ |
| 管理员登录 | ✅ |
| 文章管理（增删改） | ✅ |
| 跨设备同步 | ✅ |
| 访问统计 | ✅ |
| 建议信箱 | ✅ |

---

## 注意事项

1. **首次部署后**，需要在 Supabase 中创建 `articles` 表
2. **修改密码**：建议修改 `src/services/adminAuth.ts` 中的管理员密码
3. **重新构建**：修改代码后需要运行 `npm run build` 重新构建

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```
