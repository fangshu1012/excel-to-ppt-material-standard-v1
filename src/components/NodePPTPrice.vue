<template>
  <div class="node-container">
    <div class="node-header">
      <h2>8️⃣ PPT批量修改</h2>
      <p class="description">上传PPT文件，根据您的需求批量修改内容</p>
    </div>

    <div v-if="!isProcessing && !pptGenerated" class="upload-section">
      <div class="upload-item">
        <label class="upload-label">📊 上传PPT文件</label>
        <div class="upload-area" @click="triggerPptInput" @dragover.prevent="onPptDragOver" @dragleave="onPptDragLeave" @drop.prevent="onPptDrop" :class="{ 'drag-over': pptDragOver }">
          <input ref="pptInput" type="file" accept=".pptx" @change="onPptSelect" hidden />
          <div class="upload-icon">📁</div>
          <div class="upload-text">{{ pptFile ? pptFile.name : '点击或拖拽上传PPT文件' }}</div>
          <div class="upload-hint">支持 .pptx 格式</div>
        </div>
        <button v-if="pptFile" class="btn-remove" @click="removePpt">× 移除文件</button>
      </div>

      <div class="rules-section">
        <label class="rules-label">📝 修改规则设置</label>
        
        <div class="rule-item">
          <label>关键词替换</label>
          <div class="rule-input-group">
            <input 
              v-model="replaceRules.from" 
              type="text" 
              placeholder="要替换的关键词（如：核心价）"
              class="rule-input"
            />
            <span class="rule-arrow">→</span>
            <input 
              v-model="replaceRules.to" 
              type="text" 
              placeholder="替换为（如：供货价）"
              class="rule-input"
            />
          </div>
        </div>

        <div class="rule-item">
          <label>价格计算规则</label>
          <div class="rule-input-group">
            <span class="rule-label-text">价格</span>
            <select v-model="priceRules.operation" class="rule-select">
              <option value="divide">÷</option>
              <option value="multiply">×</option>
              <option value="add">+</option>
              <option value="subtract">-</option>
            </select>
            <input 
              v-model.number="priceRules.value" 
              type="number" 
              placeholder="数值（如：0.75）"
              class="rule-input small"
            />
            <label class="rule-checkbox">
              <input v-model="priceRules.round" type="checkbox" />
              四舍五入
            </label>
          </div>
        </div>

        <div class="rule-summary">
          <div class="summary-title">📋 当前规则预览</div>
          <div class="summary-content">
            <div v-if="replaceRules.from" class="summary-item">
              文本替换：<strong>{{ replaceRules.from }}</strong> → <strong>{{ replaceRules.to }}</strong>
            </div>
            <div v-if="priceRules.value" class="summary-item">
              价格计算：<strong>价格 {{ getOperationSymbol(priceRules.operation) }} {{ priceRules.value }}</strong>
              <span v-if="priceRules.round" class="round-badge">四舍五入</span>
            </div>
            <div v-if="!replaceRules.from && !priceRules.value" class="summary-empty">
              请设置修改规则
            </div>
          </div>
        </div>
      </div>

      <button class="btn-start" @click="modifyPPT" :disabled="!hasValidRules">
        🔄 开始修改PPT
      </button>
    </div>

    <div v-else-if="isProcessing" class="processing-section">
      <div class="processing-spinner">
        <div class="spinner"></div>
        <p>{{ processingStep }}</p>
        <div v-if="progress > 0" class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text">{{ progress }}%</span>
      </div>
    </div>

    <div v-else class="result-section">
      <div class="result-card">
        <div class="result-icon">✅</div>
        <div class="result-info">
          <h3>PPT修改成功！</h3>
          <p>共处理 {{ modifiedCount }} 页，修改了 {{ replacedCount }} 处内容</p>
        </div>
        <div class="btn-group">
          <button class="btn-download" @click="downloadPPT">
            📥 下载修改后的PPT
          </button>
        </div>
      </div>

      <div v-if="priceChanges.length > 0" class="changes-section">
        <h4>价格修改记录（前10条）</h4>
        <table class="changes-table">
          <thead>
            <tr>
              <th>原价格</th>
              <th>新价格</th>
              <th>页面</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(change, index) in priceChanges.slice(0, 10)" :key="index">
              <td>¥{{ change.original }}</td>
              <td>¥{{ change.new }}</td>
              <td>第{{ change.page }}页</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="textChanges.length > 0" class="changes-section">
        <h4>文本替换记录（前10条）</h4>
        <table class="changes-table">
          <thead>
            <tr>
              <th>原文本</th>
              <th>新文本</th>
              <th>页面</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(change, index) in textChanges.slice(0, 10)" :key="index">
              <td>{{ change.original }}</td>
              <td>{{ change.new }}</td>
              <td>第{{ change.page }}页</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="action-bar">
      <button v-if="!pptGenerated" class="btn-back" @click="$emit('back')">← 返回</button>
      <button v-if="!pptGenerated" class="btn-skip-node" @click="$emit('skip')">跳过此步骤 →</button>
      <button class="btn-next" @click="handleNext">{{ pptGenerated ? '已完成' : '完成并下载 →'}}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import JSZip from 'jszip';

const emit = defineEmits(['complete', 'back', 'skip', 'update-data']);

const pptInput = ref(null);
const pptFile = ref(null);
const pptDragOver = ref(false);
const isProcessing = ref(false);
const processingStep = ref('');
const progress = ref(0);
const pptGenerated = ref(false);
const modifiedCount = ref(0);
const replacedCount = ref(0);
const priceChanges = ref([]);
const textChanges = ref([]);
const generatedPptBlob = ref(null);

const replaceRules = ref({
  from: '核心价',
  to: '供货价'
});

const priceRules = ref({
  operation: 'divide',
  value: 0.75,
  round: true
});

const hasValidRules = computed(() => {
  return (replaceRules.value.from && replaceRules.value.to) || priceRules.value.value;
});

const getOperationSymbol = (op) => {
  const symbols = {
    divide: '÷',
    multiply: '×',
    add: '+',
    subtract: '-'
  };
  return symbols[op] || op;
};

const triggerPptInput = () => pptInput.value?.click();

const onPptSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    pptFile.value = file;
  }
};

const onPptDragOver = () => pptDragOver.value = true;
const onPptDragLeave = () => pptDragOver.value = false;

const onPptDrop = (e) => {
  pptDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.pptx')) {
    pptFile.value = file;
  }
};

const removePpt = () => {
  pptFile.value = null;
  generatedPptBlob.value = null;
  pptGenerated.value = false;
  if (pptInput.value) pptInput.value.value = '';
};

const calculatePrice = (price) => {
  const num = parseFloat(price);
  if (isNaN(num)) return null;
  
  let result = num;
  const op = priceRules.value.operation;
  const val = priceRules.value.value;
  
  switch (op) {
    case 'divide':
      result = num / val;
      break;
    case 'multiply':
      result = num * val;
      break;
    case 'add':
      result = num + val;
      break;
    case 'subtract':
      result = num - val;
      break;
  }
  
  if (priceRules.value.round) {
    result = Math.round(result);
  }
  
  return result;
};

const modifyPPT = async () => {
  if (!pptFile.value) {
    alert('请上传PPT文件');
    return;
  }

  if (!hasValidRules.value) {
    alert('请设置至少一项修改规则');
    return;
  }

  isProcessing.value = true;
  processingStep.value = '正在读取PPT文件...';
  progress.value = 0;

  try {
    const zip = await JSZip.loadAsync(pptFile.value);
    const files = Object.keys(zip.files);
    
    const fileData = {};
    const slideFiles = [];
    
    for (const filePath of files) {
      const file = zip.files[filePath];
      if (!file.dir) {
        if (filePath.startsWith('ppt/slides/slide') && filePath.endsWith('.xml')) {
          slideFiles.push({ path: filePath, file });
        }
        if (filePath.toLowerCase().endsWith('.xml') || filePath.toLowerCase().endsWith('.rels')) {
          fileData[filePath] = await file.async('string');
        } else {
          fileData[filePath] = await file.async('uint8array');
        }
      }
    }

    slideFiles.sort((a, b) => {
      const numA = parseInt(a.path.match(/slide(\d+)\.xml/)[1]);
      const numB = parseInt(b.path.match(/slide(\d+)\.xml/)[1]);
      return numA - numB;
    });

    processingStep.value = '正在处理幻灯片...';
    priceChanges.value = [];
    textChanges.value = [];
    replacedCount.value = 0;

    for (let i = 0; i < slideFiles.length; i++) {
      const { path } = slideFiles[i];
      const pageNum = i + 1;
      
      progress.value = Math.round(((i + 1) / slideFiles.length) * 100);
      processingStep.value = `正在处理第 ${pageNum} 页...`;

      let content = fileData[path];
      let modifiedContent = content;

      if (priceRules.value && priceRules.value.value) {
        const pagePriceChanges = [];
        const targetValue = priceRules.value.value;
        
        console.log('Processing page:', pageNum);
        
        const textTags = content.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
        console.log('Found', textTags.length, 'text tags');
        
        for (let i = 0; i < textTags.length; i++) {
          const tagText = textTags[i];
          const innerText = tagText.replace(/<\/?a:t[^>]*>/g, '');
          
          if (innerText === '核心价' && i + 2 < textTags.length) {
            const nextTag = textTags[i + 1];
            const priceText = nextTag.replace(/<\/?a:t[^>]*>/g, '');
            const priceMatch = priceText.match(/(\d+(?:\.\d{1,2}))/);
            
            if (priceMatch) {
              const thirdTag = textTags[i + 2];
              const thirdText = thirdTag.replace(/<\/?a:t[^>]*>/g, '');
              
              if (thirdText === '元' || thirdText.includes('元')) {
                const originalPrice = priceMatch[1];
                const newPrice = calculatePrice(originalPrice);
                
                console.log('Found match: 核心价 ->', originalPrice, '->', newPrice);
                
                if (newPrice !== null && parseFloat(originalPrice) > 0) {
                  const oldCoreTag = tagText;
                  const oldPriceTag = nextTag;
                  
                  const newCoreTag = tagText.replace('核心价', '供货价');
                  const newPriceTag = nextTag.replace(priceText, String(newPrice));
                  
                  modifiedContent = modifiedContent.split(oldCoreTag).join(newCoreTag);
                  modifiedContent = modifiedContent.split(oldPriceTag).join(newPriceTag);
                  
                  pagePriceChanges.push({
                    original: originalPrice,
                    new: newPrice,
                    page: pageNum
                  });
                }
              }
            }
          }
        }
        
        console.log('Total matches found:', pagePriceChanges.length);

        if (pagePriceChanges.length > 0) {
          priceChanges.value.push(...pagePriceChanges);
          replacedCount.value += pagePriceChanges.length;
        }
      }

      if (modifiedContent !== content) {
        fileData[path] = modifiedContent;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const newZip = JSZip();
    for (const filePath of files) {
      const file = zip.files[filePath];
      if (file.dir) {
        newZip.folder(filePath);
      } else {
        newZip.file(filePath, fileData[filePath]);
      }
    }

    processingStep.value = '正在生成PPT文件...';
    const blob = await newZip.generateAsync({ 
      type: 'blob', 
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      compression: 'DEFLATE'
    });
    generatedPptBlob.value = blob;
    modifiedCount.value = slideFiles.length;

    processingStep.value = '修改完成';
    await new Promise(resolve => setTimeout(resolve, 500));

    pptGenerated.value = true;
  } catch (error) {
    console.error('修改PPT失败:', error);
    alert('修改PPT失败：' + error.message);
  } finally {
    isProcessing.value = false;
  }
};

const downloadPPT = () => {
  if (!generatedPptBlob.value) {
    alert('请先修改PPT');
    return;
  }

  const originalName = pptFile.value.name.replace(/\.pptx$/, '');
  const downloadName = `${originalName}_已修改.pptx`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(generatedPptBlob.value);
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const handleNext = () => {
  if (pptGenerated.value) {
    emit('back');
    return;
  }
  if (generatedPptBlob.value) {
    downloadPPT();
  }
  emit('complete');
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
  font-size: 28px;
  color: #303133;
}

.description {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.upload-section {
  max-width: 600px;
  margin: 0 auto;
}

.upload-item {
  margin-bottom: 24px;
}

.upload-label,
.rules-label {
  display: block;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: #fafafa;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #667eea;
  background: #f0f5ff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 12px;
  color: #c0c4cc;
}

.btn-remove {
  margin-top: 10px;
  padding: 6px 16px;
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-remove:hover {
  background: #f04040;
  color: white;
}

.rules-section {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.rule-item {
  margin-bottom: 16px;
}

.rule-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.rule-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rule-input {
  flex: 1;
  min-width: 120px;
  padding: 10px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.rule-input:focus {
  outline: none;
  border-color: #667eea;
}

.rule-input.small {
  width: 100px;
  flex: none;
}

.rule-arrow {
  font-size: 18px;
  color: #909399;
}

.rule-select {
  padding: 10px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.rule-label-text {
  font-size: 14px;
  color: #606266;
}

.rule-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
}

.rule-summary {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #dcdfe6;
}

.summary-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 10px;
}

.summary-content {
  background: white;
  border-radius: 6px;
  padding: 12px;
}

.summary-item {
  font-size: 13px;
  color: #303133;
  margin-bottom: 6px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.round-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #67c23a;
  color: white;
  font-size: 11px;
  border-radius: 4px;
}

.summary-empty {
  font-size: 13px;
  color: #909399;
  text-align: center;
}

.btn-start {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.btn-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.progress-bar {
  width: 200px;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  margin: 16px auto;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  display: block;
  font-size: 14px;
  color: #606266;
}

.result-section {
  max-width: 800px;
  margin: 0 auto;
}

.result-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 30px;
}

.result-icon {
  font-size: 48px;
}

.result-info {
  flex: 1;
}

.result-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.result-info p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.btn-group {
  display: flex;
  gap: 12px;
}

.btn-download {
  padding: 12px 24px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-download:hover {
  background: #f5f5f5;
}

.changes-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.changes-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.changes-table {
  width: 100%;
  border-collapse: collapse;
}

.changes-table th,
.changes-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.changes-table th {
  background: #f0f0f0;
  font-weight: 600;
  color: #606266;
}

.changes-table td {
  color: #303133;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn-back,
.btn-skip-node,
.btn-next {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back {
  background: #f5f5f5;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-back:hover {
  background: #e0e0e0;
}

.btn-skip-node {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.btn-skip-node:hover {
  background: #fff0d1;
}

.btn-next {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-weight: 600;
}

.btn-next:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>