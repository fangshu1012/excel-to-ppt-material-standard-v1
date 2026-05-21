<template>
  <div class="node-container">
    <div class="node-header">
      <h2>8️⃣ 生成HTML推品手册</h2>
      <p class="description">上传Excel表格和图片压缩包，生成精美的HTML格式产品手册</p>
    </div>

    <div v-if="!isProcessing && !htmlGenerated" class="upload-section">
      <div class="upload-item">
        <label class="upload-label">📊 Excel数据文件</label>
        <div class="upload-area" @click="triggerExcelInput" @dragover.prevent="onExcelDragOver" @dragleave="onExcelDragLeave" @drop.prevent="onExcelDrop" :class="{ 'drag-over': excelDragOver }">
          <input ref="excelInput" type="file" accept=".xlsx,.xls,.csv" @change="onExcelSelect" hidden />
          <div class="upload-icon">📁</div>
          <div class="upload-text">{{ excelFile ? excelFile.name : '点击或拖拽上传Excel文件' }}</div>
          <div class="upload-hint">支持 .xlsx, .xls, .csv 格式</div>
        </div>
        <button v-if="excelFile" class="btn-remove" @click="removeExcel">× 移除文件</button>
      </div>

      <div class="upload-item">
        <label class="upload-label">🖼️ 产品图片压缩包</label>
        <div class="upload-area" @click="triggerImageInput" @dragover.prevent="onImageDragOver" @dragleave="onImageDragLeave" @drop.prevent="onImageDrop" :class="{ 'drag-over': imageDragOver }">
          <input ref="imageInput" type="file" accept=".zip" @change="onImageSelect" hidden />
          <div class="upload-icon">📦</div>
          <div class="upload-text">{{ imageFile ? imageFile.name : '点击或拖拽上传图片压缩包' }}</div>
          <div class="upload-hint">支持 .zip 格式，图片将按编号匹配到对应产品</div>
        </div>
        <button v-if="imageFile" class="btn-remove" @click="removeImage">× 移除文件</button>
        <div v-if="matchedImages > 0" class="match-info">
          ✅ 已匹配 {{ matchedImages }} 张图片
        </div>
      </div>

      <button class="btn-start" @click="generateHTML">
        📄 生成HTML推品手册
      </button>
    </div>

    <div v-else-if="isProcessing" class="processing-section">
      <div class="processing-spinner">
        <div class="spinner"></div>
        <p>{{ processingStep }}</p>
      </div>
    </div>

    <div v-else class="result-section">
      <div class="result-card">
        <div class="result-icon">📄</div>
        <div class="result-info">
          <h3>HTML手册生成成功！</h3>
          <p>已生成 {{ data.length }} 个产品展示页面</p>
        </div>
        <div class="btn-group">
          <button class="btn-download" @click="downloadHTML">
            📥 下载HTML文件
          </button>
          <button class="btn-preview" @click="previewHTML">
            👁️ 预览效果
          </button>
        </div>
      </div>

      <div v-if="previewData.length > 0" class="preview-section">
        <h4>预览（前2个产品）</h4>
        <div class="preview-grid">
          <div v-for="(item, index) in previewData.slice(0, 2)" :key="index" class="preview-card">
            <div class="preview-image-wrapper">
              <img v-if="imageMap[item['编号']]" :src="imageMap[item['编号']]" class="preview-image" alt="产品图片" />
              <div v-else class="no-image">暂无图片</div>
            </div>
            <div class="preview-info">
              <h5>{{ item['名称'] }}</h5>
              <p class="preview-price">供货价: ¥{{ item['供货价报价'] || '-' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-bar">
      <button v-if="!htmlGenerated" class="btn-back" @click="$emit('back')">← 返回</button>
      <button v-if="!htmlGenerated" class="btn-skip-node" @click="$emit('skip')">跳过此步骤 →</button>
      <button class="btn-next" @click="handleNext">{{ htmlGenerated ? '已完成' : '完成并下载 →'}}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { generateHtmlContent } from '../utils/htmlGenerator';

const props = defineProps(['data']);
const emit = defineEmits(['complete', 'back', 'skip', 'update-data']);

const excelInput = ref(null);
const imageInput = ref(null);
const excelFile = ref(null);
const imageFile = ref(null);
const excelDragOver = ref(false);
const imageDragOver = ref(false);
const isProcessing = ref(false);
const processingStep = ref('');
const htmlGenerated = ref(false);
const sourceData = ref([]);
const imageMap = ref({});
const matchedImages = ref(0);
const generatedHtmlBlob = ref(null);

const data = computed(() => sourceData.value.length ? sourceData.value : (props.data.cleanedData || []));
const previewData = computed(() => data.value);

const triggerExcelInput = () => excelInput.value?.click();
const triggerImageInput = () => imageInput.value?.click();

const onExcelSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    excelFile.value = file;
    parseExcel(file);
  }
};

const onExcelDragOver = () => excelDragOver.value = true;
const onExcelDragLeave = () => excelDragOver.value = false;

const onExcelDrop = (e) => {
  excelDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
    excelFile.value = file;
    parseExcel(file);
  }
};

const removeExcel = () => {
  excelFile.value = null;
  sourceData.value = [];
  if (excelInput.value) excelInput.value.value = '';
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
        console.log('解析Excel完成，共', sourceData.value.length, '条数据');
        matchImages();
      }
    } catch (error) {
      console.error('解析Excel失败:', error);
      alert('解析Excel文件失败');
    }
  };
  reader.readAsArrayBuffer(file);
};

const onImageSelect = async (e) => {
  const file = e.target.files[0];
  if (file) {
    imageFile.value = file;
    await extractImages(file);
  }
};

const onImageDragOver = () => imageDragOver.value = true;
const onImageDragLeave = () => imageDragOver.value = false;

const onImageDrop = async (e) => {
  imageDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.zip')) {
    imageFile.value = file;
    await extractImages(file);
  }
};

const removeImage = () => {
  imageFile.value = null;
  imageMap.value = {};
  matchedImages.value = 0;
  if (imageInput.value) imageInput.value.value = '';
};

const extractImages = async (zipFile) => {
  try {
    const zip = await JSZip.loadAsync(zipFile);
    const newImageMap = {};
    
    const promises = [];
    
    zip.forEach((relativePath, file) => {
      if (!file.dir && /\.(png|jpg|jpeg|gif)$/i.test(relativePath)) {
        const fileName = relativePath.split('/').pop();
        const baseName = fileName.replace(/\.(png|jpg|jpeg|gif)$/i, '');
        const imgType = fileName.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
        
        const promise = file.async('base64').then(base64 => {
          newImageMap[baseName] = `data:image/${imgType};base64,${base64}`;
        });
        
        promises.push(promise);
      }
    });
    
    await Promise.all(promises);
    imageMap.value = newImageMap;
    console.log('解析图片完成，共', Object.keys(newImageMap).length, '张图片');
    matchImages();
  } catch (error) {
    console.error('解析图片失败:', error);
  }
};

const matchImages = () => {
  const dataRows = sourceData.value.length ? sourceData.value : (props.data.cleanedData || []);
  let count = 0;
  dataRows.forEach((item) => {
    const code = item['编号'] || '';
    if (code && imageMap.value[code]) {
      count++;
    }
  });
  matchedImages.value = count;
};

const generateHTML = async () => {
  if (!excelFile.value && !props.data.cleanedData?.length) {
    alert('请上传Excel数据文件或确保前面步骤已生成数据');
    return;
  }

  isProcessing.value = true;
  processingStep.value = '正在生成HTML手册...';

  try {
    let dataRows = sourceData.value.length ? sourceData.value : (props.data.cleanedData || []);
    
    dataRows = [...dataRows].sort((a, b) => {
      const priceA = parseFloat(a['供货价报价'] || a['供货价'] || 0);
      const priceB = parseFloat(b['供货价报价'] || b['供货价'] || 0);
      return priceA - priceB;
    });
    
    console.log('数据条数:', dataRows.length);

    const htmlContent = generateHtmlContent(dataRows, imageMap.value);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    generatedHtmlBlob.value = blob;

    processingStep.value = '生成完成';
    await new Promise(resolve => setTimeout(resolve, 300));

    htmlGenerated.value = true;
  } catch (error) {
    console.error('生成HTML失败:', error);
    alert('生成HTML失败：' + error.message);
  } finally {
    isProcessing.value = false;
  }
};

const downloadHTML = () => {
  if (!generatedHtmlBlob.value) {
    alert('请先生成HTML');
    return;
  }

  const link = document.createElement('a');
  link.href = URL.createObjectURL(generatedHtmlBlob.value);
  link.download = '产品手册.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const previewHTML = () => {
  if (!generatedHtmlBlob.value) {
    alert('请先生成HTML');
    return;
  }

  const url = URL.createObjectURL(generatedHtmlBlob.value);
  window.open(url, '_blank');
};

const handleNext = () => {
  if (htmlGenerated.value) {
    emit('back');
    return;
  }
  if (generatedHtmlBlob.value) {
    downloadHTML();
  }
  emit('update-data', { htmlPath: '产品手册.html' });
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

.upload-label {
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

.match-info {
  margin-top: 10px;
  padding: 8px 14px;
  background: #f0f9eb;
  border-radius: 6px;
  font-size: 13px;
  color: #67c23a;
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
  margin-top: 10px;
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
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

.result-section {
  max-width: 900px;
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

.btn-download,
.btn-preview {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-download {
  background: white;
  color: #667eea;
}

.btn-download:hover {
  background: #f5f5f5;
}

.btn-preview {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid white;
}

.btn-preview:hover {
  background: rgba(255, 255, 255, 0.3);
}

.preview-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.preview-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.preview-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.preview-image-wrapper {
  width: 100%;
  aspect-ratio: 4/3;
  background: #f5f5f5;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}

.preview-info {
  padding: 12px;
}

.preview-info h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.preview-price {
  margin: 0;
  font-size: 13px;
  color: #67c23a;
  font-weight: 500;
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