<template>
  <div class="node-container">
    <div class="node-header">
      <h2>节点6: 生成Excel</h2>
      <p class="description">推品表格输出，保护供应链信息，隐藏成本价</p>
    </div>
    
    <div class="settings-section">
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
        <label class="upload-label">📊 上传原始Excel表格</label>
        <div class="upload-area" @click="triggerExcelInput" @dragover.prevent="onExcelDragOver" @dragleave="onExcelDragLeave" @drop.prevent="onExcelDrop" :class="{ 'drag-over': isExcelDragOver }">
          <input ref="excelInput" type="file" accept=".xlsx,.xls,.csv" @change="onExcelSelect" hidden />
          <div class="upload-icon">📋</div>
          <div class="upload-text">{{ excelFile ? excelFile.name : '点击或拖拽上传Excel表格' }}</div>
          <div class="upload-hint">支持 .xlsx、.xls、.csv 格式</div>
        </div>
        <button v-if="excelFile" class="btn-remove" @click="removeExcel">× 移除文件</button>
      </div>
      
      <div v-if="rawData.length > 0" class="preview-section">
        <div class="preview-header">
          <h4>📋 表格预览（前3行）</h4>
          <span class="preview-count">共 {{ rawData.length }} 条数据</span>
        </div>
        <div class="preview-table-wrapper">
          <table class="preview-table">
            <thead>
              <tr>
                <th v-for="header in tableHeaders" :key="header">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in previewRows" :key="index">
                <td v-for="header in tableHeaders" :key="header">{{ formatCell(row[header]) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="setting-item">
        <label class="setting-label">
          <input type="checkbox" v-model="includeImages" />
          <span>包含产品图片</span>
        </label>
      </div>
      
      <div class="upload-item" v-if="includeImages">
        <label class="upload-label">🖼️ 产品图片压缩包</label>
        <div class="upload-area" @click="triggerImageInput" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop" :class="{ 'drag-over': isDragOver }">
          <input ref="imageInput" type="file" accept=".zip" @change="onImageSelect" hidden />
          <div class="upload-icon">📦</div>
          <div class="upload-text">{{ imageFile ? imageFile.name : '点击或拖拽上传图片压缩包' }}</div>
          <div class="upload-hint">支持 .zip 格式，图片将按编号匹配到对应产品</div>
        </div>
        <button v-if="imageFile" class="btn-remove" @click="removeImage">× 移除文件</button>
        <div v-if="isImageProcessing" class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${(imageProgress / totalImages) * 100}%` }"></div>
          </div>
          <div class="progress-text">正在解析图片: {{ imageProgress }} / {{ totalImages }}</div>
        </div>
        <div v-if="matchedImages > 0" class="match-info">
          ✅ 已匹配 {{ matchedImages }} 张图片
        </div>
        <div class="hint-box">
          💡 温馨提示：图片将按产品编号匹配并自动嵌入Excel表格的E列。支持文件名格式：SSP20260408094.png 或 1.jpg（第1行）
        </div>
      </div>
    </div>
    
    <div v-if="!isProcessing && !excelGenerated" class="start-section">
      <button class="btn-start" @click="generateExcel">
        📊 生成推品Excel表格
      </button>
    </div>
    
    <div v-else-if="isProcessing" class="processing-section">
      <div class="processing-spinner">
        <div class="spinner"></div>
        <p>正在生成Excel...</p>
        <div class="progress-text">{{ processingStep }}</div>
      </div>
    </div>
    
    <div v-else class="result-section">
      <div class="result-card">
        <div class="result-icon">📊</div>
        <div class="result-info">
          <h3>Excel生成成功！</h3>
          <p>已生成 {{ rawData.length }} 条产品数据</p>
          <p v-if="includeImages && matchedImages > 0">已匹配 {{ matchedImages }} 张产品图片</p>
        </div>
        <div class="btn-group">
          <button class="btn-download" @click="downloadExcel">
            📥 下载Excel
          </button>
          <button class="btn-download btn-download-pdf" @click="downloadPDF">
            📄 下载PDF
          </button>
          <button v-if="includeImages && matchedImages > 0" class="btn-download btn-download-images" @click="downloadImages">
            🖼️ 下载图片包
          </button>
        </div>
      </div>
      
      <div class="preview-section">
        <div class="preview-header">
          <h4>📋 推品表格预览（前3行）</h4>
          <span class="preview-count">共 {{ rawData.length }} 条数据</span>
        </div>
        <div class="preview-table-wrapper">
          <table class="preview-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>名称</th>
                <th>产品参数</th>
                <th>卖点简述</th>
                <th>图片</th>
                <th>市场价</th>
                <th>供货价（集采价）</th>
                <th>一件代发报价</th>
                <th>备注</th>
                <th>京东/天猫链接</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in generatedPreviewRows" :key="index">
                <td>{{ row['编号'] || '-' }}</td>
                <td>{{ formatCell(row['名称']) }}</td>
                <td>{{ formatCell(row['产品参数']) }}</td>
                <td>{{ formatCell(row['一句话卖点']) }}</td>
                <td>
                  <img v-if="row['图片']" :src="row['图片']" class="preview-image" alt="产品图片" />
                  <span v-else>-</span>
                </td>
                <td>{{ row['市场价'] || '-' }}</td>
                <td>{{ row['供货价报价'] || '-' }}</td>
                <td>{{ row['一件代发报价'] || '-' }}</td>
                <td>-</td>
                <td>{{ formatCell(row['京东/天猫链接']) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="field-info">
        <h4>输出字段说明（共10列）</h4>
        <div class="field-list">
          <div class="field-item">A: 编号</div>
          <div class="field-item">B: 名称</div>
          <div class="field-item">C: 产品参数</div>
          <div class="field-item">D: 卖点简述</div>
          <div class="field-item">E: 图片</div>
          <div class="field-item">F: 市场价</div>
          <div class="field-item">G: 供货价（集采价，30套起订）</div>
          <div class="field-item">H: 一件代发报价</div>
          <div class="field-item">I: 备注</div>
          <div class="field-item">J: 京东/天猫链接</div>
        </div>
      </div>
      
      <div class="image-matching-info" v-if="includeImages">
        <h4>图片匹配规则</h4>
        <div class="priority-list">
          <div class="priority-item">
            <span class="priority-number">1</span>
            <div class="priority-content">
              <span class="priority-title">按编号匹配（优先）</span>
              <span class="priority-desc">文件名格式: {编号}.png / {编号}-1.jpg</span>
            </div>
          </div>
          <div class="priority-item">
            <span class="priority-number">2</span>
            <div class="priority-content">
              <span class="priority-title">按行号匹配（备选）</span>
              <span class="priority-desc">文件名格式: 1.png、2.jpg 表示第1行、第2行产品</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="unmatchedCodes.length > 0" class="unmatched-section">
        <h4>⚠️ 未匹配到图片的商品编号（{{ unmatchedCodes.length }}个）</h4>
        <div class="unmatched-list">
          <span v-for="code in unmatchedCodes" :key="code" class="unmatched-code">{{ code }}</span>
        </div>
        <p class="unmatched-hint">提示：请检查这些商品编号是否在图片压缩包中存在对应图片文件</p>
      </div>
      
      <div class="hidden-fields">
        <h4>已隐藏字段（客户不可见）</h4>
        <ul>
          <li>供应商名称 - 保护供应链信息</li>
          <li>供货价（原成本价）- 成本价不给客户看</li>
          <li>一件代发成本价 - 成本价不给客户看</li>
        </ul>
      </div>
    </div>
    
    <div class="action-bar">
      <button class="btn-back" @click="$emit('back')">← 返回</button>
      <button class="btn-skip-node" @click="$emit('skip')">跳过此步骤 →</button>
      <button class="btn-next" @click="handleNext">继续生成PPT →</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

const props = defineProps(['data']);
const emit = defineEmits(['complete', 'back', 'skip', 'update-data']);

const excelInput = ref(null);
const imageInput = ref(null);
const excelFile = ref(null);
const imageFile = ref(null);
const isExcelDragOver = ref(false);
const isDragOver = ref(false);
const isProcessing = ref(false);
const processingStep = ref('');
const excelGenerated = ref(false);
const includeImages = ref(true);
const matchedImages = ref(0);
const imageMap = ref({});
const imageFileNameMap = ref({});
const rawData = ref([]);
const isImageProcessing = ref(false);

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
const imageProgress = ref(0);
const totalImages = ref(0);
const unmatchedCodes = ref([]);

const cleanedDataCount = computed(() => props.data.cleanedData?.length || 0);

const tableHeaders = computed(() => {
  if (rawData.value.length === 0) return [];
  const firstRow = rawData.value[0];
  return Object.keys(firstRow);
});

const previewRows = computed(() => {
  return rawData.value.slice(0, 3);
});

const formatCell = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  const str = String(value);
  return str.length > 30 ? str.substring(0, 30) + '...' : str;
};

const generatedPreviewRows = computed(() => {
  return rawData.value.slice(0, 3).map((row, index) => {
    const 编号 = row['编号'] || '';
    let imagePath = '';
    
    if (includeImages.value) {
      if (imageMap.value[编号]) {
        imagePath = imageMap.value[编号];
      } else if (imageMap.value[`row_${index + 1}`]) {
        imagePath = imageMap.value[`row_${index + 1}`];
      }
    }
    
    const 供货价报价 = row['供货价报价'];
    const 一件代发报价 = row['一件代发报价'];
    
    return {
      '编号': 编号,
      '名称': row['名称'],
      '产品参数': row['产品参数'],
      '一句话卖点': row['一句话卖点'],
      '图片': imagePath || '',
      '市场价': row['市场价'],
      '供货价报价': 供货价报价 ? Math.round(parseFloat(供货价报价)) : '',
      '一件代发报价': 一件代发报价 ? Math.round(parseFloat(一件代发报价)) : '',
      '京东/天猫链接': row['京东/天猫链接']
    };
  });
});

const triggerExcelInput = () => excelInput.value?.click();
const triggerImageInput = () => imageInput.value?.click();

const onExcelSelect = async (e) => {
  const file = e.target.files[0];
  if (file) {
    excelFile.value = file;
    await parseExcel(file);
  }
};

const onExcelDragOver = () => isExcelDragOver.value = true;
const onExcelDragLeave = () => isExcelDragOver.value = false;

const onExcelDrop = async (e) => {
  isExcelDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
    excelFile.value = file;
    await parseExcel(file);
  }
};

const removeExcel = () => {
  excelFile.value = null;
  rawData.value = [];
  if (excelInput.value) excelInput.value.value = '';
};

const parseExcel = async (file) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
    if (jsonData.length > 0) {
      const headers = jsonData[0];
      const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));
      
      rawData.value = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
    }
  } catch (error) {
    console.error('解析Excel失败:', error);
    rawData.value = [];
  }
};

const onImageSelect = async (e) => {
  const file = e.target.files[0];
  if (file) {
    imageFile.value = file;
    await extractImages(file);
  }
};

const onDragOver = () => isDragOver.value = true;
const onDragLeave = () => isDragOver.value = false;

const onDrop = async (e) => {
  isDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.zip')) {
    imageFile.value = file;
    await extractImages(file);
  }
};

const removeImage = () => {
  imageFile.value = null;
  matchedImages.value = 0;
  imageMap.value = {};
  imageFileNameMap.value = {};
  if (imageInput.value) imageInput.value.value = '';
};

const extractImages = async (zipFile) => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(zipFile);
    const images = {};
    const imageData = {};
    const fileNameMap = {};
    let matchCount = 0;
    
    isImageProcessing.value = true;
    imageProgress.value = 0;
    
    console.log('=== 开始解析图片压缩包 ===');
    console.log('文件名:', zipFile.name);
    
    const imageFiles = [];
    zip.forEach((relativePath, file) => {
      if (!file.dir && /\.(png|jpg|jpeg|gif)$/i.test(relativePath)) {
        const fileName = relativePath.split('/').pop();
        
        if (fileName.startsWith('._')) {
          console.log(`跳过隐藏文件: ${fileName}`);
          return;
        }
        
        const baseName = fileName.replace(/\.(png|jpg|jpeg|gif)$/i, '');
        const imgType = fileName.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
        
        console.log(`发现图片: ${fileName} -> baseName: ${baseName}, type: ${imgType}`);
        imageFiles.push({ file, fileName, baseName, imgType });
      }
    });
    
    totalImages.value = imageFiles.length;
    console.log(`共发现 ${imageFiles.length} 张图片`);
    
    for (const item of imageFiles) {
      images[item.baseName] = item.fileName;
      images[item.fileName] = item.fileName;
      fileNameMap[item.baseName] = item.fileName;
      fileNameMap[item.fileName] = item.fileName;
      
      if (/^\d+$/.test(item.baseName)) {
        images[`row_${item.baseName}`] = item.fileName;
        fileNameMap[`row_${item.baseName}`] = item.fileName;
      }
      
      const b64 = await item.file.async('base64');
      const base64Str = `data:image/${item.imgType};base64,${b64}`;
      imageData[item.baseName] = base64Str;
      imageData[item.fileName] = base64Str;
      if (/^\d+$/.test(item.baseName)) {
        imageData[`row_${item.baseName}`] = base64Str;
      }
      
      imageProgress.value++;
    }
    
    imageMap.value = imageData;
    imageFileNameMap.value = fileNameMap;
    isImageProcessing.value = false;
    
    console.log('=== 图片解析完成 ===');
    console.log('imageMap 包含的键:', Object.keys(imageData).slice(0, 5), '...');
    
    const cleanedData = props.data.cleanedData || [];
    console.log('待匹配的数据条数:', cleanedData.length);
    
    cleanedData.forEach((item, index) => {
      const 编号 = item['编号'] || '';
      if (编号 && images[编号]) {
        matchCount++;
        console.log(`匹配成功: ${编号}`);
      }
      if (images[`row_${index + 1}`]) {
        matchCount++;
      }
    });
    
    matchedImages.value = matchCount;
    console.log(`总共匹配 ${matchCount} 张图片`);
  } catch (error) {
    console.error('解压图片失败:', error);
    isImageProcessing.value = false;
    matchedImages.value = 0;
  }
};

const generateExcel = async () => {
  if (!excelFile.value) {
    alert('请先上传Excel表格');
    return;
  }
  
  isProcessing.value = true;
  
  const steps = [
    '正在读取上传的Excel数据...',
    includeImages.value ? '正在匹配产品图片...' : '跳过图片匹配...',
    '生成完成'
  ];
  
  for (const step of steps) {
    processingStep.value = step;
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  
  excelGenerated.value = true;
  isProcessing.value = false;
};

const downloadExcel = async () => {
    console.log('downloadExcel called');
    console.log('rawData.length:', rawData.value.length);
    console.log('includeImages:', includeImages.value);
    console.log('imageMap size:', Object.keys(imageMap.value).length);
    console.log('ExcelJS version:', ExcelJS.version);
    
    try {
      const headers = ['编号', '名称', '产品参数', '卖点简述', '图片', '市场价', '供货价（集采价，30套起订）', '一件代发报价', '备注', '京东/天猫链接'];
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('推品表格');
      
      worksheet.columns = [
        { header: '编号', width: 12 },
        { header: '名称', width: 25 },
        { header: '产品参数', width: 30 },
        { header: '卖点简述', width: 30 },
        { header: '图片', width: 10 },
        { header: '市场价', width: 10 },
        { header: '供货价（集采价，30套起订）', width: 18 },
        { header: '一件代发报价', width: 12 },
        { header: '备注', width: 10 },
        { header: '京东/天猫链接', width: 25 }
      ];
      
      const headerRow = worksheet.getRow(1);
      headerRow.height = 20;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle',
          wrapText: true
        };
      });
      
      const sortedData = [...rawData.value].sort((a, b) => {
        const priceA = parseFloat(a['供货价报价'] || a['供货价'] || 0);
        const priceB = parseFloat(b['供货价报价'] || b['供货价'] || 0);
        return priceA - priceB;
      });
      
      const IMAGE_HEIGHT = 120;
      let imageId = 1;
      unmatchedCodes.value = [];
      let matchedCount = 0;
      
      for (let dataIndex = 0; dataIndex < sortedData.length; dataIndex++) {
        const row = sortedData[dataIndex];
        const 编号 = row['编号'] || '';
        const rowIndex = dataIndex + 2;
        
        let imageData = null;
        
        if (includeImages.value) {
          if (imageMap.value[编号]) {
            imageData = imageMap.value[编号];
            console.log(`第${rowIndex}行: 按编号匹配成功 - ${编号}`);
          } else if (imageMap.value[`row_${dataIndex + 1}`]) {
            imageData = imageMap.value[`row_${dataIndex + 1}`];
            console.log(`第${rowIndex}行: 按行号匹配成功 - row_${dataIndex + 1}`);
          } else {
            const imageKeys = Object.keys(imageMap.value);
            const matchedKey = imageKeys.find(key => key.includes(编号) || 编号.includes(key));
            if (matchedKey) {
              imageData = imageMap.value[matchedKey];
              console.log(`第${rowIndex}行: 模糊匹配成功 - ${编号} -> ${matchedKey}`);
            } else {
              console.log(`第${rowIndex}行: 未找到匹配图片，编号: ${编号}`);
              if (编号 && !unmatchedCodes.value.includes(编号)) {
                unmatchedCodes.value.push(编号);
              }
            }
          }
        }
        
        const 供货价 = row['供货价'] || row['供应商报价1#'] || row['供应商报价1'] || '';
        const 一件代发成本价 = row['一件代发成本价'] || row['供货价（一件代发）'] || '';
        const 市场价 = row['市场价'] || '';
        
        const formulaValues = {
          supplierCost: parseFloat(供货价) || 0,
          dropshipCost: parseFloat(一件代发成本价) || 0,
          marketPrice: parseFloat(市场价) || 0
        };
        
        const 供货价报价 = evaluateFormula(formulaConfig.value.supplierPrice, formulaValues);
        const 一件代发报价 = evaluateFormula(formulaConfig.value.dropshipPrice, formulaValues);
        
        const 产品参数 = (row['产品参数'] || '').replace(/[\r\n]+/g, '｜');
        const 卖点简述 = (row['一句话卖点'] || '').replace(/[\r\n]+/g, '｜');
        
        const dataRow = worksheet.getRow(rowIndex);
        
        dataRow.values = [
          编号,
          row['名称'] || '',
          产品参数,
          卖点简述,
          '',
          row['市场价'] || '',
          供货价报价,
          一件代发报价,
          '',
          row['京东/天猫链接'] || ''
        ];
        
        dataRow.height = IMAGE_HEIGHT;
        dataRow.eachCell((cell) => {
          cell.font = { bold: false };
          cell.alignment = { 
            horizontal: 'center', 
            vertical: 'middle',
            wrapText: true
          };
        });
        
        if (imageData) {
          try {
            console.log(`尝试嵌入图片到第${rowIndex}行...`);
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imageData;
            });
            
            const MAX_HEIGHT = 80;
            let scaledWidth = img.width;
            let scaledHeight = img.height;
            
            if (img.height > MAX_HEIGHT) {
              const scale = MAX_HEIGHT / img.height;
              scaledHeight = MAX_HEIGHT;
              scaledWidth = img.width * scale;
            }
            
            const imgExt = imageData.includes('image/png') ? 'png' : 'jpeg';
            const base64Data = imageData.split(',')[1];
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const uint8Array = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              uint8Array[i] = binaryString.charCodeAt(i);
            }
            
            const excelImage = workbook.addImage({
              buffer: uint8Array,
              extension: imgExt
            });
            
            worksheet.addImage(excelImage, {
              tl: { col: 4, row: rowIndex - 1 },
              ext: { width: scaledWidth, height: scaledHeight }
            });
            
            matchedCount++;
            console.log(`图片 ${imageId++} 已成功嵌入第 ${rowIndex} 行, 原图: ${img.width}x${img.height}, 缩放后: ${scaledWidth}x${scaledHeight}`);
          } catch (e) {
            console.error(`嵌入图片失败: ${e.message}`, e);
          }
        }
      }
      
      console.log(`Excel生成完成: ${matchedCount} 张图片匹配成功，${unmatchedCodes.value.length} 个编号未匹配`);
      if (unmatchedCodes.value.length > 0) {
        console.log('未匹配的编号:', unmatchedCodes.value);
      }
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = '推品表格.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('download triggered');
    } catch (error) {
      console.error('Error in downloadExcel:', error);
      alert('下载失败: ' + error.message);
    }
  };

const downloadImages = async () => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const processedImages = new Set();
    
    for (const row of rawData.value) {
      const 编号 = row['编号'] || '';
      if (编号 && imageMap.value[编号] && imageFileNameMap.value[编号] && !processedImages.has(编号)) {
        const base64Data = imageMap.value[编号];
        const fileName = imageFileNameMap.value[编号];
        const base64Content = base64Data.split(',')[1];
        zip.file(fileName, base64Content, { base64: true });
        processedImages.add(编号);
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = '产品图片包.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载图片包失败:', error);
    alert('下载图片包失败: ' + error.message);
  }
};

const downloadPDF = async () => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    
    // 创建一个隐藏的div用于渲染PDF内容
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.top = '0';
    pdfContainer.style.width = '794px'; // A4宽度
    pdfContainer.style.background = 'white';
    pdfContainer.style.padding = '30px';
    pdfContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    // 标题
    pdfContainer.innerHTML = `
      <h1 style="text-align: center; margin: 0 0 10px 0; font-size: 24px; color: #303133;">产品列表</h1>
      <p style="text-align: center; margin: 0 0 30px 0; font-size: 14px; color: #606266;">共 ${rawData.value.length} 条产品数据</p>
    `;
    
    // 产品卡片
    for (let i = 0; i < rawData.value.length; i++) {
      const row = rawData.value[i];
      const 编号 = row['编号'] || '';
      const 名称 = row['名称'] || '';
      const 卖点简述 = row['一句话卖点'] || '';
      const 产品参数 = row['产品参数'] || '';
      const 供货价报价 = row['供货价报价'];
      const 一件代发报价 = row['一件代发报价'];
      const 京东链接 = row['京东/天猫链接'] || '';
      
      const productCard = document.createElement('div');
      productCard.style.cssText = `
        display: flex;
        gap: 20px;
        padding: 15px;
        margin-bottom: 15px;
        background: #f5f7fa;
        border-radius: 8px;
        border: 1px solid #e4e7ed;
      `;
      
      // 图片部分
      const imageDiv = document.createElement('div');
      imageDiv.style.cssText = 'flex-shrink: 0;';
      
      if (includeImages.value && imageMap.value[编号]) {
        const img = document.createElement('img');
        img.src = imageMap.value[编号];
        img.style.cssText = 'width: 120px; height: 90px; object-fit: cover; border-radius: 6px;';
        imageDiv.appendChild(img);
      } else {
        const noImg = document.createElement('div');
        noImg.style.cssText = 'width: 120px; height: 90px; background: #e4e7ed; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #909399; font-size: 12px;';
        noImg.textContent = '暂无图片';
        imageDiv.appendChild(noImg);
      }
      
      productCard.appendChild(imageDiv);
      
      // 文字信息部分
      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = 'flex: 1; min-width: 0;';
      
      infoDiv.innerHTML = `
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #303133;">${名称}</h3>
        <p style="margin: 0 0 5px 0; font-size: 13px; color: #409eff;">编号: ${编号}</p>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #606266; line-height: 1.5;">${卖点简述}</p>
        ${产品参数 ? `<p style="margin: 0 0 5px 0; font-size: 12px; color: #909399;">参数: ${产品参数.substring(0, 50)}${产品参数.length > 50 ? '...' : ''}</p>` : ''}
        <div style="display: flex; gap: 20px; margin-top: 8px;">
          ${供货价报价 ? `<span style="font-size: 13px; color: #67c23a; font-weight: bold;">供货价: ¥${Math.round(parseFloat(供货价报价))}</span>` : ''}
          ${一件代发报价 ? `<span style="font-size: 13px; color: #409eff; font-weight: bold;">一件代发价: ¥${Math.round(parseFloat(一件代发报价))}</span>` : ''}
        </div>
      `;
      
      productCard.appendChild(infoDiv);
      pdfContainer.appendChild(productCard);
    }
    
    document.body.appendChild(pdfContainer);
    
    // 等待图片加载
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 使用html2canvas截图
    const canvas = await html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    // 移除临时div
    document.body.removeChild(pdfContainer);
    
    // 创建PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // 如果内容超过一页，添加新页面
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save('产品列表.pdf');
  } catch (error) {
    console.error('生成PDF失败:', error);
    alert('生成PDF失败: ' + error.message);
  }
};

const handleNext = () => {
  emit('update-data', { 
    excelPath: '推品表格.xlsx',
    matchedImages: matchedImages.value 
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

.settings-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.setting-item {
  margin-bottom: 12px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.setting-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.upload-item {
  margin-top: 20px;
  text-align: left;
}

.upload-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 10px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
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
  font-size: 32px;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 14px;
  color: #303133;
  margin-bottom: 6px;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.preview-section {
  margin-top: 20px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-header h4 {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

.preview-count {
  font-size: 12px;
  color: #909399;
}

.preview-table-wrapper {
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 500;
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #e4e7ed;
  white-space: nowrap;
}

.preview-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  color: #303133;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-table tr:hover td {
  background: #fafafa;
}

.preview-image {
  max-width: 80px;
  max-height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.btn-remove {
  margin-top: 10px;
  padding: 6px 14px;
  background: #f56c6c;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: #f04040;
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

.hint-box {
  margin-top: 12px;
  padding: 12px 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  font-size: 13px;
  color: #fa8c16;
  line-height: 1.6;
}

.start-section {
  text-align: center;
  padding: 40px;
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

.result-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: #f0f9eb;
  border-radius: 12px;
  margin-bottom: 24px;
}

.result-icon {
  font-size: 48px;
}

.result-info {
  flex: 1;
}

.result-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #67c23a;
}

.result-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.btn-download {
  padding: 12px 24px;
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

.btn-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-download-images {
  background: #409eff;
}

.btn-download-images:hover {
  background: #337ecc;
}

.btn-download-pdf {
  background: #f56c6c;
}

.btn-download-pdf:hover {
  background: #e65c5c;
}

.field-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.field-info h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #606266;
}

.field-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.field-item {
  font-size: 13px;
  color: #303133;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
}

.image-matching-info {
  padding: 20px;
  background: #f0f5ff;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  margin-bottom: 24px;
}

.image-matching-info h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #409eff;
}

.priority-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.priority-item {
  display: flex;
  gap: 12px;
}

.priority-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.priority-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.priority-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.priority-desc {
  font-size: 12px;
  color: #909399;
}

.hidden-fields {
  padding: 20px;
  background: #fff7e6;
  border-radius: 8px;
  border-left: 4px solid #e6a23c;
}

.hidden-fields h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #e6a23c;
}

.hidden-fields ul {
  margin: 0;
  padding-left: 20px;
}

.hidden-fields li {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
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
