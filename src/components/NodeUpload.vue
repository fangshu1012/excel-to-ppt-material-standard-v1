<template>
  <div class="node-container">
    <div class="node-header">
      <h2>节点1: 上传文件</h2>
      <p class="description">支持格式: .pptx / .pdf / .jpg / .png，支持多文件批量上传</p>
    </div>
    
    <div class="upload-area">
      <div
        class="upload-box"
        :class="{ 'drag-over': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="handleDrop"
      >
        <input
          type="file"
          id="file-input"
          class="file-input"
          multiple
          accept=".pptx,.pdf,.jpg,.jpeg,.png"
          @change="handleFileSelect"
        />
        <label for="file-input" class="upload-label">
          <div class="upload-icon">📁</div>
          <div class="upload-text">
            <span class="primary-text">点击或拖拽文件到此处上传</span>
            <span class="secondary-text">支持 PPTX、PDF、JPG、PNG 格式</span>
          </div>
        </label>
      </div>
    </div>
    
    <div v-if="uploadedFiles.length > 0" class="file-list">
      <h3>已上传文件</h3>
      <div v-for="(file, index) in uploadedFiles" :key="index" class="file-item">
        <div class="file-icon">{{ getFileIcon(file.name) }}</div>
        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatSize(file.size) }}</span>
        </div>
        <button class="delete-btn" @click="removeFile(index)">
          <span>×</span>
        </button>
      </div>
    </div>
    
    <div class="action-bar">
      <button class="btn-next" :disabled="uploadedFiles.length === 0" @click="handleNext">
        确认上传并继续 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['complete', 'update-data']);

const isDragOver = ref(false);
const uploadedFiles = ref([]);

const handleDrop = (e) => {
  isDragOver.value = false;
  const files = Array.from(e.dataTransfer.files);
  addFiles(files);
};

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  addFiles(files);
};

const addFiles = (files) => {
  const validFiles = files.filter(file => {
    const ext = file.name.split('.').pop().toLowerCase();
    return ['pptx', 'pdf', 'jpg', 'jpeg', 'png'].includes(ext);
  });
  uploadedFiles.value = [...uploadedFiles.value, ...validFiles];
};

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
};

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    pptx: '📊',
    pdf: '📕',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️'
  };
  return icons[ext] || '📄';
};

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const handleNext = async () => {
  const filesData = [];
  for (const file of uploadedFiles.value) {
    const arrayBuffer = await file.arrayBuffer();
    filesData.push({
      name: file.name,
      size: file.size,
      type: file.type,
      data: arrayBuffer
    });
  }
  emit('update-data', { uploadedFiles: uploadedFiles.value, filesData });
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

.upload-area {
  margin-bottom: 30px;
}

.upload-box {
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-box:hover {
  border-color: #409eff;
  background: #f0f5ff;
}

.upload-box.drag-over {
  border-color: #409eff;
  background: #e3f2fd;
}

.file-input {
  display: none;
}

.upload-label {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 48px;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.primary-text {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.secondary-text {
  font-size: 14px;
  color: #909399;
}

.file-list {
  margin-bottom: 30px;
}

.file-list h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #606266;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background 0.3s ease;
}

.file-item:hover {
  background: #f0f0f0;
}

.file-icon {
  font-size: 24px;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 14px;
  color: #303133;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: #f56c6c;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: #e43939;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
</style>