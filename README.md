# Obsidian Lumina MCP

<div align="center">

![Obsidian Lumina MCP](./assets/obsidian-mcp.jpg)

> **Lumina** (拉丁语：光、启迪) - 为您的 Obsidian 笔记带来智能搜索的"光"

一个基于 Model Context Protocol (MCP) 的 Obsidian 笔记向量搜索服务器。通过语义搜索技术，让 AI 助手能够智能地理解和搜索您的 Obsidian 笔记内容。

</div>

## ✨ 项目名称来源

**Obsidian-Lumina-MCP** 的名称含义：

- **Obsidian**: 黑曜石，代表您的笔记知识库
- **Lumina**: 拉丁语中的"光"或"启迪"，象征这个项目为您的笔记带来智能搜索的"光"，帮助您快速找到所需的知识
- **MCP**: Model Context Protocol，使 AI 助手能够访问和理解您的笔记

## 🎯 功能特性

- 🔍 **向量语义搜索**: 使用 Ollama 嵌入模型将笔记内容转换为向量，支持语义相似度搜索，不仅仅是关键词匹配
- 📁 **自动文件监控**: 使用 chokidar 实时监控 Obsidian 笔记文件夹，自动索引新增和修改的文件
- 📝 **段落级索引**: 按段落（`\n\n`）分割笔记内容，提供更精确的搜索结果
- 🚀 **MCP 协议支持**: 通过 MCP 协议提供 `search_notes` 工具，可与 Cline、Claude Desktop 等客户端无缝集成
- ⚡ **增量更新**: 智能检测文件变化，只处理新增或修改的文件，大幅提升启动速度
- 🛡️ **MCP 规范遵循**: 严格遵循 MCP 规范，确保与所有兼容客户端的稳定连接

## 📋 前置要求

在开始之前，请确保您的系统满足以下要求：

### 必需软件

1. **Node.js >= 18**
   ```bash
   node --version  # 检查版本
   ```
   - 下载地址: https://nodejs.org/

2. **Ollama**
   - 下载地址: https://ollama.com/
   - 安装后确保 Ollama 服务正在运行:
     ```bash
     ollama serve
     ```

3. **嵌入模型**
   - 推荐模型: `bge-m3:latest` 或 `nomic-embed-text`
   - 下载模型:
     ```bash
     ollama pull bge-m3:latest
     # 或
     ollama pull nomic-embed-text
     ```

### 必需信息

- **Obsidian 笔记文件夹路径**: 您需要知道 Obsidian vault 的绝对路径
  - Windows 示例: `C:\Users\YourName\Documents\Obsidian Vault`
  - macOS/Linux 示例: `/Users/YourName/Documents/Obsidian Vault`

## 🚀 快速开始

### 1. 安装项目

```bash
# 克隆项目
git clone <repository-url>
cd Obsidian-Lumina-MCP

# 安装依赖
npm install
```

### 2. 编译项目

```bash
npm run build
```

### 3. 配置 MCP 客户端

选择您使用的客户端，按照下方配置说明进行设置。

## 🔧 MCP 客户端配置

### 方式 1: Cline (VS Code 扩展) - 推荐

Cline 是 VS Code 的 AI 编程助手扩展，支持 MCP 协议。

#### 配置文件位置

**Windows**:
```
%APPDATA%\Code\User\cline_mcp_settings.json
```
或
```
C:\Users\YourName\AppData\Roaming\Code\User\cline_mcp_settings.json
```

**macOS**:
```
~/Library/Application Support/Code/User/cline_mcp_settings.json
```

**Linux**:
```
~/.config/Code/User/cline_mcp_settings.json
```

#### 配置内容

在 `cline_mcp_settings.json` 文件中添加以下配置（如果文件不存在则创建）：

```json
{
  "mcpServers": {
    "obsidian-lumina": {
      "command": "node",
      "args": ["D:\\code_project\\Obsidian-Lumina-MCP\\dist\\index.js"],
      "env": {
        "OBSIDIAN_PATH": "C:\\Users\\YourName\\Documents\\Obsidian Vault",
        "EMBED_MODEL": "bge-m3:latest",
        "DB_PATH": "./.lancedb"
      }
    }
  }
}
```

**重要提示**:
- 将 `args` 中的路径替换为您的项目绝对路径
- 将 `OBSIDIAN_PATH` 替换为您的 Obsidian 文件夹绝对路径
- Windows 路径中的反斜杠需要转义为 `\\`，或使用正斜杠 `/`
- `DB_PATH` 可以使用相对路径（相对于项目目录），会自动解析为绝对路径

#### 使用示例

配置完成后，重启 VS Code，然后在 Cline 对话中：

```
搜索我的笔记中关于机器学习的内容
```

或

```
帮我找一下关于 TypeScript 的笔记
```

### 方式 2: Claude Desktop

#### 配置文件位置

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

#### 配置内容

```json
{
  "mcpServers": {
    "obsidian-lumina": {
      "command": "node",
      "args": ["D:\\code_project\\Obsidian-Lumina-MCP\\dist\\index.js"],
      "env": {
        "OBSIDIAN_PATH": "C:\\Users\\YourName\\Documents\\Obsidian Vault",
        "EMBED_MODEL": "bge-m3:latest",
        "DB_PATH": "./.lancedb"
      }
    }
  }
}
```

**注意**: 
- 保存配置文件后，**完全退出并重新启动** Claude Desktop
- 确保路径使用绝对路径

### 方式 3: MCP Inspector (测试工具)

MCP Inspector 是官方提供的测试工具，适合开发和调试。

#### 安装

```bash
npm install -g @modelcontextprotocol/inspector
```

#### 启动

```bash
mcp-inspector
```

#### 配置

在 Inspector 界面中：
- **Command**: `node`
- **Args**: `[项目绝对路径]/dist/index.js`
- **Environment Variables**:
  ```
  OBSIDIAN_PATH=[您的 Obsidian 路径]
  EMBED_MODEL=bge-m3:latest
  DB_PATH=./.lancedb
  ```

详细步骤请参考 `MCP_TEST_GUIDE.md`。

## 🛠️ 技术栈

### 核心技术

- **TypeScript**: 类型安全的 JavaScript，提供更好的开发体验和代码质量
- **Node.js ESM**: 使用 ES Modules，支持现代 JavaScript 特性

### 向量搜索技术

- **Ollama**: 本地大语言模型和嵌入模型服务
  - 支持多种嵌入模型（如 `bge-m3`, `nomic-embed-text`）
  - 本地运行，数据隐私安全
- **LanceDB**: 高性能向量数据库
  - 支持快速向量相似度搜索
  - 数据持久化存储
  - 自动处理向量维度

### 文件监控

- **chokidar**: 跨平台文件系统监控库
  - 实时监控文件变化
  - 支持 Windows、macOS、Linux
  - 高效的事件驱动架构

### MCP 协议

- **@modelcontextprotocol/sdk**: 官方 MCP SDK
  - 标准化的工具注册和调用
  - STDIO 传输支持
  - 类型安全的接口定义

### 数据验证

- **zod**: TypeScript 优先的模式验证库
  - 工具参数验证
  - 类型安全的 schema 定义

## 💡 实现思路

### 架构设计

```
┌─────────────────┐
│  MCP Client     │  (Cline / Claude Desktop)
│  (Cline/Claude) │
└────────┬────────┘
         │ MCP Protocol (JSON-RPC over STDIO)
         │
┌────────▼─────────────────────────────────┐
│  Obsidian Lumina MCP Server             │
│  ┌─────────────────────────────────────┐ │
│  │  MCP Server (StdioServerTransport)  │ │
│  │  - 注册 search_notes 工具           │ │
│  │  - 处理工具调用                      │ │
│  └──────────────┬──────────────────────┘ │
│                 │                        │
│  ┌──────────────▼──────────────────────┐ │
│  │  VectorService                     │ │
│  │  - 向量生成 (Ollama)                │ │
│  │  - 向量存储 (LanceDB)               │ │
│  │  - 向量搜索                         │ │
│  └──────────────┬──────────────────────┘ │
│                 │                        │
│  ┌──────────────▼──────────────────────┐ │
│  │  FileWatcher                       │ │
│  │  - 文件监控 (chokidar)              │ │
│  │  - 增量更新                         │ │
│  │  - 自动索引                         │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         │
         │
┌────────▼────────┐    ┌──────────────┐
│  Ollama Service │    │  LanceDB     │
│  (Embeddings)   │    │  (Vector DB) │
└─────────────────┘    └──────────────┘
```

### 工作流程

1. **初始化阶段**
   - 连接 LanceDB 数据库
   - 检测向量维度（通过测试 embedding）
   - 创建或打开数据表

2. **启动优化**
   - **立即启动 MCP Server**: 先启动 MCP Server 并响应客户端连接
   - **后台全量扫描**: 在后台异步执行全量扫描，不阻塞服务器启动
   - **增量更新**: 检查文件修改时间，跳过未修改的文件

3. **文件处理流程**
   ```
   文件变化检测
       ↓
   检查文件修改时间
       ↓
   已存在且未修改? → 跳过
       ↓
   文件不存在或已修改
       ↓
   读取文件内容
       ↓
   按段落分割 (\n\n)
       ↓
   生成向量 (Ollama)
       ↓
   存储到数据库 (LanceDB)
   ```

4. **搜索流程**
   ```
   用户查询
       ↓
   转换为向量 (Ollama)
       ↓
   向量相似度搜索 (LanceDB)
       ↓
   返回最相关的 5 条结果
   ```

### 关键优化

1. **增量更新机制**
   - 通过比较文件修改时间判断是否需要重新处理
   - 大幅减少不必要的 embedding 计算
   - 提升启动速度和运行效率

2. **异步启动**
   - MCP Server 立即启动，不等待全量扫描
   - 解决客户端连接超时问题
   - 全量扫描在后台异步进行

3. **路径自动解析**
   - 自动将相对路径解析为绝对路径
   - 确保无论从哪里启动都能正常工作
   - 支持不同工作目录场景

4. **MCP 规范遵循**
   - 所有日志输出到 stderr，不干扰 JSON-RPC 消息
   - 标准化的错误处理
   - 类型安全的工具接口

## 📖 工具说明

### search_notes

搜索 Obsidian 笔记的向量语义搜索工具。

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
    "filePath": "C:\\Users\\YourName\\Documents\\Obsidian Vault\\Coding\\TypeScript.md",
    "score": 0.75
  },
  ...
]
```

## 🔍 工作原理详解

### 1. 向量化过程

- **文本输入**: 读取 Obsidian 笔记文件
- **段落分割**: 按双换行符（`\n\n`）分割为段落
- **向量生成**: 使用 Ollama 嵌入模型将每个段落转换为高维向量
- **存储**: 将向量、原始文本、文件路径、修改时间存储到 LanceDB

### 2. 搜索过程

- **查询向量化**: 将用户查询转换为向量
- **相似度计算**: 在 LanceDB 中计算查询向量与所有存储向量的相似度
- **结果排序**: 按相似度排序，返回最相关的结果

### 3. 增量更新

- **文件监控**: 使用 chokidar 实时监控文件系统变化
- **时间戳比较**: 比较文件修改时间与数据库中的记录
- **智能跳过**: 未修改的文件跳过处理，只处理新增或修改的文件

## 🛡️ MCP 规范遵循

本项目严格遵循 [Model Context Protocol 规范](https://modelcontextprotocol.io/specification)：

- ✅ **STDIO 传输规范**: 所有日志输出使用 `console.error()` 写入 stderr，确保不会干扰 JSON-RPC 消息传输
- ✅ **工具注册**: 使用标准的 MCP SDK 注册工具，提供类型安全的接口
- ✅ **错误处理**: 符合 MCP 错误响应格式，确保客户端能正确处理错误情况
- ✅ **快速启动**: 优化启动流程，避免客户端连接超时

**重要**: 对于 STDIO 传输的 MCP 服务器，绝对不能向 stdout 写入任何内容（包括 `console.log()`），这会破坏 JSON-RPC 消息。本项目所有日志都输出到 stderr。

## 🐛 故障排除

### 连接超时问题

如果 MCP 客户端显示 "Request timed out":

1. **检查服务器是否能手动启动**:
   ```bash
   node dist/index.js
   ```
   如果启动失败，查看错误信息

2. **检查 Ollama 服务**:
   ```bash
   ollama list
   ```
   确保 Ollama 正在运行且模型已下载

3. **检查路径配置**:
   - 确保使用绝对路径
   - 检查路径是否正确转义（Windows 使用 `\\`）

### Ollama 连接失败

- 确保 Ollama 服务正在运行: `ollama serve`
- 检查模型是否已下载: `ollama list`
- 验证 `EMBED_MODEL` 环境变量是否正确

### 文件监控不工作

- 检查 `OBSIDIAN_PATH` 是否正确设置
- 确保路径是绝对路径
- 检查文件权限

### 向量搜索返回空结果

- 确保已完成初始全量扫描（查看日志）
- 检查 LanceDB 数据库中是否有数据
- 验证文件是否被正确索引

### 编译错误

- 确保已安装所有依赖: `npm install`
- 检查 TypeScript 版本: `npm list typescript`
- 清理并重新编译: 
  ```bash
  # Windows
  rmdir /s /q dist
  npm run build
  
  # macOS/Linux
  rm -rf dist
  npm run build
  ```

## 📁 项目结构

```
Obsidian-Lumina-MCP/
├── src/
│   └── index.ts              # 主程序文件
├── dist/                     # 编译输出目录
├── .lancedb/                 # LanceDB 数据库目录（自动创建）
├── .env                      # 环境变量配置（需要创建）
├── .env.example              # 环境变量示例
├── scripts/                  # 测试脚本
│   ├── test-basic.ts        # 基础功能测试
│   └── test-server.ts       # 服务器功能测试
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 开发

### 开发模式

使用 tsx 直接运行（无需编译，支持热重载）:

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

### 测试

```bash
# 基础功能测试
npm run test:basic

# 服务器功能测试
npm run test:server
```

## 📚 相关文档

- `USAGE_GUIDE.md` - 详细使用指南
- `MCP_TEST_GUIDE.md` - MCP Inspector 测试指南
- `VERIFICATION.md` - 验证检查清单
- `QUICK_TEST.md` - 快速测试指南

## 📄 许可证

ISC

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 协议规范
- [Ollama](https://ollama.com/) - 本地 LLM 和嵌入模型
- [LanceDB](https://lancedb.github.io/lancedb/) - 向量数据库
- [Cline](https://github.com/saoudrizwan/cline) - VS Code AI 编程助手

---

**让 Lumina 为您的知识库带来智能搜索的"光"！** ✨
