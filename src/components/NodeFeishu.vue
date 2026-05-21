<template>
  <div class="node-container">
    <div class="node-header">
      <h2>节点4: 飞书上传</h2>
      <p class="description">将Excel数据同步到飞书多维表格</p>
    </div>
    
    <div class="upload-section">
      <div class="info-card">
        <div class="info-icon">💡</div>
        <h3>数据上传说明</h3>
        <p>使用提供的 Python 脚本同步 Excel 数据到飞书多维表格。操作步骤如下：</p>
        
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>准备文件</h4>
              <p>确保已准备好清理后的 Excel 文件（如：商品数据_清理.xlsx）</p>
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>复制飞书链接</h4>
              <p>从浏览器地址栏复制飞书多维表格链接：</p>
              <div class="code-block">https://xxx.feishu.cn/base/{base_token}?table={table_id}</div>
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>执行同步脚本</h4>
              <p>打开终端，执行以下命令：</p>
              <div class="code-block">python feishu_excel_sync_api.py "<span v-if="feishuLink">{{ feishuLink }}</span><span v-else>飞书链接</span>" "<span v-if="selectedFile">{{ selectedFile.name }}</span><span v-else>Excel文件路径</span>"</div>
            </div>
          </div>
        </div>
        
        <div class="notes">
          <h4>📝 注意事项</h4>
          <ul>
            <li>需提前安装：<code>pip install openpyxl</code></li>
            <li>需提前配置飞书 CLI 并完成登录认证</li>
            <li>脚本会按「商品编号 - 标品」字段匹配记录</li>
            <li>同步字段：供货价（集采价，30套起订）← 供货价报价</li>
          </ul>
        </div>
      </div>
      
      <div class="form-section">
        <div class="file-info" v-if="selectedFile">
          <div class="file-details">
            <span class="file-icon">📄</span>
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
          </div>
          <button class="btn-remove" @click="removeFile">×</button>
        </div>
        
        <div class="upload-area" v-if="!selectedFile" @click="triggerFileInput" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop" :class="{ 'drag-over': isDragOver }">
          <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" @change="onFileSelect" hidden />
          <div class="upload-icon">📁</div>
          <div class="upload-text">点击上传Excel文件</div>
          <div class="upload-hint">支持 .xlsx, .xls, .csv 格式</div>
        </div>
        
        <div class="form-item">
          <label class="form-label">飞书多维表格链接</label>
          <input
            v-model="feishuLink"
            type="text"
            class="form-input"
            placeholder="请粘贴飞书多维表格分享链接"
          />
          <div v-if="feishuLink" class="link-info">
            <span class="link-token">Base Token: {{ parseBaseToken(feishuLink) }}</span>
            <span class="link-token">Table ID: {{ parseTableId(feishuLink) }}</span>
          </div>
        </div>
      </div>
      
      <div v-if="selectedFile && feishuLink" class="command-preview">
        <h4>💻 一键上传到飞书</h4>
        <div class="upload-progress" v-if="uploading">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="progress-text">{{ uploadMessage }}</div>
        </div>
        <div v-else-if="uploadResult" class="upload-result" :class="{ success: uploadResult.success, error: !uploadResult.success }">
          <div class="result-icon">{{ uploadResult.success ? '✅' : '❌' }}</div>
          <div class="result-message">{{ uploadResult.success ? `同步成功！更新 ${uploadResult.updated} 条记录` : uploadResult.error }}</div>
          <div v-if="uploadResult.unmatched_in_excel > 0" class="result-detail">跳过 {{ uploadResult.unmatched_in_excel }} 条（Excel有但飞书无）</div>
        </div>
        <div v-else>
          <div class="command-box">
            <code>python feishu_excel_sync_api.py "{{ feishuLink }}" "{{ selectedFile.name }}"</code>
          </div>
          <div class="btn-group">
            <button class="btn-copy" @click="copyCommand">📋 复制命令</button>
            <button class="btn-upload" @click="handleUpload">🚀 一键上传</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="action-bar">
      <button class="btn-back" @click="$emit('back')">← 返回</button>
      <button class="btn-skip-node" @click="$emit('skip')">跳过此步骤 →</button>
      <button 
        class="btn-next" 
        @click="handleNext"
      >
        完成此步骤 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['data']);
const emit = defineEmits(['complete', 'back', 'skip', 'update-data']);

const fileInput = ref(null);
const selectedFile = ref(null);
const isDragOver = ref(false);
const feishuLink = ref('');
const uploading = ref(false);
const uploadResult = ref(null);
const progressPercent = ref(0);
const uploadMessage = ref('');

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile.value = file;
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
  }
};

const removeFile = () => {
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const parseBaseToken = (url) => {
  const m = url.match(/\/base\/([A-Za-z0-9]+)/);
  return m ? m[1] : '未解析';
};

const parseTableId = (url) => {
  const m = url.match(/[?&]table=([A-Za-z0-9]+)/);
  return m ? m[1] : '未解析';
};

const copyCommand = async () => {
  const command = `python feishu_excel_sync_api.py "${feishuLink.value}" "${selectedFile.value.name}"`;
  try {
    await navigator.clipboard.writeText(command);
    alert('命令已复制到剪贴板！');
  } catch (err) {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制');
  }
};

const handleUpload = async () => {
  if (!selectedFile.value || !feishuLink.value) {
    alert('请先上传Excel文件并填写飞书链接');
    return;
  }

  uploading.value = true;
  uploadResult.value = null;
  progressPercent.value = 0;
  uploadMessage.value = '正在准备上传...';

  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('feishuUrl', feishuLink.value);

  try {
    const progressInterval = setInterval(() => {
      if (progressPercent.value < 90) {
        progressPercent.value += 5;
      }
    }, 500);

    uploadMessage.value = '正在同步数据...';

    const response = await fetch('/api/feishu-sync', {
      method: 'POST',
      body: formData
    });

    clearInterval(progressInterval);
    progressPercent.value = 100;

    const result = await response.json();
    uploadResult.value = result;
    
    if (result.success) {
      uploadMessage.value = '同步完成！';
    } else {
      uploadMessage.value = '同步失败';
    }

    uploading.value = false;
  } catch (error) {
    uploading.value = false;
    uploadResult.value = {
      success: false,
      error: '上传失败：' + error.message
    };
  }
};

const handleNext = () => {
  emit('update-data', { 
    feishuLink: feishuLink.value, 
    feishuUploadFile: selectedFile.value?.name || '' 
  });
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
  font-size: 24px;
  color: #303133;
}

.description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.upload-section {
  margin-bottom: 30px;
}

.info-card {
  background: linear-gradient(135deg, #667eea10 0%, #764ba210 100%);
  border: 2px solid #667eea30;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
}

.info-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.info-card h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  color: #303133;
}

.info-card p {
  margin: 0 0 8px 0;
  color: #606266;
  line-height: 1.6;
}

.steps {
  margin-top: 24px;
}

.step {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.step:last-child {
  margin-bottom: 0;
}

.step-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 8px 0;
  font-size: 15px;
  color: #303133;
}

.step-content p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.code-block {
  background: #1f2937;
  color: #e5e7eb;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 13px;
  margin-top: 8px;
  word-break: break-all;
}

.notes {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed #dcdfe6;
}

.notes h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #303133;
}

.notes ul {
  margin: 0;
  padding-left: 20px;
}

.notes li {
  margin: 6px 0;
  font-size: 14px;
  color: #606266;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.link-info {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.link-token {
  background: #f0f9eb;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #67c23a;
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

.command-preview {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.command-preview h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #303133;
}

.command-box {
  background: #1f2937;
  color: #e5e7eb;
  padding: 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 13px;
  margin-bottom: 16px;
  word-break: break-all;
}

.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-copy {
  padding: 10px 20px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-copy:hover {
  background: #e4e7ed;
}

.btn-upload {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-upload:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.upload-progress {
  padding: 20px;
}

.progress-bar {
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #606266;
  text-align: center;
}

.upload-result {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.upload-result.success {
  background: #f0f9eb;
  border: 1px solid #b7eb8f;
}

.upload-result.error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.result-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.result-message {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.result-detail {
  font-size: 13px;
  color: #909399;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
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

.btn-skip-node {
  padding: 12px 24px;
  background: #fff7e6;
  border: 1px solid #e6a23c;
  border-radius: 8px;
  font-size: 14px;
  color: #e6a23c;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-skip-node:hover {
  background: #ffeeba;
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

.btn-next:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 13px;
  color: #667eea;
}
</style>
