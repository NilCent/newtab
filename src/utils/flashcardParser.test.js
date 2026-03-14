/**
 * Flashcard Parser 测试用例
 * 
 * 扩展 Markdown 语法规则：
 * 1. 标题作为卡片的 tag，标题不出现在卡片内容中
 * 2. 标题继承：遇到新标题时，同级或更高级的标题会覆盖，更低级标题会追加
 * 3. 单行正反面：`>>>` 分割，左右都有内容才分割
 * 4. 多行正反面：`::: ... :::` 包裹反面
 * 5. 单面卡片：`***` 分割多个卡片
 * 6. 卡片内容支持 markdown（列表、表格、代码块等）
 * 7. 文件路径 tag：路径中的目录和文件名作为 tag，放在 heading tag 之前
 * 8. 如果一级 heading 和文件名相同，只保留文件名的 tag
 */

export const testCases = [
  // ========== 基础单面卡片 ==========
  {
    name: '单个单面卡片',
    input: `# 名言

今日事今日毕`,
    filePath: '',
    expected: [
      { type: 'single', content: '今日事今日毕', tags: ['名言'] }
    ]
  },

  {
    name: '多个单面卡片（***分割）',
    input: `# 名言

今日事今日毕

***

明日愁来明日愁

***

一寸光阴一寸金`,
    filePath: '',
    expected: [
      { type: 'single', content: '今日事今日毕', tags: ['名言'] },
      { type: 'single', content: '明日愁来明日愁', tags: ['名言'] },
      { type: 'single', content: '一寸光阴一寸金', tags: ['名言'] }
    ]
  },

  // ========== 单行正反面卡片 ==========
  {
    name: '单个单行正反面卡片',
    input: `# 英语词汇

immune >>> 免疫`,
    filePath: '',
    expected: [
      { type: 'double', front: 'immune', back: '免疫', tags: ['英语词汇'] }
    ]
  },

  {
    name: '多个单行正反面卡片',
    input: `# 英语词汇

immune >>> 免疫
antibody >>> 抗体
antigen >>> 抗原`,
    filePath: '',
    expected: [
      { type: 'double', front: 'immune', back: '免疫', tags: ['英语词汇'] },
      { type: 'double', front: 'antibody', back: '抗体', tags: ['英语词汇'] },
      { type: 'double', front: 'antigen', back: '抗原', tags: ['英语词汇'] }
    ]
  },

  // ========== 文件路径 tag ==========
  {
    name: '文件路径 tag - 单层目录',
    input: `# Redis

## 数据类型

string >>> 字符串

list >>> 列表`,
    filePath: 'flashcard/redis.md',
    expected: [
      { type: 'double', front: 'string', back: '字符串', tags: ['flashcard', 'redis', '数据类型'] },
      { type: 'double', front: 'list', back: '列表', tags: ['flashcard', 'redis', '数据类型'] }
    ]
  },

  {
    name: '文件路径 tag - 多层目录',
    input: `# PostgreSQL

## 数据类型

integer >>> 整数

varchar >>> 可变长度字符串`,
    filePath: 'flashcard/database/postgres.md',
    expected: [
      { type: 'double', front: 'integer', back: '整数', tags: ['flashcard', 'database', 'postgres', 'PostgreSQL', '数据类型'] },
      { type: 'double', front: 'varchar', back: '可变长度字符串', tags: ['flashcard', 'database', 'postgres', 'PostgreSQL', '数据类型'] }
    ]
  },

  {
    name: '文件路径 tag - 文件名与一级标题相同',
    input: `# redis

## 数据类型

string >>> 字符串`,
    filePath: 'flashcard/redis.md',
    expected: [
      { type: 'double', front: 'string', back: '字符串', tags: ['flashcard', 'redis', '数据类型'] }
    ]
  },

  {
    name: '文件路径 tag - 文件名与一级标题相同（大小写不敏感）',
    input: `# Redis

## 数据类型

string >>> 字符串`,
    filePath: 'flashcard/redis.md',
    expected: [
      { type: 'double', front: 'string', back: '字符串', tags: ['flashcard', 'redis', '数据类型'] }
    ]
  },

  {
    name: '文件路径 tag - 无目录只有文件名',
    input: `# MQ

RabbitMQ >>> 消息队列中间件

Kafka >>> 分布式流平台`,
    filePath: 'mq.md',
    expected: [
      { type: 'double', front: 'RabbitMQ', back: '消息队列中间件', tags: ['mq'] },
      { type: 'double', front: 'Kafka', back: '分布式流平台', tags: ['mq'] }
    ]
  },

  {
    name: '文件路径 tag - 无文件路径',
    input: `# 测试

内容`,
    filePath: '',
    expected: [
      { type: 'single', content: '内容', tags: ['测试'] }
    ]
  },

  // ========== 多行正反面卡片 ==========
  {
    name: '单个多行正反面卡片',
    input: `# JavaScript

什么是闭包？

:::
闭包是指有权访问另一个函数作用域中变量的函数。

创建闭包的常见方式是在一个函数内部创建另一个函数。
:::`,
    filePath: '',
    expected: [
      { 
        type: 'double', 
        front: '什么是闭包？', 
        back: '闭包是指有权访问另一个函数作用域中变量的函数。\n\n创建闭包的常见方式是在一个函数内部创建另一个函数。',
        tags: ['JavaScript'] 
      }
    ]
  },

  // ========== 标题规则 ==========
  {
    name: '多级标题 - 追加',
    input: `# 生物学

## 细胞

细胞是生物体的基本单位

***

线粒体是细胞的能量工厂`,
    filePath: '',
    expected: [
      { type: 'single', content: '细胞是生物体的基本单位', tags: ['生物学', '细胞'] },
      { type: 'single', content: '线粒体是细胞的能量工厂', tags: ['生物学', '细胞'] }
    ]
  },

  {
    name: '多级标题 - 同级覆盖',
    input: `# 生物学

细胞是生物体的基本单位

# 化学术语

原子是化学变化中的最小粒子`,
    filePath: '',
    expected: [
      { type: 'single', content: '细胞是生物体的基本单位', tags: ['生物学'] },
      { type: 'single', content: '原子是化学变化中的最小粒子', tags: ['化学术语'] }
    ]
  },

  // ========== 边界情况 ==========
  {
    name: '空行处理',
    input: `# 名言

第一张卡片



第二张卡片`,
    filePath: '',
    expected: [
      { type: 'single', content: '第一张卡片', tags: ['名言'] },
      { type: 'single', content: '第二张卡片', tags: ['名言'] }
    ]
  },

  {
    name: '::: 内包含 :::',
    input: `# 特殊字符

问题

:::
答案中包含 ::: 这个符号
:::`,
    filePath: '',
    expected: [
      { 
        type: 'double', 
        front: '问题', 
        back: '答案中包含 ::: 这个符号',
        tags: ['特殊字符'] 
      }
    ]
  },

  {
    name: '>>> 在卡片内容中（非分割符）',
    input: `# JavaScript

代码示例

:::
箭头函数: x => x * 2
或写作: (x) => { return x * 2; }
:::`,
    filePath: '',
    expected: [
      { 
        type: 'double', 
        front: '代码示例', 
        back: '箭头函数: x => x * 2\n或写作: (x) => { return x * 2; }',
        tags: ['JavaScript'] 
      }
    ]
  },

  {
    name: '单行卡片包含 >>> 但不是分割符（多行内容）',
    input: `# JavaScript

这是一个问题
答案是 x >>> y
还有更多内容`,
    filePath: '',
    expected: [
      { 
        type: 'single', 
        content: '这是一个问题\n答案是 x >>> y\n还有更多内容',
        tags: ['JavaScript'] 
      }
    ]
  },

  {
    name: '代码块内的 *** 不作为分割符',
    input: `# JavaScript

代码示例

:::
\`\`\`
***
这是代码块中的分割符，不应该分割卡片
***
\`\`\`
:::`,
    filePath: '',
    expected: [
      { 
        type: 'double', 
        front: '代码示例', 
        back: '```\n***\n这是代码块中的分割符，不应该分割卡片\n***\n```',
        tags: ['JavaScript'] 
      }
    ]
  },

  // ========== 综合测试 ==========
  {
    name: '综合测试 - 文件路径 + 多级标题 + 多种卡片',
    input: `# PostgreSQL

## 基础

什么是 PostgreSQL？

:::
PostgreSQL 是一个功能强大的开源对象关系数据库系统。
:::

## 数据类型

integer >>> 整数

varchar >>> 可变长度字符串`,
    filePath: 'flashcard/database/postgres.md',
    expected: [
      { 
        type: 'double', 
        front: '什么是 PostgreSQL？', 
        back: 'PostgreSQL 是一个功能强大的开源对象关系数据库系统。',
        tags: ['flashcard', 'database', 'postgres', 'PostgreSQL', '基础'] 
      },
      { type: 'double', front: 'integer', back: '整数', tags: ['flashcard', 'database', 'postgres', 'PostgreSQL', '数据类型'] },
      { type: 'double', front: 'varchar', back: '可变长度字符串', tags: ['flashcard', 'database', 'postgres', 'PostgreSQL', '数据类型'] }
    ]
  }
]

/**
 * 运行测试
 */
export function runTests(parseFunction) {
  const results = []
  
  for (const testCase of testCases) {
    try {
      const actual = parseFunction(testCase.input, testCase.filePath || '')
      const expected = testCase.expected
      
      const actualStr = JSON.stringify(actual, null, 2)
      const expectedStr = JSON.stringify(expected, null, 2)
      
      if (actualStr === expectedStr) {
        results.push({
          name: testCase.name,
          passed: true
        })
      } else {
        results.push({
          name: testCase.name,
          passed: false,
          expected: expectedStr,
          actual: actualStr
        })
      }
    } catch (error) {
      results.push({
        name: testCase.name,
        passed: false,
        error: error.message
      })
    }
  }
  
  return results
}
