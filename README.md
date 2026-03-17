# ruankao

软考高级架构师刷题网站（Vercel + Feishu Bitable 版）。

## 当前实现
- Next.js App Router
- 响应式网页，适合手机和电脑
- 首页 / 刷题页 / 错题本占位 / 统计占位
- 服务端 API 从 Feishu Bitable 读取题目
- 前端不暴露飞书密钥
- 当飞书服务端凭据未配置时，自动回退到 2 道内置示例题

## 飞书多维表
已创建：
- App Token: `WtgObupaPaCQFgsWwyUcAF50n0f`
- Table ID: `tblUDU29OQ1uImnk`
- 链接: https://gcnsj2hxym9s.feishu.cn/base/WtgObupaPaCQFgsWwyUcAF50n0f

字段：
- 题目ID
- 题型
- 题干
- 选项JSON
- 答案JSON
- 解析
- 标签
- 难度

## 环境变量（Vercel）
需要在 Vercel 项目里配置：
- `FEISHU_APP_TOKEN`
- `FEISHU_TABLE_ID`
- `FEISHU_BASE_APP_ID`
- `FEISHU_BASE_APP_SECRET`

其中：
- `FEISHU_APP_TOKEN` = `WtgObupaPaCQFgsWwyUcAF50n0f`
- `FEISHU_TABLE_ID` = `tblUDU29OQ1uImnk`
- `FEISHU_BASE_APP_ID` / `FEISHU_BASE_APP_SECRET` 需要你从飞书应用凭据中填写

## 本地启动
```bash
npm install
npm run dev
```

## 当前限制
- 错题自动回写尚未做
- 统计尚未接真实做题记录
- 当前 Feishu Bitable 工具未暴露记录字段写入参数，因此我已把代码接好，但不能直接通过当前工具把 2 条题目程序化写入多维表；若你手动补两条，页面即可直接读取

## 题目数据格式示例
题型：`single_choice` / `multiple_choice` / `judge`

选项JSON：
```json
[{"key":"A","text":"选项A"},{"key":"B","text":"选项B"}]
```

答案JSON：
```json
["A"]
```

标签：多选，例如：`软件架构`、`质量属性`
