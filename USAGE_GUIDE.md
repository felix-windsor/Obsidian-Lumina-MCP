# Obsidian-Lumina-MCP 使用指南

本文档提供详细的使用说明，帮助您开始使用 Obsidian-Lumina-MCP 服务。

## 快速开始

### 1. 启动服务器

#### 开发模式（推荐用于测试）

```bash
npm run dev
```

服务器会：
- 连接 LanceDB 数据库
- 检测向量维度
- 全量扫描 Obsidian 文件夹（如果数据库为空）
- 开始监听文件变化
- 启动 MCP 服务器

#### 生产模式

```bash
# 先编译
npm run build

# 然后运行
npm start
```

### 2. 配置 MCP 客户端

MCP 服务需要通过 MCP 客户端使用。支持以下客户端：

## 使用方式

### 方式 1: 使用 MCP Inspector（测试和调试）

MCP Inspector 是官方提供的测试工具，适合开发和调试。

#### 启动 Inspector

```bash
mcp-inspector
```

这会打开一个 Web 界面（通常在浏览器中自动打开）。

#### 配置服务器

在 Inspector 界面中：

1. **点击 "Add Server" 或 "New Server"**

2. **填写配置**：
   - **Name**: `obsidian-lumina`
   - **Command**: `node`
   - **Args**: `D:\code_project\Obsidian-Lumina-MCP\dist\index.js`
   - **Environment Variables**:
     ```
     OBSIDIAN_PATH=C:\Users\felix\Documents\Obsidian Vault
     EMBED_MODEL=bge-m3:latest
     DB_PATH=./.lancedb
     ```

3. **点击 "Connect"**

4. **验证连接**：
   - 应该看到连接成功
   - 在 "Tools" 列表中看到 `search_notes` 工具

#### 使用搜索工具

1. **选择 `search_notes` 工具**

2. **输入查询参数**：
   ```json
   {
     "query": "您要搜索的内容"
   }
   ```

3. **点击 "Call Tool"**

4. **查看结果**：
   - 返回最多 5 条最相关的笔记
   - 每条结果包含内容、文件路径和相似度分数

### 方式 2: 使用 Claude Desktop（实际使用）

Claude Desktop 是 Anthropic 的官方客户端，可以集成 MCP 服务器。

#### 找到配置文件

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
  - 完整路径通常是: `C:\Users\felix\AppData\Roaming\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### 编辑配置文件

如果文件不存在，创建它；如果存在，编辑它：

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

**重要提示**:
- 使用**绝对路径**（`D:\\code_project\\...`）
- Windows 路径中的反斜杠需要转义（`\\`）
- 确保路径指向编译后的 `dist/index.js` 文件

#### 重启 Claude Desktop

保存配置文件后，**完全退出并重新启动** Claude Desktop。

#### 验证连接

1. 打开 Claude Desktop
2. 在对话中，Claude 应该能够使用 `search_notes` 工具
3. 尝试询问: "搜索我的笔记中关于 [主题] 的内容"

#### 使用示例

**示例 1: 搜索特定主题**
```
用户: 搜索我的笔记中关于机器学习的内容
Claude: [会自动调用 search_notes 工具并返回结果]
```

**示例 2: 查找相关笔记**
```
用户: 帮我找一下关于 TypeScript 的笔记
Claude: [会搜索并返回相关笔记]
```

**示例 3: 结合对话**
```
用户: 我想了解 LoRA 微调，搜索一下我的笔记
Claude: [会搜索相关笔记并基于结果回答]
```

### 方式 3: 使用其他 MCP 客户端

任何支持 MCP 协议的客户端都可以使用。配置方式类似：

1. **服务器命令**: `node`
2. **参数**: `[项目路径]/dist/index.js`
3. **环境变量**: 
   - `OBSIDIAN_PATH`
   - `EMBED_MODEL`
   - `DB_PATH`

## 工具说明

### search_notes

**功能**: 使用向量相似度搜索 Obsidian 笔记

**参数**:
- `query` (string, 必需): 搜索查询文本

**返回**:
- 最多 5 条最相关的笔记段落
- 每条结果包含:
  - `content`: 笔记内容片段
  - `filePath`: 文件路径
  - `score`: 相似度分数（越小越相似）

**示例**:
```json
{
  "query": "如何学习 TypeScript"
}
```

**返回示例**:
```json
[
  {
    "content": "TypeScript 是 JavaScript 的超集...",
    "filePath": "C:\\Users\\felix\\Documents\\Obsidian Vault\\Coding\\TypeScript.md",
    "score": 0.75
  },
  ...
]
```

## 日常使用流程

### 1. 启动服务器

```bash
npm run dev
```

保持服务器运行，它会：
- 自动监控文件变化
- 实时更新索引
- 提供搜索服务

### 2. 使用搜索

通过 MCP 客户端（如 Claude Desktop）进行搜索：

```
搜索我的笔记中关于 [主题] 的内容
```

### 3. 文件管理

服务器会自动处理：
- **新增文件**: 自动索引
- **修改文件**: 自动更新索引
- **删除文件**: 自动从索引中移除

## 高级配置

### 更改搜索返回数量

编辑 `src/index.ts`，修改 `search` 方法的默认 limit：

```typescript
async search(query: string, limit: number = 5) {  // 修改这里的 5
```

### 更改向量模型

在 `.env` 文件中修改：

```env
EMBED_MODEL=nomic-embed-text  # 改为其他模型
```

然后重新启动服务器。

### 更改数据库路径

在 `.env` 文件中修改：

```env
DB_PATH=./.lancedb  # 改为其他路径
```

## 故障排除

### 服务器无法启动

1. **检查环境变量**:
   ```bash
   type .env
   ```

2. **检查 Ollama 服务**:
   ```bash
   ollama list
   ```

3. **检查路径**:
   ```bash
   Test-Path "C:\Users\felix\Documents\Obsidian Vault"
   ```

### MCP 客户端无法连接

1. **检查服务器是否运行**:
   - 确保 `npm run dev` 正在运行

2. **检查路径配置**:
   - 使用绝对路径
   - Windows 路径使用 `\\` 转义

3. **检查环境变量**:
   - 确保在客户端配置中正确传递环境变量

### 搜索返回空结果

1. **检查数据库**:
   ```bash
   npm run test:server
   ```
   查看记录数

2. **重新扫描**:
   - 停止服务器
   - 删除 `.lancedb` 目录
   - 重新启动服务器进行全量扫描

### 文件监控不工作

1. **检查路径**:
   - 确保 `OBSIDIAN_PATH` 是绝对路径

2. **检查权限**:
   - 确保有读取 Obsidian 文件夹的权限

## 性能优化

### 大量文件处理

如果 Obsidian 文件夹包含大量文件（1000+），首次扫描可能需要较长时间。建议：
- 在非工作时间进行首次扫描
- 扫描完成后，后续更新是增量的，速度很快

### 搜索性能

- 搜索响应时间通常 < 2 秒
- 如果数据量很大，可以考虑创建索引（LanceDB 支持）

## 最佳实践

1. **保持服务器运行**: 服务器需要持续运行以提供搜索服务

2. **定期备份**: 备份 `.lancedb` 目录（如果需要）

3. **监控日志**: 观察控制台输出，及时发现错误

4. **更新索引**: 修改笔记后，服务器会自动更新索引

## 示例场景

### 场景 1: 查找学习资料

```
用户: 搜索我的笔记中关于深度学习的内容
Claude: [调用 search_notes，返回相关笔记]
```

### 场景 2: 查找代码示例

```
用户: 帮我找一下 TypeScript 泛型的例子
Claude: [搜索并返回相关代码示例]
```

### 场景 3: 知识整理

```
用户: 搜索所有关于"设计模式"的笔记
Claude: [返回所有相关笔记，帮助整理知识]
```

## 相关文档

- `README.md` - 项目介绍和安装说明
- `MCP_TEST_GUIDE.md` - MCP Inspector 测试指南
- `TEST_REPORT.md` - 测试报告
- `VERIFICATION.md` - 验证检查清单

## 获取帮助

如果遇到问题：
1. 查看 `README.md` 中的故障排除部分
2. 检查 `TEST_REPORT.md` 了解已知问题
3. 查看服务器控制台日志
4. 运行测试脚本验证功能: `npm run test:basic`

