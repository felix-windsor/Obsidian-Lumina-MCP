import 'dotenv/config';
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import { Ollama } from 'ollama';
import { connect } from '@lancedb/lancedb';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// 环境变量
const OBSIDIAN_PATH = process.env.OBSIDIAN_PATH;
const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';

// 获取项目根目录（确保 DB_PATH 是绝对路径）
// 如果是从 dist/index.js 运行，需要找到项目根目录
const getProjectRoot = () => {
  // 尝试从 __dirname 或 import.meta.url 获取
  try {
    // ESM 模式
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      // dist/index.js -> 项目根目录
      return resolve(__dirname, '..');
    }
  } catch {
    // 忽略错误
  }
  // 回退到当前工作目录
  return process.cwd();
};

const PROJECT_ROOT = getProjectRoot();
const DB_PATH_RELATIVE = process.env.DB_PATH || './.lancedb';
// 将相对路径转换为绝对路径
const DB_PATH = DB_PATH_RELATIVE.startsWith('/') || (process.platform === 'win32' && DB_PATH_RELATIVE.match(/^[A-Z]:/))
  ? DB_PATH_RELATIVE
  : resolve(PROJECT_ROOT, DB_PATH_RELATIVE);

const TABLE_NAME = 'notes';

if (!OBSIDIAN_PATH) {
  console.error('Error: OBSIDIAN_PATH environment variable is not set');
  process.exit(1);
}

// VectorService 类
class VectorService {
  private db: any;
  private table: any;
  private ollama: Ollama;
  private vectorDimension: number | null = null;

  constructor() {
    this.ollama = new Ollama();
  }

  async initialize() {
    // 连接 lancedb
    this.db = await connect(DB_PATH);
    
    // 检查表是否存在，如果不存在则创建
    try {
      const tableNames = await this.db.tableNames();
      if (tableNames.includes(TABLE_NAME)) {
        this.table = await this.db.openTable(TABLE_NAME);
        console.error(`Table ${TABLE_NAME} already exists`);
        // 如果表已存在，尝试从现有数据推断向量维度
        await this.detectVectorDimension();
      } else {
        // 表不存在，需要先获取向量维度
        console.error(`Creating new table ${TABLE_NAME}`);
        await this.detectVectorDimension();
        
        // 使用检测到的向量维度创建示例向量
        const sampleVector = new Array(this.vectorDimension || 768).fill(0);
        const initialData = [{
          vector: sampleVector,
          content: '',
          filePath: '',
          lastModified: Date.now(),
        }];
        this.table = await this.db.createTable(TABLE_NAME, initialData, {
          mode: 'create',
          existOk: false,
        });
        // 删除示例数据
        await this.table.delete('content = ""');
        console.error(`Table ${TABLE_NAME} created successfully with vector dimension ${this.vectorDimension}`);
      }
    } catch (error) {
      // 如果 openTable 失败，尝试创建新表
      console.error(`Table ${TABLE_NAME} not found, creating new table`);
      try {
        await this.detectVectorDimension();
        const sampleVector = new Array(this.vectorDimension || 768).fill(0);
        const initialData = [{
          vector: sampleVector,
          content: '',
          filePath: '',
          lastModified: Date.now(),
        }];
        this.table = await this.db.createTable(TABLE_NAME, initialData, {
          mode: 'create',
          existOk: false,
        });
        await this.table.delete('content = ""');
        console.error(`Table ${TABLE_NAME} created successfully with vector dimension ${this.vectorDimension}`);
      } catch (createError) {
        console.error(`Error creating table ${TABLE_NAME}:`, createError);
        throw createError;
      }
    }
  }

  private async detectVectorDimension() {
    if (this.vectorDimension !== null) {
      return;
    }
    // 通过获取一个测试嵌入来确定向量维度
    try {
      const testEmbedding = await this.getEmbedding('test');
      this.vectorDimension = testEmbedding.length;
      console.error(`Detected vector dimension: ${this.vectorDimension} for model ${EMBED_MODEL}`);
    } catch (error) {
      console.warn(`Failed to detect vector dimension, using default 768:`, error);
      this.vectorDimension = 768; // 默认值
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.ollama.embeddings({
        model: EMBED_MODEL,
        prompt: text,
      });
      return response.embedding;
    } catch (error) {
      console.error(`Error getting embedding from Ollama (model: ${EMBED_MODEL}):`, error);
      throw new Error(`Failed to get embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async insertVector(content: string, filePath: string, lastModified: Date) {
    const vector = await this.getEmbedding(content);
    const data = {
      vector,
      content,
      filePath,
      lastModified: lastModified.getTime(),
    };
    // LanceDB 使用 add 方法添加数据
    await this.table.add([data]);
  }

  async search(query: string, limit: number = 5): Promise<Array<{ content: string; filePath: string; score?: number }>> {
    const queryVector = await this.getEmbedding(query);
    // LanceDB search 返回 VectorQuery，需要调用 limit 和 toArray
    const results = await this.table.search(queryVector).limit(limit).toArray();
    
    return results.map((result: any) => ({
      content: result.content || '',
      filePath: result.filePath || '',
      score: result._distance || result.score, // LanceDB 返回的距离分数
    }));
  }

  async deleteByFilePath(filePath: string) {
    // LanceDB 的删除操作使用 SQL 谓词字符串
    // 注意：列名是大小写敏感的，需要使用双引号或正确的列名
    try {
      // 转义单引号以防止 SQL 注入
      const escapedPath = filePath.replace(/'/g, "''");
      // 使用双引号包裹列名以确保大小写正确
      await this.table.delete(`"filePath" = '${escapedPath}'`);
    } catch (error) {
      console.error(`Error deleting records for ${filePath}:`, error);
      // 删除失败不影响主流程，继续执行
    }
  }

  async getFileLastModified(filePath: string): Promise<number | null> {
    // 查询数据库中该文件的最后修改时间
    // 注意：LanceDB 的查询 API 可能不支持 where，所以使用内存过滤
    try {
      // 获取足够多的记录来查找匹配的文件
      // 对于大量数据，这可能需要优化，但作为初始实现是可行的
      const allResults = await this.table.query().limit(50000).toArray();
      
      // 在内存中过滤匹配的文件路径
      const matchingResults = allResults.filter((result: any) => 
        result.filePath === filePath
      );
      
      if (matchingResults.length > 0) {
        // 返回该文件的最新修改时间（所有段落应该有相同的 lastModified）
        return matchingResults[0].lastModified as number;
      }
      return null; // 文件不存在于数据库中
    } catch (error) {
      console.error(`Error querying lastModified for ${filePath}:`, error);
      return null; // 查询失败，返回 null 表示需要处理
    }
  }
}

// FileWatcher 类
class FileWatcher {
  private watcher: FSWatcher;
  private vectorService: VectorService;
  private obsidianPath: string;

  constructor(vectorService: VectorService, obsidianPath: string) {
    this.vectorService = vectorService;
    this.obsidianPath = obsidianPath;
    this.watcher = chokidar.watch(`${obsidianPath}/**/*.md`, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true, // 初始扫描时不会触发 add 事件
    });
  }

  async processFile(filePath: string) {
    try {
      const stats = statSync(filePath);
      if (!stats.isFile()) {
        return;
      }

      // 检查文件是否已存在于数据库中且未修改
      const dbLastModified = await this.vectorService.getFileLastModified(filePath);
      const fileLastModified = stats.mtime.getTime();
      
      if (dbLastModified !== null && dbLastModified === fileLastModified) {
        // 文件已存在且未修改，跳过处理
        console.error(`Skipping unchanged file: ${filePath}`);
        return;
      }
      
      if (dbLastModified !== null) {
        console.error(`File modified, reprocessing: ${filePath} (DB: ${dbLastModified}, FS: ${fileLastModified})`);
      } else {
        console.error(`New file, processing: ${filePath}`);
      }

      // 文件不存在或已修改，需要处理
      const content = readFileSync(filePath, 'utf-8');
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);

      // 先删除该文件的所有旧记录（如果存在）
      await this.vectorService.deleteByFilePath(filePath);

      // 为每个段落创建向量并插入
      for (const paragraph of paragraphs) {
        if (paragraph.trim().length > 0) {
          await this.vectorService.insertVector(
            paragraph.trim(),
            filePath,
            stats.mtime
          );
        }
      }

      console.error(`Processed ${paragraphs.length} paragraphs from ${filePath}`);
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  async scanDirectory(dirPath: string) {
    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          await this.processFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }
  }

  async fullScan() {
    console.error(`Starting full scan of ${this.obsidianPath}`);
    await this.scanDirectory(this.obsidianPath);
    console.error('Full scan completed');
  }

  startWatching() {
    this.watcher
      .on('add', (filePath: string) => {
        console.error(`File added: ${filePath}`);
        this.processFile(filePath).catch(console.error);
      })
      .on('change', (filePath: string) => {
        console.error(`File changed: ${filePath}`);
        this.processFile(filePath).catch(console.error);
      })
      .on('unlink', async (filePath: string) => {
        console.error(`File deleted: ${filePath}`);
        await this.vectorService.deleteByFilePath(filePath);
      })
      .on('error', (error: unknown) => {
        console.error('Watcher error:', error);
      });

    console.error(`Watching for changes in ${this.obsidianPath}`);
  }

  stop() {
    return this.watcher.close();
  }
}

// 主函数
async function main() {
  // 初始化 VectorService
  const vectorService = new VectorService();
  await vectorService.initialize();

  // 创建 FileWatcher
  // OBSIDIAN_PATH 已经在启动时检查过，这里可以安全使用
  const fileWatcher = new FileWatcher(vectorService, OBSIDIAN_PATH!);

  // 先启动 MCP Server（不等待全量扫描完成）
  // 创建 MCP Server
  const server = new McpServer(
    {
      name: 'obsidian-lumina-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 注册 search_notes 工具
  server.registerTool(
    'search_notes',
    {
      description: 'Search Obsidian notes using vector similarity search',
      inputSchema: z.object({
        query: z.string().describe('The search query to find relevant notes'),
      }),
    },
    async (args) => {
      const { query } = args as { query: string };
      try {
        const results = await vectorService.search(query, 5);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                results.map((r) => ({
                  content: r.content,
                  filePath: r.filePath,
                  score: r.score,
                })),
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching notes: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // 启动 MCP Server（立即启动，不等待全量扫描）
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Obsidian Lumina MCP Server started');

  // 在后台异步执行全量扫描和开始监听（不阻塞 MCP Server）
  // 这样服务器可以快速启动，全量扫描在后台进行
  (async () => {
    try {
      // 全量扫描
      await fileWatcher.fullScan();
      // 开始监听
      fileWatcher.startWatching();
    } catch (error) {
      console.error('Error during background scan:', error);
    }
  })();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

