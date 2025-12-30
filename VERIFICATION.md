# 验证指南

本文档提供详细的验证步骤，确保 Obsidian-Lumina-MCP 服务器正常工作。

## 验证检查清单

### 1. 环境准备验证

#### 1.1 Node.js 版本
```bash
node --version
```
**预期**: v18.0.0 或更高版本

#### 1.2 依赖安装
```bash
npm install
```
**预期**: 所有依赖成功安装，无错误

#### 1.3 Ollama 服务
```bash
ollama serve
```
**预期**: Ollama 服务启动，监听默认端口（通常是 11434）

#### 1.4 嵌入模型
```bash
ollama list
```
**预期**: 看到 `nomic-embed-text` 或您配置的模型

如果没有，下载模型:
```bash
ollama pull nomic-embed-text
```

#### 1.5 环境变量配置
检查 `.env` 文件是否存在且配置正确:
```bash
cat .env
```
**预期**: 包含 `OBSIDIAN_PATH`、`EMBED_MODEL`、`DB_PATH`

### 2. 代码编译验证

#### 2.1 TypeScript 编译
```bash
npm run build
```
**预期**: 
- 编译成功，无错误
- 生成 `dist/index.js` 文件

#### 2.2 检查编译输出
```bash
ls -la dist/
```
**预期**: 看到 `index.js` 和 `index.d.ts` 文件

### 3. 功能验证

#### 3.1 启动服务器（开发模式）
```bash
npm run dev
```

**预期行为**:
1. 显示 "Table notes already exists" 或 "Creating new table notes"
2. 显示 "Starting full scan of [OBSIDIAN_PATH]"
3. 显示 "Processed X paragraphs from [file path]" 对每个文件
4. 显示 "Full scan completed"
5. 显示 "Watching for changes in [OBSIDIAN_PATH]"
6. 显示 "Obsidian Lumina MCP Server started"

**如果出现错误**:
- 检查 `.env` 文件中的路径是否正确
- 确保 Ollama 服务正在运行
- 检查 Obsidian 文件夹路径是否存在

#### 3.2 测试文件监控

1. 在 Obsidian 文件夹中创建一个新的 `.md` 文件
2. 观察控制台输出

**预期**: 看到 "File added: [文件路径]" 和 "Processed X paragraphs from [文件路径]"

#### 3.3 测试文件修改

1. 修改一个已存在的 `.md` 文件
2. 保存文件
3. 观察控制台输出

**预期**: 看到 "File changed: [文件路径]" 和 "Processed X paragraphs from [文件路径]"

### 4. MCP 连接验证

#### 4.1 使用 MCP Inspector

1. **安装 MCP Inspector** (如果未安装):
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. **启动 Inspector**:
   ```bash
   mcp-inspector
   ```

3. **配置服务器**:
   - 在 Inspector 界面中，点击 "Add Server"
   - Command: `node`
   - Args: `[项目绝对路径]/dist/index.js`
   - Environment Variables:
     ```
     OBSIDIAN_PATH=[您的 Obsidian 路径]
     EMBED_MODEL=nomic-embed-text
     DB_PATH=./.lancedb
     ```

4. **连接服务器**:
   - 点击 "Connect"
   - 观察连接状态

**预期**: 
- 连接成功
- 在 "Tools" 列表中看到 `search_notes` 工具

5. **测试工具调用**:
   - 选择 `search_notes` 工具
   - 输入参数:
     ```json
     {
       "query": "测试搜索"
     }
     ```
   - 点击 "Call Tool"

**预期**: 
- 返回 JSON 格式的搜索结果
- 包含 `content`、`filePath`、`score` 字段
- 最多返回 5 条结果

#### 4.2 使用 Claude Desktop

1. **找到配置文件位置**:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **编辑配置文件**:
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

3. **重启 Claude Desktop**

4. **验证连接**:
   - 打开 Claude Desktop
   - 在对话中，Claude 应该能够使用 `search_notes` 工具
   - 尝试询问: "搜索我的笔记中关于 [主题] 的内容"

**预期**: Claude 能够调用工具并返回相关笔记内容

### 5. 向量搜索验证

#### 5.1 验证数据库内容

检查 LanceDB 数据库是否包含数据:
- 数据库文件应位于 `DB_PATH` 指定的目录
- 如果进行了全量扫描，应该有数据文件

#### 5.2 测试搜索准确性

1. 在 Obsidian 中创建一个包含特定关键词的笔记
2. 等待文件被索引（观察控制台输出）
3. 使用 MCP 工具搜索该关键词

**预期**: 搜索结果中包含刚创建的笔记

#### 5.3 测试语义搜索

1. 创建一个关于 "机器学习" 的笔记
2. 使用不同的查询词搜索，如 "AI"、"深度学习"、"神经网络"

**预期**: 即使查询词不完全匹配，也能找到相关笔记（如果语义相似）

### 6. 性能验证

#### 6.1 大量文件处理

1. 准备一个包含大量 `.md` 文件的 Obsidian 文件夹（100+ 文件）
2. 启动服务器
3. 观察全量扫描时间

**预期**: 
- 扫描能够完成（可能需要几分钟）
- 没有内存溢出错误
- 控制台显示处理进度

#### 6.2 搜索响应时间

1. 在索引完成后，执行多次搜索
2. 观察响应时间

**预期**: 
- 搜索响应时间 < 2 秒（取决于数据量和硬件）
- 结果相关性合理

### 7. 错误处理验证

#### 7.1 Ollama 服务停止

1. 停止 Ollama 服务
2. 尝试执行搜索

**预期**: 
- 显示错误信息
- 服务器不崩溃
- 错误信息清晰易懂

#### 7.2 无效文件路径

1. 在 `.env` 中设置不存在的路径
2. 启动服务器

**预期**: 
- 显示明确的错误信息
- 提示路径不存在

#### 7.3 文件权限错误

1. 创建一个无读取权限的文件
2. 观察处理行为

**预期**: 
- 跳过无法读取的文件
- 显示警告信息
- 继续处理其他文件

## 常见问题排查

### 问题: 编译失败

**可能原因**:
- TypeScript 版本不兼容
- 缺少依赖

**解决方法**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 问题: Ollama 连接失败

**可能原因**:
- Ollama 服务未启动
- 模型未下载
- 网络问题

**解决方法**:
```bash
# 检查 Ollama 是否运行
curl http://localhost:11434/api/tags

# 启动 Ollama
ollama serve

# 下载模型
ollama pull nomic-embed-text
```

### 问题: 搜索返回空结果

**可能原因**:
- 数据库为空（未完成扫描）
- 查询向量维度不匹配
- 数据未正确索引

**解决方法**:
1. 检查控制台是否有处理文件的日志
2. 验证数据库文件是否存在
3. 重新启动服务器进行全量扫描

### 问题: MCP 客户端无法连接

**可能原因**:
- 路径配置错误
- 环境变量未正确传递
- 服务器未正确启动

**解决方法**:
1. 使用绝对路径
2. 检查环境变量配置
3. 查看服务器日志
4. 使用 MCP Inspector 测试连接

## 验证完成标准

完成以下所有验证项后，可以认为服务器已正确配置:

- [x] 环境准备完成（Node.js、Ollama、模型）
- [x] 代码编译成功
- [x] 服务器能够启动
- [x] 全量扫描完成（3472 条记录）
- [x] 向量搜索功能正常
- [ ] 文件监控正常工作（需要手动测试）
- [ ] MCP Inspector 能够连接（已安装，待测试）
- [ ] `search_notes` 工具能够调用（待测试）
- [ ] 搜索结果合理（待测试）
- [ ] Claude Desktop 能够使用（可选）

**当前进度**: 5/9 已完成 ✅

## 下一步

验证完成后，您可以:
1. 开始使用 MCP 客户端进行实际搜索
2. 根据需要调整配置（如向量维度、搜索数量等）
3. 监控服务器性能和日志
4. 根据需要扩展功能

