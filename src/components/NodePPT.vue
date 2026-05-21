<template>
  <div class="node-container">
    <div class="node-header">
      <h2>7️⃣ 生成PPT展示文件</h2>
      <p class="description">上传占位符模板和数据，生成产品PPT</p>
    </div>

    <div v-if="!isProcessing && !pptGenerated" class="upload-section">
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
        </div>
      </div>
      
      <div class="upload-item">
        <label class="upload-label">📄 PPT占位符模板</label>
        <div class="template-selection">
          <div 
            class="template-option"
            :class="{ active: !templateFile }"
            @click="useDefaultTemplate"
          >
            <div class="template-icon">📄</div>
            <div class="template-info">
              <div class="template-name">默认模板</div>
              <div class="template-desc">模板2#_占位符版.pptx</div>
            </div>
            <div class="template-status" v-if="!templateFile && templateZip">✓ 已加载</div>
          </div>
          <div class="template-divider"></div>
          <div 
            class="template-option"
            :class="{ active: templateFile !== null }"
            @click="triggerTemplateInput"
            @dragover.prevent="onTemplateDragOver"
            @dragleave="onTemplateDragLeave"
            @drop.prevent="onTemplateDrop"
          >
            <div class="template-icon">⬆️</div>
            <div class="template-info">
              <div class="template-name">{{ templateFile ? templateFile.name : '上传自定义模板' }}</div>
              <div class="template-desc">点击或拖拽上传</div>
            </div>
          </div>
        </div>
        <input ref="templateInput" type="file" accept=".pptx" @change="onTemplateSelect" hidden />
        <button v-if="templateFile" class="btn-remove" @click="removeTemplate">× 移除自定义模板</button>
      </div>

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
          <div class="upload-icon">�</div>
          <div class="upload-text">{{ imageFile ? imageFile.name : '点击或拖拽上传图片压缩包' }}</div>
          <div class="upload-hint">支持 .zip 格式，图片文件名需包含产品编号（如 SSP20260408094.png）</div>
        </div>
        <button v-if="imageFile" class="btn-remove" @click="removeImage">× 移除文件</button>
        <div v-if="matchedImages > 0" class="match-info">
          ✅ 已匹配 {{ matchedImages }} 张图片
        </div>
        <div v-if="isImageProcessing" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${(imageProgress / totalImages) * 100}%` }"></div>
          </div>
          <div class="progress-text">正在解析图片: {{ imageProgress }} / {{ totalImages }}</div>
        </div>
        <div v-if="imageRawDataCount > 0" class="match-info">
          📦 已加载 {{ imageRawDataCount }} 张图片数据
        </div>
      </div>

      <div class="checkbox-item">
        <label class="checkbox-label">
          <input type="checkbox" v-model="includeImages" />
          <span class="checkbox-text">将图片嵌入PPT（按编号匹配）</span>
        </label>
      </div>

      <div class="hint-box">
        💡 温馨提示：本工具会读取占位符模板，替换占位符后生成PPT文件。每条数据生成一页PPT。
      </div>

      <button class="btn-start" @click="generatePPT">
        📄 生成PPT展示文件
      </button>
    </div>

    <div v-else-if="isProcessing" class="processing-section">
      <div class="processing-spinner">
        <div class="spinner"></div>
        <p>{{ processingStep }}</p>
        <div v-if="totalSlides > 0" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${(pptProgress / totalSlides) * 100}%` }"></div>
          </div>
          <div class="progress-text">进度: {{ pptProgress }} / {{ totalSlides }}</div>
        </div>
      </div>
    </div>

    <div v-else class="result-section">
      <div class="result-card">
        <div class="result-icon">📄</div>
        <div class="result-info">
          <h3>PPT生成成功！</h3>
          <p>已生成 {{ data.length }} 页产品展示</p>
          <p v-if="matchedImages > 0">✅ 成功匹配 {{ matchedImages }} 张图片</p>
          <p v-if="debugInfo">{{ debugInfo }}</p>
        </div>
        <button class="btn-download" @click="downloadPPT">
          📥 下载PPT
        </button>
      </div>
      
      <div v-if="unmatchedCodes.length > 0" class="unmatched-section">
        <h4>⚠️ 未匹配到图片的商品编号（{{ unmatchedCodes.length }}个）</h4>
        <div class="unmatched-list">
          <span v-for="code in unmatchedCodes" :key="code" class="unmatched-code">{{ code }}</span>
        </div>
        <p class="unmatched-hint">提示：请检查这些商品编号是否在图片压缩包中存在对应图片文件</p>
      </div>
    </div>

    <div class="action-bar">
      <button v-if="!pptGenerated" class="btn-back" @click="$emit('back')">← 返回</button>
      <button v-if="!pptGenerated" class="btn-skip-node" @click="$emit('skip')">跳过此步骤 →</button>
      <button class="btn-next" @click="handleNext">{{ pptGenerated ? '已完成，重新开始' : '完成并下载 →'}}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const props = defineProps(['data']);
const emit = defineEmits(['complete', 'back', 'skip', 'update-data']);

let globalImageRawData = {};
let globalImageMap = {};

const templateInput = ref(null);
const excelInput = ref(null);
const imageInput = ref(null);
const templateFile = ref(null);
const excelFile = ref(null);
const imageFile = ref(null);
const templateDragOver = ref(false);
const excelDragOver = ref(false);
const imageDragOver = ref(false);
const isProcessing = ref(false);
const processingStep = ref('');
const pptGenerated = ref(false);
const sourceData = ref([]);
const imageMap = ref({});
const imageRawData = ref({});
const templateZip = ref(null);
const generatedPptBlob = ref(null);
const debugInfo = ref('');
const allData = ref([]);
const includeImages = ref(false);
const matchedImages = ref(0);
const isImageProcessing = ref(false);
const imageProcessingPromise = ref(null);
const isImagesReady = ref(false);
const imageProgress = ref(0);
const totalImages = ref(0);
const pptProgress = ref(0);
const totalSlides = ref(0);
const unmatchedCodes = ref([]);

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

const data = computed(() => sourceData.value.length ? sourceData.value : (props.data.cleanedData || []));

const previewData = computed(() => {
  return data.value.length ? data.value[0] : null;
});

const imageRawDataCount = computed(() => {
  return Object.keys(imageRawData.value || {}).length;
});

const previewImage = computed(() => {
  if (!previewData.value) return '';
  const code = previewData.value['编号'];
  if (code && imageMap.value[code]) {
    return imageMap.value[code];
  }
  return '';
});

const formatParams = (params) => {
  if (!params) return '';
  const str = String(params);
  if (str.length > 80) {
    return str.substring(0, 80) + '...';
  }
  return str;
};

const triggerTemplateInput = () => templateInput.value?.click();
const triggerExcelInput = () => excelInput.value?.click();

const loadTemplateFromFile = async (file, isDefault = false) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    templateZip.value = await JSZip.loadAsync(arrayBuffer);
    
    const files = Object.keys(templateZip.value.files);
    console.log(isDefault ? '默认模板' : '自定义模板', '加载成功！总文件数:', files.length);
  } catch (error) {
    console.error('加载模板失败:', error);
    throw error;
  }
};

const loadDefaultTemplate = async () => {
  try {
    const response = await fetch('/default-template.pptx');
    if (!response.ok) {
      throw new Error('无法加载默认模板');
    }
    const blob = await response.blob();
    await loadTemplateFromFile(blob, true);
  } catch (error) {
    console.error('加载默认模板失败:', error);
  }
};

const onTemplateSelect = async (e) => {
  const file = e.target.files[0];
  if (file) {
    templateFile.value = file;
    await loadTemplateFromFile(file, false);
  }
};

const loadTemplate = async (file) => {
  await loadTemplateFromFile(file, false);
};

const useDefaultTemplate = () => {
  templateFile.value = null;
  if (!templateZip.value) {
    loadDefaultTemplate();
  }
};

const onTemplateDragOver = () => templateDragOver.value = true;
const onTemplateDragLeave = () => templateDragOver.value = false;

const onTemplateDrop = async (e) => {
  templateDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.pptx')) {
    templateFile.value = file;
    await loadTemplateFromFile(file, false);
  }
};

const removeTemplate = () => {
  templateFile.value = null;
  // 不清除templateZip，保持使用默认模板
  generatedPptBlob.value = null;
  debugInfo.value = '';
  if (templateInput.value) templateInput.value.value = '';
  loadDefaultTemplate();
};

const triggerImageInput = () => imageInput.value?.click();

const onImageSelect = async (e) => {
  const file = e.target.files[0];
  if (file) {
    imageFile.value = file;
    isImageProcessing.value = true;
    isImagesReady.value = false;
    imageProgress.value = 0;
    totalImages.value = 0;
    console.log('开始解析图片压缩包:', file.name);
    await extractImages(file);
    isImageProcessing.value = false;
    console.log('图片解析完成后，imageRawData:', Object.keys(imageRawData.value));
    console.log('imageRawData 对象:', imageRawData.value);
  }
};

const onExcelSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    console.log('上传Excel前的imageRawData:', Object.keys(imageRawData.value));
    excelFile.value = file;
    parseExcel(file);
    console.log('上传Excel后的imageRawData:', Object.keys(imageRawData.value));
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
  imageRawData.value = {};
  matchedImages.value = 0;
  if (imageInput.value) imageInput.value.value = '';
};

const matchImages = () => {
  const dataRows = sourceData.value.length ? sourceData.value : (props.data.cleanedData || []);
  let count = 0;
  dataRows.forEach((item) => {
    const code = item['编号'] || '';
    if (code && imageRawData.value[code]) {
      count++;
    }
  });
  matchedImages.value = count;
};

const extractImages = async (zipFile) => {
  try {
    const zip = await JSZip.loadAsync(zipFile);
    const newImageMap = {};
    const newRawData = {};
    
    const promises = [];
    
    const imageFiles = [];
    zip.forEach((relativePath, file) => {
      if (!file.dir && /\.(png|jpg|jpeg|gif)$/i.test(relativePath)) {
        const fileName = relativePath.split('/').pop();
        
        if (fileName.startsWith('._')) {
          console.log(`跳过隐藏文件: ${fileName}`);
          return;
        }
        
        const baseName = fileName.replace(/\.(png|jpg|jpeg|gif)$/i, '');
        
        const codeMatch = baseName.match(/(SSP\d+)/);
        const productCode = codeMatch ? codeMatch[1] : baseName;
        
        const imgType = fileName.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
        
        imageFiles.push({ file, fileName, productCode, imgType });
      }
    });
    
    totalImages.value = imageFiles.length;
    imageProgress.value = 0;
    
    for (const item of imageFiles) {
      console.log(`发现图片文件: ${item.fileName} -> 产品编号: ${item.productCode}, 类型: ${item.imgType}`);
      
      const base64 = await item.file.async('base64');
      newImageMap[item.productCode] = `data:image/${item.imgType};base64,${base64}`;
      
      const uint8array = await item.file.async('uint8array');
      newRawData[item.productCode] = {
        data: uint8array,
        type: item.imgType
      };
      
      imageProgress.value++;
    }
    
    await Promise.all(promises);
    
    console.log('=== 赋值前 ===');
    console.log('newRawData:', newRawData);
    console.log('newRawData keys:', Object.keys(newRawData));
    
    globalImageMap = newImageMap;
    globalImageRawData = { ...newRawData };
    
    imageMap.value = newImageMap;
    imageRawData.value = { ...newRawData };
    
    console.log('=== 赋值后 ===');
    console.log('globalImageRawData:', globalImageRawData);
    console.log('globalImageRawData keys:', Object.keys(globalImageRawData));
    console.log('imageRawData.value keys:', Object.keys(imageRawData.value));
    
    console.log('解析图片完成，共', Object.keys(newImageMap).length, '张图片');
    isImagesReady.value = true;
    matchImages();
  } catch (error) {
    console.error('解析图片失败:', error);
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
      }
    } catch (error) {
      console.error('解析Excel失败:', error);
      alert('解析Excel文件失败');
    }
  };
  reader.readAsArrayBuffer(file);
};

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const smartReplaceAllPlaceholders = (content, placeholderMap, dataRow, getValue) => {
  let modified = content;
  let totalCount = 0;
  
  for (const [placeholder, field] of Object.entries(placeholderMap)) {
    const value = getValue(dataRow, field);
    if (modified.includes(placeholder)) {
      const escapedPlaceholder = escapeRegex(placeholder);
      const regex = new RegExp(escapedPlaceholder, 'g');
      const matches = modified.match(regex);
      if (matches) {
        const count = matches.length;
        modified = modified.replace(regex, `<a:t>${value}</a:t>`);
        totalCount += count;
      }
    }
  }
  
  for (const [placeholder, field] of Object.entries(placeholderMap)) {
    if (modified.includes(placeholder)) continue;
    
    const placeholderName = placeholder.replace(/[{}]/g, '');
    const escapedPlaceholderName = escapeRegex(placeholderName);
    
    let pattern = new RegExp(`<a:t>\\{\\{<\\/a:t>(?:<[^>]+>)*<a:t>${escapedPlaceholderName}<\\/a:t>(?:<[^>]+>)*<a:t>\\}\\}</a:t>`, 'g');
    
    let matches = modified.match(pattern);
    if (matches) {
      const value = getValue(dataRow, field);
      modified = modified.replace(pattern, `<a:t>${value}</a:t>`);
      totalCount += matches.length;
      continue;
    }
    
    const words = placeholderName.split(/([\\/])/).filter(w => w);
    const wordPatterns = words.map(w => escapeRegex(w));
    const wordPattern = new RegExp(
      `<a:t>\\{\\{<\\/a:t>(?:<[^>]+>)*${wordPatterns.map(w => `<a:t>${w}<\\/a:t>(?:<[^>]+>)*`).join('')}<a:t>\\}\\}</a:t>`,
      'g'
    );
    
    matches = modified.match(wordPattern);
    if (matches) {
      const value = getValue(dataRow, field);
      modified = modified.replace(wordPattern, `<a:t>${value}</a:t>`);
      totalCount += matches.length;
      continue;
    }
    
    const chars = placeholderName.split('');
    const charPatterns = chars.map(c => escapeRegex(c));
    const charPattern = new RegExp(
      `<a:t>\\{\\{<\\/a:t>(?:<[^>]+>)*${charPatterns.map(c => `<a:t>${c}<\\/a:t>(?:<[^>]+>)*`).join('')}<a:t>\\}\\}</a:t>`,
      'g'
    );
    
    matches = modified.match(charPattern);
    if (matches) {
      const value = getValue(dataRow, field);
      modified = modified.replace(charPattern, `<a:t>${value}</a:t>`);
      totalCount += matches.length;
    }
  }
  
  return { content: modified, count: totalCount };
};

const generatePPT = async () => {
  if (!templateZip.value) {
    alert('模板未加载，请重试');
    return;
  }
  if (!excelFile.value && !props.data.cleanedData?.length) {
    alert('请上传Excel数据文件或确保前面步骤已生成数据');
    return;
  }
  
  if (includeImages.value && !isImagesReady.value) {
    alert('图片正在解析中，请稍候...');
    return;
  }

  isProcessing.value = true;
  processingStep.value = '正在处理PPT...';
  debugInfo.value = '';
  pptProgress.value = 0;
  totalSlides.value = 0;
  matchedImages.value = 0;

  try {
    console.log('=== 生成PPT时检查 ===');
    console.log('globalImageRawData keys:', Object.keys(globalImageRawData));
    console.log('includeImages:', includeImages.value);
    
    let dataRows = sourceData.value.length ? sourceData.value : (props.data.cleanedData || []);
    totalSlides.value = dataRows.length;
    
    dataRows = [...dataRows].sort((a, b) => {
      const priceA = parseFloat(a['供货价报价'] || a['供货价'] || 0);
      const priceB = parseFloat(b['供货价报价'] || b['供货价'] || 0);
      return priceA - priceB;
    });
    
    console.log('数据条数:', dataRows.length);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    const placeholderMap = {
      '{{品名}}': '名称',
      '{{编号}}': '编号',
      '{{营销文案}}': '一句话卖点',
      '{{卖点摘要}}': '一句话卖点',
      '{{产品参数}}': '产品参数',
      '{{市场价}}': '市场价',
      '{{供货价}}': '供货价报价',
      '{{一件代发报价}}': '一件代发报价',
      '{{一件代发价}}': '一件代发报价',
      '{{京东/天猫链接}}': '京东/天猫链接',
      '{{备注}}': '备注'
    };

    const getValue = (row, field) => {
      if (!field || !row) return '';
      
      if (field === '供货价报价') {
        const 供货价 = row['供货价'] || row['供应商报价1#'] || row['供应商报价1'] || '';
        const 市场价 = row['市场价'] || '';
        const formulaValues = {
          supplierCost: parseFloat(供货价) || 0,
          dropshipCost: 0,
          marketPrice: parseFloat(市场价) || 0
        };
        const result = evaluateFormula(formulaConfig.value.supplierPrice, formulaValues);
        return result ? String(result) : '';
      }
      
      if (field === '一件代发报价') {
        const 一件代发成本价 = row['一件代发成本价'] || row['供货价（一件代发）'] || '';
        const 市场价 = row['市场价'] || '';
        const formulaValues = {
          supplierCost: 0,
          dropshipCost: parseFloat(一件代发成本价) || 0,
          marketPrice: parseFloat(市场价) || 0
        };
        const result = evaluateFormula(formulaConfig.value.dropshipPrice, formulaValues);
        return result ? String(result) : '';
      }
      
      let value = row[field] || '';
      return String(value);
    };

    const newZip = JSZip();
    let totalPlaceholdersReplaced = 0;
    const files = Object.keys(templateZip.value.files);
    
    console.log('正在复制所有文件（排除第一页）...');
    for (const filePath of files) {
      if (filePath === 'ppt/slides/slide1.xml' || filePath === 'ppt/slides/_rels/slide1.xml.rels') {
        continue;
      }
      const file = templateZip.value.files[filePath];
      if (file.dir) {
        newZip.folder(filePath);
      } else if (filePath.toLowerCase().endsWith('.xml') || filePath.toLowerCase().endsWith('.rels')) {
        const content = await file.async('string');
        newZip.file(filePath, content);
      } else {
        const buffer = await file.async('uint8array');
        newZip.file(filePath, buffer);
      }
    }

    const originalSlideContent = await templateZip.value.file('ppt/slides/slide1.xml')?.async('string');
    const originalSlideRelsContent = await templateZip.value.file('ppt/slides/_rels/slide1.xml.rels')?.async('string');
    const originalPresContent = await templateZip.value.file('ppt/presentation.xml')?.async('string');
    const originalPresRelsContent = await templateZip.value.file('ppt/_rels/presentation.xml.rels')?.async('string');
    
    if (!originalSlideContent) {
      throw new Error('无法读取幻灯片文件');
    }

    let slideId = 314;
    let relId = 10;
    let sldIdLst = '';
    let slideRelEntries = [];

    let matchedImages = 0;
    unmatchedCodes.value = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const dataRow = dataRows[i];
      const result = smartReplaceAllPlaceholders(originalSlideContent, placeholderMap, dataRow, getValue);
      
      const slideNum = i + 1;
      const slideName = `ppt/slides/slide${slideNum}.xml`;
      const slideRelsName = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
      
      let slideRelsContent = originalSlideRelsContent;
      
      const globalKeys = Object.keys(globalImageRawData || {});
        const localKeys = Object.keys(imageRawData.value || {});
        console.log(`幻灯片 ${slideNum}: includeImages=${includeImages.value}`);
        console.log(`幻灯片 ${slideNum}: globalImageRawData.length=${globalKeys.length}`);
        console.log(`幻灯片 ${slideNum}: imageRawData.value.length=${localKeys.length}`);
        console.log(`幻灯片 ${slideNum}: globalKeys=${globalKeys.slice(0, 3)}`);
        
        if (includeImages.value && globalImageRawData && globalKeys.length > 0) {
          const code = dataRow['编号'] || '';
          console.log(`幻灯片 ${slideNum}: 尝试匹配编号 ${code}`);
          
          if (code && globalImageRawData[code]) {
          const imageData = globalImageRawData[code];
          const imageName = `product_${slideNum}.${imageData.type}`;
          
          newZip.file(`ppt/media/${imageName}`, imageData.data);
          console.log(`幻灯片 ${slideNum}: 图片 ${imageName} 已添加到 media`);
          
          const originalMediaRegex = /<Relationship[^>]*Type="[^"]*image[^"]*"[^>]*Target="([^"]+)"/i;
          const match = slideRelsContent.match(originalMediaRegex);
          if (match) {
            const originalTarget = match[1];
            console.log(`幻灯片 ${slideNum}: 原始图片路径: ${originalTarget}`);
            
            slideRelsContent = slideRelsContent.replace(
              /(<Relationship[^>]*Type="[^"]*image[^"]*"[^>]*Target=")[^"]+(")/i,
              `$1../media/${imageName}$2`
            );
            console.log(`幻灯片 ${slideNum}: 图片路径已替换为 ../media/${imageName}`);
          } else {
            console.log(`幻灯片 ${slideNum}: 未找到图片引用，跳过替换`);
          }
          
          matchedImages++;
        } else {
          console.log(`幻灯片 ${slideNum}: 未找到匹配的图片，编号: ${code}`);
          console.log(`可用的图片编号:`, Object.keys(globalImageRawData).slice(0, 5));
          if (code && !unmatchedCodes.value.includes(code)) {
            unmatchedCodes.value.push(code);
          }
        }
      } else {
        if (!includeImages.value) {
          console.log(`幻灯片 ${slideNum}: 未勾选嵌入图片选项`);
        }
        if (!imageRawData.value || Object.keys(imageRawData.value).length === 0) {
          console.log(`幻灯片 ${slideNum}: 没有上传图片数据`);
        }
      }
      
      newZip.file(slideName, result.content);
      newZip.file(slideRelsName, slideRelsContent);
      
      pptProgress.value = slideNum;
      processingStep.value = `正在生成第 ${slideNum}/${totalSlides.value} 页...`;
      
      console.log(`生成幻灯片 ${slideNum}: 替换了 ${result.count} 个占位符`);
      totalPlaceholdersReplaced += result.count;
      
      sldIdLst += `<p:sldId id="${slideId + i}" r:id="rId${relId + i}"/>`;
      slideRelEntries.push(`<Relationship Id="rId${relId + i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${slideNum}.xml"/>`);
    }
    
    console.log(`图片匹配完成: ${matchedImages}/${dataRows.length} 页`);

    let newPresContent = originalPresContent;
    const sldIdLstMatch = newPresContent.match(/<p:sldIdLst>(.*?)<\/p:sldIdLst>/s);
    if (sldIdLstMatch) {
      newPresContent = newPresContent.replace(sldIdLstMatch[0], `<p:sldIdLst>${sldIdLst}</p:sldIdLst>`);
    }
    newZip.file('ppt/presentation.xml', newPresContent);
    console.log('更新了 presentation.xml（替换第一页）');

    let newPresRelsContent = originalPresRelsContent;
    const relationshipsMatch = newPresRelsContent.match(/<Relationships[^>]*>(.*?)<\/Relationships>/s);
    if (relationshipsMatch) {
      const filteredContent = relationshipsMatch[1].replace(/<Relationship[^>]*Target="slides\/slide1\.xml"[^>]*\/>/g, '');
      const newContent = filteredContent + slideRelEntries.join('');
      newPresRelsContent = newPresRelsContent.replace(relationshipsMatch[1], newContent);
    }
    newZip.file('ppt/_rels/presentation.xml.rels', newPresRelsContent);
    console.log('更新了 presentation.xml.rels（移除第一页引用）');

    console.log('替换完成，共替换', totalPlaceholdersReplaced, '个占位符');
    let debugMsg = `生成了 ${dataRows.length} 页PPT，替换了 ${totalPlaceholdersReplaced} 个占位符`;
    if (matchedImages > 0) {
      debugMsg += `，匹配了 ${matchedImages} 张图片`;
    }
    debugInfo.value = debugMsg;

    processingStep.value = '正在生成文件...';
    
    const blob = await newZip.generateAsync({ 
      type: 'blob', 
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      compression: 'DEFLATE'
    });
    
    generatedPptBlob.value = blob;
    debugInfo.value += `，文件大小: ${blob.size} bytes`;

    console.log('PPT生成完成，大小:', blob.size, 'bytes');

    processingStep.value = '生成完成';
    await new Promise(resolve => setTimeout(resolve, 300));

    pptGenerated.value = true;
  } catch (error) {
    console.error('生成PPT失败:', error);
    debugInfo.value = '生成失败: ' + error.message;
    alert('生成PPT失败：' + error.message);
  } finally {
    isProcessing.value = false;
  }
};

const downloadPPT = () => {
  if (!generatedPptBlob.value) {
    alert('请先生成PPT');
    return;
  }

  const link = document.createElement('a');
  link.href = URL.createObjectURL(generatedPptBlob.value);

  let filename = '产品展示PPT.pptx';
  if (templateFile.value) {
    const name = templateFile.value.name;
    if (name.endsWith('.pptx')) {
      filename = name.replace('.pptx', '_生成.pptx');
    } else {
      filename = name + '_生成.pptx';
    }
  }

  link.download = filename;
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
  emit('update-data', { pptPath: '产品展示PPT.pptx' });
  emit('complete');
};

onMounted(() => {
  loadDefaultTemplate();
});
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
  max-width: 700px;
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

.template-selection {
  display: flex;
  align-items: stretch;
  gap: 16px;
}

.template-option {
  flex: 1;
  padding: 20px;
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fafafa;
}

.template-option:hover {
  border-color: #667eea;
  background: #f0f5ff;
}

.template-option.active {
  border: 2px solid #667eea;
  background: #f0f5ff;
}

.template-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.template-info {
  flex: 1;
  min-width: 0;
}

.template-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.template-desc {
  font-size: 12px;
  color: #909399;
}

.template-status {
  font-size: 12px;
  font-weight: 600;
  color: #67c23a;
}

.template-divider {
  width: 2px;
  background: #e4e7ed;
  margin: 20px 0;
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

.hint-box {
  margin-top: 20px;
  padding: 12px 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  font-size: 13px;
  color: #fa8c16;
  line-height: 1.6;
}

.hint-box-image {
  background: #e8f4e8;
  border-color: #b7eb8f;
  color: #67c23a;
}

.btn-start {
  padding: 16px 48px;
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

.checkbox-item {
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  color: #303133;
}

.match-info {
  margin-top: 10px;
  padding: 8px 14px;
  background: #f0f9eb;
  border-radius: 6px;
  font-size: 13px;
  color: #67c23a;
}

.progress-container {
  margin-top: 10px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: 6px;
  font-size: 13px;
  color: #606266;
}

.unmatched-section {
  margin-top: 20px;
  padding: 20px;
  background: #fff7e6;
  border-radius: 8px;
  border: 1px solid #ffe58f;
}

.unmatched-section h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #d48806;
}

.unmatched-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.unmatched-code {
  padding: 4px 10px;
  background: #fff;
  border: 1px solid #ffd666;
  border-radius: 4px;
  font-size: 13px;
  color: #873800;
}

.unmatched-hint {
  margin: 0;
  font-size: 13px;
  color: #9a6b00;
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

.btn-download {
  padding: 12px 24px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-download:hover {
  background: #f5f5f5;
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

.formula-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0 0 6px 0;
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
  gap: 14px;
  margin-bottom: 16px;
}

.formula-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.formula-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  min-width: 110px;
  text-align: right;
}

.formula-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
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
  padding: 10px 14px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-reset-formula:hover {
  background: #e4e7ed;
}

.formula-help {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e4e7ed;
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
  gap: 6px;
}

.field-tag {
  padding: 4px 10px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
}

.op-tag {
  padding: 4px 10px;
  background: #f6ffed;
  color: #52c41a;
  border-radius: 4px;
  font-size: 12px;
}
</style>
