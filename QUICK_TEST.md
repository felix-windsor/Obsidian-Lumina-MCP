# 快速测试指南

本文档提供快速测试步骤，帮助您完成剩余的验证项。

## 已完成的测试 ✅

根据 `TEST_REPORT.md`，以下测试已完成：
- ✅ 环境准备（Node.js、Ollama、模型、环境变量）
- ✅ 代码编译
- ✅ 基础功能验证（Ollama 连接、LanceDB 连接、路径验证）

## 待完成的测试

### 1. 服务器启动测试

**步骤**:
```bash
npm run dev
```

**注意**: 如果遇到 `ERR_UNKNOWN_FILE_EXTENSION` 错误，请确保已安装 `tsx`:
```bash
npm install --save-dev tsx
```

`dev` 脚本已配置为使用 `tsx`，它比 `ts-node` 更好地支持 ESM 模式。

**预期输出**:
1. `Detected vector dimension: 1024 for model bge-m3:latest`
2. `Creating new table notes` 或 `Table notes already exists`
3. `Starting full scan of C:\Users\felix\Documents\Obsidian Vault`
4. `Processed X paragraphs from [文件路径]` (对每个文件)
5. `Full scan completed`
6. `Watching for changes in C:\Users\felix\Documents\Obsidian Vault`
7. `Obsidian Lumina MCP Server started`

**如果出现错误**:
- 检查 `.env` 文件中的路径是否正确
- 确保 Ollama 服务正在运行
- 检查 Obsidian 文件夹路径是否存在

**测试文件监控**:
1. 在 Obsidian 文件夹中创建一个新的 `.md` 文件
2. 观察控制台是否显示: `File added: [文件路径]`
3. 修改一个已存在的 `.md` 文件
4. 观察控制台是否显示: `File changed: [文件路径]`

### 2. MCP Inspector 测试

**安装 MCP Inspector**:
```bash
npm install -g @modelcontextprotocol/inspector
```

**启动 Inspector**:
```bash
mcp-inspector
```

**配置服务器**:
在 Inspector 界面中:
1. 点击 "Add Server" 或 "New Server"
2. 填写以下信息:
   - **Name**: `obsidian-lumina`
   - **Command**: `node`
   - **Args**: `D:\code_project\Obsidian-Lumina-MCP\dist\index.js`
   - **Environment Variables**:
     ```
     OBSIDIAN_PATH=C:\Users\felix\Documents\Obsidian Vault
     EMBED_MODEL=bge-m3:latest
     DB_PATH=./.lancedb
     ```

**连接服务器**:
1. 点击 "Connect" 按钮
2. 观察连接状态

**预期结果**:
- ✅ 连接成功
- ✅ 在 "Tools" 列表中看到 `search_notes` 工具

**测试工具调用**:
1. 选择 `search_notes` 工具
2. 在参数输入框中输入:
   ```json
   {
     "query": "测试搜索"
   }
   ```
3. 点击 "Call Tool" 或 "Execute"

**预期结果**:
- ✅ 返回 JSON 格式的搜索结果
- ✅ 包含 `content`、`filePath`、`score` 字段
- ✅ 最多返回 5 条结果

### 3. Claude Desktop 集成测试（可选）

**找到配置文件**:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- 完整路径通常是: `C:\Users\felix\AppData\Roaming\Claude\claude_desktop_config.json`

**编辑配置文件**:
```json
{
  "mcpServers": {
    "obsidian-lumina": {
      "command": "node",
      "args": ["D:\\code_project\\Obsidian-Lumina-MCP\\dist\\index.js"],
      "env": {
        "OBSIDIAN_PATH": "C:\\Users\\felix\\Documents\\Obsidian Vault",
        "EMBED_MODEL": "bge-m3:latest",
        "DB_PATH": "./.lancedb"
      }
    }
  }
}
```

**重启 Claude Desktop**

**测试**:
1. 打开 Claude Desktop
2. 在对话中询问: "搜索我的笔记中关于 [主题] 的内容"
3. Claude 应该能够调用 `search_notes` 工具并返回结果

## 测试检查清单

完成测试后，请检查以下项:

- [ ] 服务器能够成功启动
- [ ] 全量扫描完成（处理了所有 146 个文件）
- [ ] 文件监控正常工作（新增和修改文件都能被检测到）
- [ ] MCP Inspector 能够连接
- [ ] `search_notes` 工具能够调用
- [ ] 搜索结果合理（返回相关笔记内容）
- [ ] Claude Desktop 能够使用（如果配置了）

## 常见问题

### 服务器启动失败

**可能原因**:
- Ollama 服务未运行
- 环境变量配置错误
- Obsidian 路径不存在

**解决方法**:
1. 检查 Ollama: `ollama list`
2. 检查环境变量: `type .env`
3. 检查路径: `Test-Path "C:\Users\felix\Documents\Obsidian Vault"`

### MCP Inspector 连接失败

**可能原因**:
- 路径配置错误（需要使用绝对路径）
- 环境变量未正确传递
- 服务器未启动

**解决方法**:
1. 确保使用绝对路径
2. 检查环境变量配置
3. 查看服务器日志

### 搜索返回空结果

**可能原因**:
- 数据库为空（未完成扫描）
- 查询词不匹配

**解决方法**:
1. 等待全量扫描完成
2. 使用更通用的查询词
3. 检查控制台日志确认文件已被处理

## 测试完成后

完成所有测试后，请更新 `TEST_REPORT.md` 和 `VERIFICATION.md` 中的验证完成标准。

然后您可以:
1. 开始使用 MCP 客户端进行实际搜索
2. 根据需要调整配置
3. 监控服务器性能
4. 根据需要扩展功能

