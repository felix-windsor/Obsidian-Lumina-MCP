/**
 * 服务器功能测试脚本
 * 用于验证服务器核心功能
 */
import 'dotenv/config';
import { connect } from '@lancedb/lancedb';
import { Ollama } from 'ollama';

const DB_PATH = process.env.DB_PATH || './.lancedb';
const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';
const TABLE_NAME = 'notes';

async function testDatabaseContent() {
  console.log('\n[测试] 检查数据库内容...');
  try {
    const db = await connect(DB_PATH);
    const table = await db.openTable(TABLE_NAME);
    
    // 统计记录数
    const count = await table.countRows();
    console.log(`✓ 数据库连接成功`);
    console.log(`  表名: ${TABLE_NAME}`);
    console.log(`  记录数: ${count}`);
    
    if (count > 0) {
      // 获取一些示例数据
      const sample = await table.query().limit(3).toArray();
      console.log(`  示例记录数: ${sample.length}`);
      if (sample.length > 0) {
        console.log(`  第一条记录文件路径: ${sample[0].filePath || 'N/A'}`);
      }
    } else {
      console.log(`  ⚠ 数据库为空，需要运行全量扫描`);
    }
    
    return { table, count };
  } catch (error) {
    console.error(`✗ 数据库检查失败:`, error);
    throw error;
  }
}

async function testSearch(table: any) {
  console.log('\n[测试] 测试向量搜索功能...');
  try {
    const ollama = new Ollama();
    const testQuery = '测试搜索';
    
    // 获取查询向量
    const queryVector = await ollama.embeddings({
      model: EMBED_MODEL,
      prompt: testQuery,
    });
    
    console.log(`✓ 查询向量生成成功 (维度: ${queryVector.embedding.length})`);
    
    // 执行搜索
    const results = await table.search(queryVector.embedding).limit(3).toArray();
    console.log(`✓ 搜索执行成功`);
    console.log(`  返回结果数: ${results.length}`);
    
    if (results.length > 0) {
      console.log(`  第一条结果:`);
      console.log(`    文件路径: ${results[0].filePath || 'N/A'}`);
      console.log(`    内容预览: ${(results[0].content || '').substring(0, 50)}...`);
    }
    
    return results.length > 0;
  } catch (error) {
    console.error(`✗ 搜索测试失败:`, error);
    if (error instanceof Error && error.message.includes('empty')) {
      console.log('  (数据库为空是正常的，需要先运行全量扫描)');
      return false;
    }
    throw error;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('服务器功能测试');
  console.log('='.repeat(60));
  
  try {
    // 测试数据库
    const { table, count } = await testDatabaseContent();
    
    // 如果数据库有数据，测试搜索
    if (count > 0) {
      await testSearch(table);
      console.log('\n' + '='.repeat(60));
      console.log('✓ 所有测试通过！');
      console.log('='.repeat(60));
      console.log('\n下一步:');
      console.log('1. 测试文件监控功能（创建/修改文件）');
      console.log('2. 使用 MCP Inspector 测试工具调用');
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('⚠ 数据库为空');
      console.log('='.repeat(60));
      console.log('\n需要先运行服务器进行全量扫描:');
      console.log('  npm run dev');
    }
    
    if (table) {
      await table.close?.();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ 测试失败');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

main();

