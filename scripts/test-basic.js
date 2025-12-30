/**
 * 基础功能测试脚本
 * 用于验证核心功能是否正常工作
 */
import 'dotenv/config';
import { readFileSync, statSync, readdirSync } from 'fs';
import { join } from 'path';
import { Ollama } from 'ollama';
import { connect } from '@lancedb/lancedb';
const OBSIDIAN_PATH = process.env.OBSIDIAN_PATH;
const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';
const DB_PATH = process.env.DB_PATH || './.lancedb';
const TABLE_NAME = 'notes';
async function testOllamaConnection() {
    console.log('\n[测试 1] Ollama 连接测试...');
    try {
        const ollama = new Ollama();
        const response = await ollama.embeddings({
            model: EMBED_MODEL,
            prompt: 'test',
        });
        console.log(`✓ Ollama 连接成功`);
        console.log(`  模型: ${EMBED_MODEL}`);
        console.log(`  向量维度: ${response.embedding.length}`);
        return response.embedding.length;
    }
    catch (error) {
        console.error(`✗ Ollama 连接失败:`, error);
        throw error;
    }
}
async function testLanceDBConnection() {
    console.log('\n[测试 2] LanceDB 连接测试...');
    try {
        const db = await connect(DB_PATH);
        const tableNames = await db.tableNames();
        console.log(`✓ LanceDB 连接成功`);
        console.log(`  数据库路径: ${DB_PATH}`);
        console.log(`  现有表: ${tableNames.join(', ') || '(无)'}`);
        let table;
        if (tableNames.includes(TABLE_NAME)) {
            table = await db.openTable(TABLE_NAME);
            console.log(`✓ 表 ${TABLE_NAME} 已存在`);
        }
        else {
            console.log(`⚠ 表 ${TABLE_NAME} 不存在（首次运行时会自动创建）`);
        }
        return { db, table };
    }
    catch (error) {
        console.error(`✗ LanceDB 连接失败:`, error);
        throw error;
    }
}
async function testObsidianPath() {
    console.log('\n[测试 3] Obsidian 路径测试...');
    if (!OBSIDIAN_PATH) {
        throw new Error('OBSIDIAN_PATH 环境变量未设置');
    }
    try {
        const stats = statSync(OBSIDIAN_PATH);
        if (!stats.isDirectory()) {
            throw new Error(`${OBSIDIAN_PATH} 不是一个目录`);
        }
        console.log(`✓ Obsidian 路径存在: ${OBSIDIAN_PATH}`);
        // 统计 .md 文件数量
        let mdFileCount = 0;
        function countMdFiles(dir) {
            try {
                const entries = readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = join(dir, entry.name);
                    if (entry.isDirectory()) {
                        countMdFiles(fullPath);
                    }
                    else if (entry.isFile() && entry.name.endsWith('.md')) {
                        mdFileCount++;
                    }
                }
            }
            catch (error) {
                // 忽略无法访问的目录
            }
        }
        countMdFiles(OBSIDIAN_PATH);
        console.log(`  找到 ${mdFileCount} 个 .md 文件`);
        return mdFileCount;
    }
    catch (error) {
        console.error(`✗ Obsidian 路径检查失败:`, error);
        throw error;
    }
}
async function testVectorSearch(db, table, vectorDim) {
    console.log('\n[测试 4] 向量搜索测试...');
    if (!table) {
        console.log('⚠ 跳过搜索测试（表不存在）');
        return;
    }
    try {
        // 创建一个测试查询向量
        const ollama = new Ollama();
        const queryVector = await ollama.embeddings({
            model: EMBED_MODEL,
            prompt: 'test query',
        });
        // 尝试搜索
        const results = await table.search(queryVector.embedding).limit(1).toArray();
        console.log(`✓ 向量搜索功能正常`);
        console.log(`  测试查询返回 ${results.length} 条结果`);
        return true;
    }
    catch (error) {
        console.error(`✗ 向量搜索测试失败:`, error);
        // 如果表是空的，这是正常的
        if (error instanceof Error && error.message.includes('empty')) {
            console.log('  (表为空是正常的，首次运行时会自动索引文件)');
            return true;
        }
        throw error;
    }
}
async function main() {
    console.log('='.repeat(60));
    console.log('Obsidian-Lumina-MCP 基础功能测试');
    console.log('='.repeat(60));
    try {
        // 测试 1: Ollama 连接
        const vectorDim = await testOllamaConnection();
        // 测试 2: LanceDB 连接
        const { db, table } = await testLanceDBConnection();
        // 测试 3: Obsidian 路径
        const mdFileCount = await testObsidianPath();
        // 测试 4: 向量搜索
        await testVectorSearch(db, table, vectorDim);
        console.log('\n' + '='.repeat(60));
        console.log('✓ 所有基础测试通过！');
        console.log('='.repeat(60));
        console.log('\n下一步:');
        console.log('1. 运行 npm run dev 启动完整服务器');
        console.log('2. 使用 MCP Inspector 测试工具调用');
        console.log('3. 配置 Claude Desktop 进行集成测试');
        if (db) {
            await db.close?.();
        }
        if (table) {
            await table.close?.();
        }
        process.exit(0);
    }
    catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('✗ 测试失败');
        console.error('='.repeat(60));
        console.error(error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=test-basic.js.map