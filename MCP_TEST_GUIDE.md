# MCP 测试指南

## 当前测试进度

### ✅ 已完成的测试
- 环境准备（Node.js、Ollama、模型、环境变量）
- 代码编译
- 基础功能验证
- **服务器启动和初始化**（数据库包含 3472 条记录）
- **向量搜索功能**（测试通过）

### ⏳ 待完成的测试
- 文件监控功能（需要手动测试）
- MCP 连接和工具调用（MCP Inspector 已安装）

## MCP Inspector 测试步骤

### 1. 启动 MCP Inspector

在 PowerShell 或命令行中执行：

```bash
mcp-inspector
```

这会打开一个 Web 界面（通常在浏览器中自动打开，或访问 http://localhost:3000）

### 2. 配置服务器连接

在 MCP Inspector 界面中：

1. **点击 "Add Server" 或 "New Server"**

2. **填写服务器配置**：
   - **Name**: `obsidian-lumina`
   - **Command**: `node`
   - **Args**: `D:\code_project\Obsidian-Lumina-MCP\dist\index.js`
   - **Environment Variables** (点击添加):
     ```
     OBSIDIAN_PATH=C:\Users\felix\Documents\Obsidian Vault
     EMBED_MODEL=bge-m3:latest
     DB_PATH=./.lancedb
     ```

3. **点击 "Connect" 或 "Save and Connect"**

### 3. 验证连接

**预期结果**:
- ✅ 连接状态显示为 "Connected" 或绿色
- ✅ 在 "Tools" 列表中看到 `search_notes` 工具
- ✅ 工具描述显示: "Search Obsidian notes using vector similarity search"

### 4. 测试工具调用

1. **选择 `search_notes` 工具**

2. **在参数输入框中输入**:
   ```json
   {
     "query": "机器学习"
   }
   ```

3. **点击 "Call Tool" 或 "Execute"**

**预期结果**:
- ✅ 返回 JSON 格式的搜索结果
- ✅ 包含最多 5 条结果
- ✅ 每条结果包含:
   - `content`: 笔记内容片段
   - `filePath`: 文件路径
   - `score`: 相似度分数

**示例返回**:
```json
[
  {
    "content": "机器学习是人工智能的一个分支...",
    "filePath": "C:\\Users\\felix\\Documents\\Obsidian Vault\\AI大模型\\...",
    "score": 0.85
  },
  ...
]
```

### 5. 测试不同的查询

尝试不同的搜索查询，验证搜索功能：

```json
{"query": "TypeScript"}
```

```json
{"query": "向量数据库"}
```

```json
{"query": "Obsidian 笔记"}
```

## 文件监控测试

### 测试文件新增

1. **确保服务器正在运行** (`npm run dev`)

2. **在 Obsidian 文件夹中创建新文件**:
   - 路径: `C:\Users\felix\Documents\Obsidian Vault\test-new-file.md`
   - 内容: 任意 Markdown 内容

3. **观察服务器控制台输出**:
   - 应该看到: `File added: [文件路径]`
   - 应该看到: `Processed X paragraphs from [文件路径]`

4. **验证文件已被索引**:
   - 使用 MCP Inspector 搜索新文件中的内容
   - 应该能在搜索结果中找到

### 测试文件修改

1. **修改一个已存在的 .md 文件**

2. **保存文件**

3. **观察服务器控制台输出**:
   - 应该看到: `File changed: [文件路径]`
   - 应该看到: `Processed X paragraphs from [文件路径]`

## 故障排除

### MCP Inspector 无法连接

**可能原因**:
- 服务器未启动
- 路径配置错误
- 环境变量未正确传递

**解决方法**:
1. 确保服务器正在运行: `npm run dev`
2. 检查路径是否为绝对路径
3. 检查环境变量是否正确

### 工具调用返回空结果

**可能原因**:
- 数据库为空（需要运行全量扫描）
- 查询词不匹配

**解决方法**:
1. 运行 `npm run test:server` 检查数据库记录数
2. 尝试更通用的查询词
3. 确保服务器已完成全量扫描

### 文件监控不工作

**可能原因**:
- 文件路径配置错误
- chokidar 权限问题

**解决方法**:
1. 检查 `.env` 文件中的 `OBSIDIAN_PATH`
2. 确保路径是绝对路径
3. 检查文件权限

## 测试完成检查清单

完成以下所有项后，测试完成：

- [ ] MCP Inspector 能够成功连接
- [ ] `search_notes` 工具出现在工具列表中
- [ ] 工具调用返回搜索结果
- [ ] 搜索结果包含正确的文件路径和内容
- [ ] 文件新增能够被检测并索引
- [ ] 文件修改能够被检测并更新索引

## 下一步

测试完成后，您可以：
1. 配置 Claude Desktop 进行实际使用
2. 根据需要调整搜索参数（如返回结果数量）
3. 监控服务器性能
4. 根据需要扩展功能

