<template>
  <div class="node-container">
    <div class="complete-header">
      <div class="success-icon">🎉</div>
      <h2>流程完成！</h2>
      <p class="subtitle">所有节点已处理完毕，您可以下载交付物</p>
    </div>
    
    <div class="deliverables">
      <h3>交付物清单</h3>
      <div class="deliverable-list">
        <div class="deliverable-item">
          <div class="deliverable-icon">📊</div>
          <div class="deliverable-info">
            <span class="deliverable-name">Excel推品表格</span>
            <span class="deliverable-desc">包含 {{ data.cleanedData?.length || 0 }} 条产品数据</span>
          </div>
          <button class="btn-download" @click="downloadExcel">下载</button>
        </div>
        
        <div class="deliverable-item">
          <div class="deliverable-icon">📄</div>
          <div class="deliverable-info">
            <span class="deliverable-name">PPT展示文件</span>
            <span class="deliverable-desc">占位符模板替换完成</span>
          </div>
          <button class="btn-download" @click="downloadPPT">下载</button>
        </div>
        
        <div class="deliverable-item optional">
          <div class="deliverable-icon">⭐</div>
          <div class="deliverable-info">
            <span class="deliverable-name">精选产品升级方案</span>
            <span class="deliverable-desc">非标准化，需人工挑选重点产品</span>
          </div>
          <button class="btn-view" @click="viewUpgrade">查看</button>
        </div>
        
        <div class="deliverable-item optional">
          <div class="deliverable-icon">📅</div>
          <div class="deliverable-info">
            <span class="deliverable-name">定期推送</span>
            <span class="deliverable-desc">用AI生图、生文案功能，定期发客户</span>
          </div>
          <button class="btn-view" @click="viewSchedule">查看</button>
        </div>
      </div>
    </div>
    
    <div class="summary-card">
      <h3>流程概览</h3>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">{{ data.cleanedData?.length || 0 }}</span>
          <span class="stat-label">产品数据</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ data.imageResults?.length || 0 }}</span>
          <span class="stat-label">处理图片</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ completedSteps }}</span>
          <span class="stat-label">完成步骤</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatTime }}</span>
          <span class="stat-label">用时</span>
        </div>
      </div>
    </div>
    
    <div class="action-bar">
      <button class="btn-restart" @click="handleRestart">🔄 重新开始</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps(['data']);
const emit = defineEmits(['complete']);

const completedSteps = computed(() => {
  return 8;
});

const formatTime = computed(() => {
  return '约 2 分钟';
});

const downloadExcel = () => {
  const content = [
    ['编号', '名称', '产品参数', '卖点简述', '图片', '市场价', '供货价（集采价，30套起订）', '一件代发报价', '备注', '京东/天猫链接'],
    ...(props.data.cleanedData || []).map(row => [
      row['编号'] || '',
      row['名称'] || '',
      row['产品参数'] || '',
      row['一句话卖点'] || '',
      '',
      row['市场价'] || '',
      row['供货价报价'] || '',
      row['一件代发报价'] || '',
      '',
      ''
    ])
  ];
  
  const csv = content.map(row => row.join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '推品表格.csv';
  link.click();
};

const downloadPPT = () => {
  const content = `PPT文件生成内容：

=== 产品展示PPT ===

模板占位符替换：
- {{品名}} -> 产品名称
- {{编号}} -> 商品编号  
- {{卖点摘要}} -> 营销文案
- {{产品参数}} -> 规格参数
- ¥{{市场价}} -> 零售价
- ¥{{供货价}} -> 已加35%利润
- ¥{{一件代发价}} -> 代发价

共 ${props.data.cleanedData?.length || 0} 页产品展示

生成时间：${new Date().toLocaleString()}`;
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '产品展示PPT.txt';
  link.click();
};

const viewUpgrade = () => {
  alert('精选产品升级方案：\n\n1. 人工挑选重点产品\n2. 升级包装设计\n3. 优化营销文案\n4. 美化产品图片\n\n此功能需要人工操作');
};

const viewSchedule = () => {
  alert('定期推送设置：\n\n1. 使用ChatGPT Image生成图片\n2. AI生成营销文案\n3. 定期发送给客户\n\n此功能需要配置定时任务');
};

const handleRestart = () => {
  window.location.reload();
};
</script>

<style scoped>
.node-container {
  padding: 30px;
  text-align: center;
}

.complete-header {
  margin-bottom: 40px;
}

.success-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.complete-header h2 {
  margin: 0 0 10px 0;
  font-size: 32px;
  color: #67c23a;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 16px;
}

.deliverables {
  margin-bottom: 30px;
}

.deliverables h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #606266;
  text-align: left;
}

.deliverable-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.deliverable-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid transparent;
}

.deliverable-item.optional {
  border-color: #e6a23c;
  background: #fff7e6;
}

.deliverable-icon {
  font-size: 36px;
}

.deliverable-info {
  flex: 1;
  text-align: left;
}

.deliverable-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.deliverable-desc {
  display: block;
  font-size: 14px;
  color: #909399;
}

.btn-download {
  padding: 10px 24px;
  background: #67c23a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-download:hover {
  background: #5eb838;
}

.btn-view {
  padding: 10px 24px;
  background: #e6a23c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-view:hover {
  background: #d4952f;
}

.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
}

.summary-card h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: white;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.action-bar {
  display: flex;
  justify-content: center;
}

.btn-restart {
  padding: 14px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-restart:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}
</style>