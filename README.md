# All Online Tools

简单实用的浏览器在线工具集（**React + Vite + Tailwind CSS** 多页 MPA）。

**UI 库：[`@pxlkit/ui-kit`](https://pxlkit.xyz/)**（Pxlkit — pixel / retro UI）。请优先使用其 `Pixel*` 组件，不要自行发明一套 UI。Agent 说明见 [`AGENTS.md`](./AGENTS.md)。

## 在线访问

部署后地址：

**https://xiguan00yu.github.io/all-online-tools/**

- 首页：`/all-online-tools/`
- 日期工具：`/all-online-tools/date.html`

站点 `base` 为 `/all-online-tools/`（GitHub Pages 项目站点）。

## UI 库（pxlkit）

- 站点 / Docs：https://pxlkit.xyz/ · https://pxlkit.xyz/docs · https://pxlkit.xyz/ui-kit
- GitHub：https://github.com/joangeldelarosa/pxlkit
- 安装（本仓库已装）：

  ```bash
  npm install @pxlkit/ui-kit @pxlkit/core @pxlkit/gamification @pxlkit/ui
  ```

- **必须**用 kit 的 Tailwind v4 入口样式（本仓库在 `src/index.css`），**不要**再单独 `@import "tailwindcss"`：

  ```css
  @import "@pxlkit/ui-kit/styles.css";
  ```

- 根节点用 `PxlKitSurfaceProvider`（`surface="pixel"`）包裹，见 `src/components/Providers.tsx`。
- 从包根导入：`import { PixelButton, PixelCard, PixelInput } from '@pxlkit/ui-kit'`
- 图标：`import { PxlKitIcon } from '@pxlkit/core'` + 各 pack（如 `@pxlkit/ui`）

## 本地开发

需要 Node.js 18+（推荐 20+；Tailwind 4.3 oxide 声明 `>=20`）。

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

## Git 提交身份（本仓库）

本仓库提交作者为 **xiguan00yu**（`user.name` / `user.email` 仅设置在本仓库的 **local** git config）。本机其他项目仍保持 Link，请勿改 global。

```bash
# 仅在本仓库目录执行：
git config user.name "xiguan00yu"
git config user.email "xiguan00yu@users.noreply.github.com"
```

## 技术栈

- React + TypeScript + Vite（多 HTML 入口 MPA，非 SPA）
- **@pxlkit/ui-kit**（Pixel* 组件）+ `@pxlkit/core` 与图标 packs
- Tailwind CSS v4（经 `@pxlkit/ui-kit/styles.css` + `@tailwindcss/vite`）
- dayjs（日期工具页）
- `base: '/all-online-tools/'` 适配 GitHub Pages 项目站点
