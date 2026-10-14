# All Online Tools

简单实用的浏览器在线工具集（**React + Vite + Tailwind CSS** 多页 MPA）。

**UI 库：[`animal-island-ui`](https://guokaigdg.github.io/animal-island-ui/)**（Animal Island UI）。请优先使用该库组件，不要自行发明一套 UI。Agent 说明见 [`AGENTS.md`](./AGENTS.md)。

## 在线访问

部署后地址：

**https://xiguan00yu.github.io/all-online-tools/**

- 首页：`/all-online-tools/`
- 日期工具：`/all-online-tools/date.html`

站点 `base` 为 `/all-online-tools/`（GitHub Pages 项目站点）。

## UI 库（animal-island-ui）

- 文档：https://guokaigdg.github.io/animal-island-ui/
- Skill / AI 用法：https://guokaigdg.github.io/animal-island-ui/#/skill
- 安装：`npm install animal-island-ui classnames`（`classnames` 为 peer）
- **必须**在组件使用前引入样式（本仓库在 `src/bootstrap.ts`）：

  ```ts
  import 'animal-island-ui/style'
  ```

- 从包根导入组件：`import { Button, Card, Title } from 'animal-island-ui'`
- API：优先读 `node_modules/animal-island-ui/AI_USAGE.md`（若有），否则读 `node_modules/animal-island-ui/dist/types/`

## 本地开发

需要 Node.js 18+（推荐 22）。

```bash
npm install
npm run dev
```

构建与预览：

```bash
npm run build
npm run preview
```

## 工具列表

| 页面 | 说明 |
|------|------|
| [日期工具](./date.html) | 格式化、相对时间（fromNow/toNow）、日期差值 |

更多工具后续补充。

## GitHub Pages 启用步骤

本仓库通过 GitHub Actions 在推送到 `main` 后构建，并将 `dist` 发布到 **`gh-pages`** 分支。

请在仓库设置中启用 Pages：

1. 打开仓库 **Settings → Pages**
2. **Source** 选择 **Deploy from a branch**
3. Branch 选择 **`gh-pages`**，目录选 **`/` (root)**
4. 保存。等待 Actions 跑完并生成 `gh-pages` 分支后即可访问

也可以把 Source 设为 **GitHub Actions**（若改用 `actions/deploy-pages`）；当前工作流使用 `peaceiris/actions-gh-pages`，因此请选 **gh-pages 分支**。

## 技术栈

- React + TypeScript + Vite（多 HTML 入口 MPA，非 SPA）
- **animal-island-ui**（UI 组件库）+ peer `classnames`
- Tailwind CSS v4（`@tailwindcss/vite`）
- dayjs（日期工具页）
- `base: '/all-online-tools/'` 适配 GitHub Pages 项目站点
