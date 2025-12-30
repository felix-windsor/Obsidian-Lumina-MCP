# Obsidian Lumina MCP

一个基于 Model Context Protocol (MCP) 的 Obsidian 笔记向量搜索服务器。使用 Ollama 进行文本嵌入，LanceDB 存储向量数据，提供语义搜索功能。

## 功能特性

- 🔍 **向量语义搜索**: 使用 Ollama 嵌入模型将笔记内容转换为向量，支持语义相似度搜索
- 📁 **自动文件监控**: 使用 chokidar 实时监控 Obsidian 笔记文件夹，自动索引新增和修改的文件
- 📝 **段落级索引**: 按段落（`\n\n`）分割笔记内容，提供更精确的搜索结果
- 🚀 **MCP 协议**: 通过 MCP 协议提供 `search_notes` 工具，可与 Claude Desktop 等客户端集成

## 前置要求

- Node.js >= 18
- Ollama 已安装并运行
- 已下载嵌入模型（如 `nomic-embed-text`）

### 安装 Ollama 和模型

1. 安装 Ollama: https://ollama.com/
2. 下载嵌入模型:
   ```bash
   ollama pull nomic-embed-text
   ```

## 安装

1. 克隆或下载项目
2. 安装依赖:
   ```bash
   npm install
   ```
3. 复制环境变量示例文件并配置:
   ```bash
   cp .env.example .env
   ```
4. 编辑 `.env` 文件，设置 `OBSIDIAN_PATH` 为您的 Obsidian 笔记文件夹路径

## 配置

### 环境变量

在 `.env` 文件中配置以下变量:

- `OBSIDIAN_PATH`: Obsidian 笔记文件夹的绝对路径（必需）
- `EMBED_MODEL`: Ollama 嵌入模型名称（默认: `nomic-embed-text`）
- `DB_PATH`: LanceDB 数据库存储路径（默认: `./.lancedb`）

### 示例配置

```env
OBSIDIAN_PATH=C:\Users\YourName\Documents\ObsidianVault
EMBED_MODEL=nomic-embed-text
DB_PATH=./.lancedb
```

## 使用方法

### 快速开始

1. **启动服务器**:
   ```bash
   npm run dev
   ```
   服务器会持续运行，监控文件变化并提供搜索服务。

2. **配置 MCP 客户端**:
   - 使用 MCP Inspector 进行测试（见下方）
   - 或配置 Claude Desktop 进行实际使用（见下方）

详细使用说明请参考 `USAGE_GUIDE.md`。

### 开发模式

使用 tsx 直接运行（无需编译）:

```bash
npm run dev
```

### 生产模式

1. 编译 TypeScript:
   ```bash
   npm run build
   ```

2. 运行编译后的代码:
   ```bash
   npm start
   ```

## 使用 MCP 服务

### 方式 1: 使用 MCP Inspector（测试）

1. **启动 Inspector**:
   ```bash
   mcp-inspector
   ```

2. **配置服务器**:
   - Command: `node`
   - Args: `[项目绝对路径]/dist/index.js`
   - Environment Variables: 设置 `OBSIDIAN_PATH`, `EMBED_MODEL`, `DB_PATH`

3. **测试工具**: 选择 `search_notes` 工具并输入查询

详细步骤请参考 `USAGE_GUIDE.md` 或 `MCP_TEST_GUIDE.md`。

### 方式 2: 使用 Claude Desktop（实际使用）

#### 找到配置文件

在 Claude Desktop 的配置文件中添加以下配置:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "obsidian-lumina": {
      "command": "node",
      "args": ["D:\\code_project\\Obsidian-Lumina-MCP\\dist\\index.js"],
      "env": {
        "OBSIDIAN_PATH": "C:\\Users\\YourName\\Documents\\ObsidianVault",
        "EMBED_MODEL": "nomic-embed-text",
        "DB_PATH": "./.lancedb"
      }
    }
  }
}
```

**注意**: 将路径替换为您的实际路径。

### MCP Inspector

使用 MCP Inspector 进行测试:

1. 安装 MCP Inspector:
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. 运行 Inspector:
   ```bash
   mcp-inspector
   ```

3. 配置服务器:
   - Command: `node`
   - Args: `[项目路径]/dist/index.js`
   - Env: 设置环境变量

## 工具说明

### search_notes

搜索 Obsidian 笔记的向量语义搜索工具。

**参数**:
- `query` (string, 必需): 搜索查询文本

**返回**:
- 最相关的 5 条笔记段落及其文件路径和相似度分数

**示例**:
```json
{
  "query": "如何学习 TypeScript"
}
```

## 工作原理

1. **初始化**: 启动时连接 LanceDB，如果表不存在则创建新表
2. **全量扫描**: 扫描 Obsidian 文件夹中的所有 `.md` 文件
3. **文件处理**: 
   - 读取文件内容
   - 按段落（`\n\n`）分割
   - 使用 Ollama 将每个段落转换为向量
   - 存储到 LanceDB
4. **实时监控**: 使用 chokidar 监控文件变化，自动更新索引
5. **搜索**: 将查询转换为向量，在 LanceDB 中执行向量相似度搜索

## MCP 规范遵循

本项目严格遵循 [Model Context Protocol 规范](https://modelcontextprotocol.io/specification)：

- ✅ **STDIO 传输规范**: 所有日志输出使用 `console.error()` 写入 stderr，确保不会干扰 JSON-RPC 消息传输
- ✅ **工具注册**: 使用标准的 MCP SDK 注册工具，提供类型安全的接口
- ✅ **错误处理**: 符合 MCP 错误响应格式，确保客户端能正确处理错误情况

**重要**: 对于 STDIO 传输的 MCP 服务器，绝对不能向 stdout 写入任何内容（包括 `console.log()`），这会破坏 JSON-RPC 消息。本项目所有日志都输出到 stderr。

## 故障排除

### Ollama 连接失败

- 确保 Ollama 服务正在运行: `ollama serve`
- 检查模型是否已下载: `ollama list`
- 验证 `EMBED_MODEL` 环境变量是否正确

### 文件监控不工作

- 检查 `OBSIDIAN_PATH` 是否正确设置
- 确保路径是绝对路径
- 检查文件权限

### 向量搜索返回空结果

- 确保已完成初始全量扫描
- 检查 LanceDB 数据库中是否有数据
- 验证文件是否被正确索引

### 编译错误

- 确保已安装所有依赖: `npm install`
- 检查 TypeScript 版本: `npm list typescript`
- 清理并重新编译: `rm -rf dist && npm run build`

## 开发

### 项目结构

```
.
├── src/
│   └── index.ts          # 主程序文件
├── dist/                 # 编译输出目录
├── .lancedb/             # LanceDB 数据库目录
├── .env                  # 环境变量配置（需要创建）
├── .env.example          # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

### 技术栈

- **TypeScript**: 类型安全的 JavaScript
- **Ollama**: 本地 LLM 和嵌入模型
- **LanceDB**: 向量数据库
- **chokidar**: 文件系统监控
- **@modelcontextprotocol/sdk**: MCP 协议实现

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！

