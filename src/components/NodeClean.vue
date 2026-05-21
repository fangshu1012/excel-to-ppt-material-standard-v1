<template>
  <div class="node-container">
    <div class="node-header">
      <h2>节点5: 数据清理</h2>
      <p class="description">自动清理数据，按规则映射字段，计算报价</p>
    </div>
    
    <div v-if="!isProcessing && !cleanedData.length" class="start-section">
      <div class="upload-section">
        <div class="upload-area" @click="triggerFileInput" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop" :class="{ 'drag-over': isDragOver }">
          <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" @change="onFileSelect" hidden />
          <div class="upload-icon">📁</div>
          <div class="upload-text">点击上传Excel文件</div>
          <div class="upload-hint">支持 .xlsx, .xls, .csv 格式</div>
        </div>
        
        <div v-if="selectedFile" class="file-info">
          <div class="file-details">
            <span class="file-icon">📄</span>
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
          </div>
          <button class="btn-remove" @click="removeFile">×</button>
        </div>
      </div>
      
      <div class="formula-section">
        <div class="section-header">
          <h3>🧮 报价计算公式（可选）</h3>
          <p>自定义报价计算规则，支持使用字段名和数学运算</p>
        </div>
        
        <div class="formula-inputs">
          <div class="formula-item">
            <label class="formula-label">供应商报价 =</label>
            <input
              v-model="formulaConfig.supplierPrice"
              class="formula-input"
              placeholder="供应商成本价 / 0.75"
            />
            <button class="btn-reset-formula" @click="resetFormula('supplierPrice')">↺</button>
          </div>
          
          <div class="formula-item">
            <label class="formula-label">一件代发报价 =</label>
            <input
              v-model="formulaConfig.dropshipPrice"
              class="formula-input"
              placeholder="一件代发成本价 / 0.75"
            />
            <button class="btn-reset-formula" @click="resetFormula('dropshipPrice')">↺</button>
          </div>
        </div>
        
        <div class="formula-help">
          <div class="help-title">📝 可用字段</div>
          <div class="help-fields">
            <span class="field-tag">供应商成本价</span>
            <span class="field-tag">一件代发成本价</span>
            <span class="field-tag">市场价</span>
          </div>
          <div class="help-title">⚙️ 支持的运算</div>
          <div class="help-ops">
            <span class="op-tag">+ 加法</span>
            <span class="op-tag">- 减法</span>
            <span class="op-tag">* 乘法</span>
            <span class="op-tag">/ 除法</span>
            <span class="op-tag">() 括号</span>
          </div>
          <div class="help-example">
            <span class="example-title">示例：</span>
            <span class="example-text">供应商成本价 / 0.75</span>
            <span class="example-text">一件代发成本价 * 1.35</span>
            <span class="example-text">(供应商成本价 + 18) / 0.75</span>
          </div>
        </div>
        
        <div class="action-buttons">
          <button v-if="!selectedFile && !cleanedData.length" class="btn-start" @click="startCleaning">
            🧹 使用上一步数据清理
          </button>
          <button v-else-if="selectedFile && !cleanedData.length" class="btn-start" @click="startCleaning">
            🧹 开始数据清理
          </button>
        </div>
      </div>
    </div>
    
    <div v-else-if="isProcessing" class="processing-section">
      <div class="processing-spinner">
        <div class="spinner"></div>
        <p>正在清理数据...</p>
        <div class="progress-text">{{ processingStep }}</div>
      </div>
    </div>
    
    <div v-else class="result-section">
      <div class="result-header">
        <div class="result-info">
          <h3>清理结果</h3>
          <span class="result-count">共 {{ cleanedData.length }} 条有效数据</span>
        </div>
        <div class="result-actions">
          <button class="btn-download" @click="downloadExcel">📥 下载清理结果</button>
          <button v-if="removedData.length > 0" class="btn-download-secondary" @click="downloadRemovedData">📥 下载剔除数据</button>
          <button class="btn-refresh" @click="resetCleaning">🔄 重新开始</button>
        </div>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in cleanedData" :key="index">
              <td v-for="col in columns" :key="col.key">
                <input
                  v-model="row[col.key]"
                  class="cell-input"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="removedData.length > 0" class="removed-section">
        <div class="removed-header">
          <h3>⚠️ 已剔除的数据（价差 < 10%）</h3>
          <span class="removed-count">共 {{ removedData.length }} 条</span>
        </div>
        <div class="table-container removed-table">
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
                <th>价差</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in removedData" :key="'removed-' + index" class="removed-row">
                <td v-for="col in columns" :key="col.key">
                  <span class="removed-cell">{{ row[col.key] }}</span>
                </td>
                <td>
                  <span class="removed-cell diff-rate">{{ row['价差'] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="cleaning-rules">
        <h4>清理规则说明</h4>
        <div class="rules-grid">
          <div class="rule-item">
            <span class="rule-icon">📝</span>
            <div class="rule-content">
              <span class="rule-title">行处理</span>
              <span class="rule-desc">空行自动跳过，不在原文件修改</span>
            </div>
          </div>
          <div class="rule-item">
              <span class="rule-icon">💰</span>
              <div class="rule-content">
                <span class="rule-title">报价计算</span>
                <span class="rule-desc">供货价 ÷ 0.75 四舍五入</span>
              </div>
            </div>
            <div class="rule-item">
              <span class="rule-icon">⚠️</span>
              <div class="rule-content">
                <span class="rule-title">价差过滤</span>
                <span class="rule-desc">价差 < 10% 的数据将被剔除</span>
              </div>
            </div>
            <div class="rule-item">
              <span class="rule-icon">📋</span>
            <div class="rule-content">
              <span class="rule-title">字段精简</span>
              <span class="rule-desc">只保留10列标准输出</span>
            </div>
          </div>
          <div class="rule-item">
            <span class="rule-icon">🔄</span>
            <div class="rule-content">
              <span class="rule-title">换行处理</span>
              <span class="rule-desc">换行符替换为｜分隔符</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="action-bar">
      <button class="btn-back" @click="$emit('back')">← 返回</button>
      <button 
        class="btn-next" 
        :disabled="!cleanedData.length"
        @click="handleNext"
      >
        确认清理结果并继续 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as XLSX from 'xlsx';

const props = defineProps(['data']);
const emit = defineEmits(['complete', 'back', 'update-data']);

const fileInput = ref(null);
const selectedFile = ref(null);
const isDragOver = ref(false);
const isProcessing = ref(false);
const processingStep = ref('');
const cleanedData = ref([]);
const sourceData = ref([]);
const removedData = ref([]);

const formulaConfig = ref({
  supplierPrice: '供应商成本价 / 0.75',
  dropshipPrice: '一件代发成本价 / 0.75'
});

const fieldMapping = {
  '供应商成本价': 'supplierCost',
  '一件代发成本价': 'dropshipCost',
  '市场价': 'marketPrice'
};

const resetFormula = (field) => {
  if (field === 'supplierPrice') {
    formulaConfig.value.supplierPrice = '供应商成本价 / 0.75';
  } else {
    formulaConfig.value.dropshipPrice = '一件代发成本价 / 0.75';
  }
};

const evaluateFormula = (formula, values) => {
  if (!formula || formula.trim() === '') {
    return '';
  }
  
  let expr = formula;
  for (const [fieldName, valueKey] of Object.entries(fieldMapping)) {
    const value = values[valueKey] || 0;
    expr = expr.replace(new RegExp(fieldName, 'g'), value);
  }
  
  try {
    const result = new Function(`return ${expr}`)();
    return Math.round(result);
  } catch (error) {
    console.error('公式解析错误:', error);
    return '';
  }
};

const columns = [
  { key: '编号', label: '编号' },
  { key: '供应商', label: '供应商' },
  { key: '名称', label: '名称' },
  { key: '产品参数', label: '产品参数' },
  { key: '一句话卖点', label: '一句话卖点' },
  { key: '市场价', label: '市场价' },
  { key: '供货价', label: '供货价' },
  { key: '一件代发成本价', label: '一件代发成本价' },
  { key: '供货价报价', label: '供货价报价' },
  { key: '一件代发报价', label: '一件代发报价' }
];

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile.value = file;
    parseExcel(file);
  }
};

const onDragOver = () => {
  isDragOver.value = true;
};

const onDragLeave = () => {
  isDragOver.value = false;
};

const onDrop = (e) => {
  isDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
    selectedFile.value = file;
    parseExcel(file);
  }
};

const removeFile = () => {
  selectedFile.value = null;
  sourceData.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const resetCleaning = () => {
  cleanedData.value = [];
  selectedFile.value = null;
  sourceData.value = [];
  isProcessing.value = false;
  processingStep.value = '';
};

const parseExcel = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      if (jsonData.length > 1) {
        const headers = jsonData[0];
        sourceData.value = jsonData.slice(1).map(row => {
          const item = {};
          headers.forEach((header, index) => {
            if (header) {
              item[header] = row[index] || '';
            }
          });
          return item;
        });
      }
    } catch (error) {
      console.error('解析Excel失败:', error);
      alert('解析Excel文件失败');
    }
  };
  reader.readAsArrayBuffer(file);
};

const startCleaning = async () => {
  isProcessing.value = true;
  
  const steps = [
    '正在读取源数据...',
    '正在映射字段...',
    '正在计算报价...',
    '正在清理空行...',
    '清理完成'
  ];
  
  for (const step of steps) {
    processingStep.value = step;
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  
  let data = sourceData.value.length > 0 ? sourceData.value : (props.data.extractedData || [
    {
      '编号': 'SSP20260422283',
      '供应商名称': '某某供应商',
      '产品名称': '松风雅韵-翻盖式礼盒配置A',
      '产品参数': '礼盒42x31x26cm｜纸盒｜茶杯x2｜茶宠x1',
      '营销文案': '国潮设计｜手工粽+咸鸭蛋组合｜企业定制logo',
      '市价': '299',
      '供应商报价1': '180',
      '供应商一件代发报价': '195',
      '备注': '含税含运',
      '京东天猫链接': 'https://example.com/product1'
    },
    {
      '编号': 'SSP20260422284',
      '供应商名称': '某某供应商',
      '产品名称': '茶香雅韵-双层礼盒配置B',
      '产品参数': '礼盒38x28x24cm｜木盒｜茶叶罐x2｜茶具x1',
      '营销文案': '古典雅致｜精选茶叶｜商务送礼首选',
      '市价': '399',
      '供应商报价1': '240',
      '供应商一件代发报价': '260',
      '备注': '含税含运',
      '京东天猫链接': 'https://example.com/product2'
    }
  ]);
  
  removedData.value = [];
  
  const processedData = data.map(item => {
    const 编号 = item['商品编号 - 标品'] || item['商品编号'] || item['标品'] || item['编号'] || '';
    const 名称 = item['商品品名'] || item['名称'] || item['产品名称'] || '';
    const 供货价 = item['供应商报价1#'] || item['供应商报价1'] || item['供货价'] || '';
    const 一件代发成本价 = item['供货价（一件代发）'] || item['供应商一件代发报价'] || item['一件代发成本价'] || '';
    const 一句话卖点 = item['营销文案'] || item['一句话卖点'] || item['卖点'] || '';
    const 市场价 = item['市价'] || item['市场价'] || '';
    
    const formulaValues = {
      supplierCost: parseFloat(供货价) || 0,
      dropshipCost: parseFloat(一件代发成本价) || 0,
      marketPrice: parseFloat(市场价) || 0
    };
    
    const 供货价报价 = evaluateFormula(formulaConfig.value.supplierPrice, formulaValues);
    const 一件代发报价 = evaluateFormula(formulaConfig.value.dropshipPrice, formulaValues);
    
    return {
      '编号': 编号,
      '名称': 名称,
      '市场价': 市场价,
      '供货价报价': 供货价报价,
      '完整数据': {
        '编号': 编号,
        '供应商': item['供应商名称'] || item['供应商'] || '',
        '名称': 名称,
        '产品参数': item['产品参数'] || item['参数'] || '',
        '一句话卖点': 一句话卖点,
        '市场价': 市场价,
        '供货价': 供货价,
        '一件代发成本价': 一件代发成本价,
        '供货价报价': 供货价报价,
        '一件代发报价': 一件代发报价
      }
    };
  });
  
  cleanedData.value = [];
  
  processedData.forEach(item => {
    const 市场价 = parseFloat(item['市场价']);
    const 供货价报价 = parseFloat(item['供货价报价']);
    
    if (!isNaN(市场价) && !isNaN(供货价报价) && 市场价 > 0 && 供货价报价 > 0) {
      const 价差 = ((市场价 - 供货价报价) / 市场价 * 100).toFixed(1);
      
      if (parseFloat(价差) < 10) {
        removedData.value.push({
          ...item['完整数据'],
          '价差': 价差 + '%'
        });
        return;
      }
    }
    
    cleanedData.value.push(item['完整数据']);
  });
  
  isProcessing.value = false;
};

const handleNext = () => {
  emit('update-data', { cleanedData: cleanedData.value });
  emit('complete');
};

const downloadExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(cleanedData.value);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '清理结果');
  XLSX.writeFile(workbook, '清理结果.xlsx');
};

const downloadRemovedData = () => {
  const worksheet = XLSX.utils.json_to_sheet(removedData.value);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '剔除数据');
  XLSX.writeFile(workbook, '剔除数据.xlsx');
};
</script>

<style scoped>
.node-container {
  padding: 30px;
}

.node-header {
  margin-bottom: 30px;
}

.node-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.start-section {
  text-align: center;
}

.upload-section {
  max-width: 600px;
  margin: 0 auto;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  margin-bottom: 20px;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f0f9ff;
}

.upload-area.drag-over {
  border-color: #667eea;
  background: #ecf5ff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 13px;
  color: #909399;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f0f9eb;
  border-radius: 8px;
  margin-bottom: 20px;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  font-size: 24px;
}

.file-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.file-size {
  font-size: 13px;
  color: #909399;
}

.btn-remove {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #f56c6c;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: #f04040;
}

.action-buttons {
  margin-top: 20px;
}

.btn-start {
  padding: 16px 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.processing-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px;
}

.processing-spinner {
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.processing-spinner p {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #606266;
}

.progress-text {
  font-size: 14px;
  color: #409eff;
}

.result-section {
  margin-bottom: 30px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.result-header h3 {
  margin: 0;
  font-size: 16px;
  color: #606266;
}

.btn-refresh {
  padding: 8px 16px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-refresh:hover {
  background: #e4e7ed;
}

.btn-download {
  padding: 8px 16px;
  background: #67c23a;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-download:hover {
  background: #5daf34;
}

.btn-download-secondary {
  padding: 8px 16px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-download-secondary:hover {
  background: #e4e7ed;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-count {
  padding: 4px 12px;
  background: #f0f9eb;
  border-radius: 20px;
  font-size: 12px;
  color: #67c23a;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  margin-bottom: 24px;
}

.table-container.removed-table {
  border-color: #f56c6c;
  background: #fef0f0;
}

.removed-section {
  margin-bottom: 24px;
}

.removed-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.removed-header h3 {
  margin: 0;
  font-size: 14px;
  color: #f56c6c;
}

.removed-count {
  padding: 4px 12px;
  background: #fef0f0;
  border-radius: 20px;
  font-size: 12px;
  color: #f56c6c;
}

.removed-row {
  background: #fff5f5;
}

.removed-cell {
  color: #909399;
  font-size: 13px;
}

.diff-rate {
  color: #f56c6c;
  font-weight: 500;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ebeef5;
  min-width: 100px;
}

.data-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #606266;
}

.cell-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.cell-input:focus {
  outline: none;
  border-color: #409eff;
}

.cleaning-rules {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.cleaning-rules h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #606266;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.rule-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.rule-icon {
  font-size: 24px;
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.rule-desc {
  font-size: 12px;
  color: #909399;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-back {
  padding: 12px 24px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #e4e7ed;
}

.btn-next {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-next:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-next:disabled {
  background: #e4e7ed;
  cursor: not-allowed;
}

.formula-section {
  max-width: 600px;
  margin: 30px auto 0;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
}

.section-header {
  text-align: left;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.section-header p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.formula-inputs {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.formula-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.formula-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  min-width: 120px;
  text-align: right;
}

.formula-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  background: white;
  transition: all 0.3s ease;
}

.formula-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.btn-reset-formula {
  padding: 10px 16px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-reset-formula:hover {
  background: #e4e7ed;
}

.formula-help {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.help-title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.help-fields,
.help-ops {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.field-tag {
  padding: 4px 12px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
}

.op-tag {
  padding: 4px 12px;
  background: #f6ffed;
  color: #52c41a;
  border-radius: 4px;
  font-size: 12px;
}

.help-example {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.example-title {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.example-text {
  padding: 4px 12px;
  background: #fff7e6;
  color: #fa8c16;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}
</style>
