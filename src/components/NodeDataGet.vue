<template>
  <div class="node-container">
    <div class="node-header">
      <h2>节点4.5: 数据获取</h2>
      <p class="description">选择数据来源：使用刚上传的新数据，或从飞书多维表格拉取已有数据复用</p>
    </div>
    
    <div class="source-options">
      <div 
        class="source-card"
        :class="{ active: dataSource === 'new' }"
        @click="selectSource('new')"
      >
        <div class="source-icon">🆕</div>
        <div class="source-info">
          <h3>新上传数据</h3>
          <p>使用节点4刚上传的新数据进行处理</p>
          <div class="data-count">
            {{ data.extractedData?.length || 0 }} 条记录
          </div>
        </div>
        <div class="source-check">
          <div v-if="dataSource === 'new'" class="check-mark">✓</div>
        </div>
      </div>
      
      <div 
        class="source-card"
        :class="{ active: dataSource === 'existing' }"
        @click="selectSource('existing')"
      >
        <div class="source-icon">📥</div>
        <div class="source-info">
          <h3>复用已有数据</h3>
          <p>从飞书多维表格拉取已有数据进行处理</p>
          <div v-if="data.feishuLink" class="link-info">
            已配置: {{ data.feishuLink }}
          </div>
          <div v-else class="link-info warning">
            未配置飞书链接
          </div>
        </div>
        <div class="source-check">
          <div v-if="dataSource === 'existing'" class="check-mark">✓</div>
        </div>
      </div>
    </div>
    
    <div v-if="dataSource === 'existing' && !data.feishuLink" class="warning-box">
      ⚠️ 请先在节点4配置飞书多维表格链接，否则无法拉取已有数据
    </div>
    
    <div class="action-bar">
      <button class="btn-back" @click="$emit('back')">← 返回</button>
      <button 
        class="btn-next" 
        :disabled="dataSource === 'existing' && !data.feishuLink"
        @click="handleNext"
      >
        确认选择并继续 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['data']);
const emit = defineEmits(['complete', 'back', 'update-data']);

const dataSource = ref('new');

const selectSource = (source) => {
  dataSource.value = source;
};

const handleNext = () => {
  emit('update-data', { dataSource: dataSource.value });
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

.source-options {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.source-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.source-card:hover {
  background: #f0f5ff;
  border-color: #409eff;
}

.source-card.active {
  background: #e3f2fd;
  border-color: #409eff;
}

.source-icon {
  font-size: 40px;
}

.source-info {
  flex: 1;
}

.source-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.source-info p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #909399;
}

.data-count {
  display: inline-block;
  padding: 4px 12px;
  background: #67c23a;
  color: white;
  font-size: 12px;
  border-radius: 4px;
}

.link-info {
  font-size: 12px;
  color: #67c23a;
  word-break: break-all;
}

.link-info.warning {
  color: #f56c6c;
}

.source-check {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.source-card.active .source-check {
  background: #409eff;
  border-color: #409eff;
}

.check-mark {
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.warning-box {
  padding: 16px;
  background: #fff7e6;
  border: 1px solid #e6a23c;
  border-radius: 8px;
  color: #e6a23c;
  font-size: 14px;
  margin-bottom: 30px;
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
</style>