<template>
  <div class="node-container">
    <div class="node-header">
      <h2>节点1: 提取数据</h2>
      <p class="description">上传PPT/PDF/图片文件，AI自动识别提取产品信息</p>
    </div>

    <div v-if="!isProcessing && !extractedData.length && !rawExtractedData.length" class="upload-section">
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

      <div class="additional-section">
        <div class="template-upload">
          <div class="section-header">
            <h3>📊 提取模板</h3>
            <p>请选择使用默认模板或上传自定义模板</p>
          </div>
          
          <div class="template-options">
            <div class="template-option" :class="{ active: !templateFile }">
              <div class="option-radio">
                <input type="radio" name="template-option" id="option-default" :checked="!templateFile" @change="clearTemplate" />
                <label for="option-default"></label>
              </div>
              <div class="option-content">
                <h4>使用默认模板</h4>
                <p>产品信息提取模版 0508.xlsx</p>
                <a href="/产品信息提取模版 0508.xlsx" download class="download-link-small">
                  📥 下载查看
                </a>
              </div>
            </div>
            
            <div class="template-option" :class="{ active: templateFile }">
              <div class="option-radio">
                <input type="radio" name="template-option" id="option-custom" :checked="!!templateFile" />
                <label for="option-custom"></label>
              </div>
              <div class="option-content">
                <h4>上传自定义模板</h4>
                <div v-if="!templateFile" class="upload-box-small">
                  <input
                    type="file"
                    id="template-input"
                    class="file-input"
                    accept=".xlsx,.xls"
                    @change="handleTemplateSelect"
                  />
                  <label for="template-input" class="upload-label-small">
                    <span>📁 选择Excel文件</span>
                  </label>
                </div>
                <div v-else class="selected-file">
                  <span>已选择: {{ templateFile.name }}</span>
                  <button @click="clearTemplate" class="clear-btn">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rules-section">
          <div class="section-header">
            <h3>📝 规则补充说明</h3>
            <p>输入报价政策、折扣规则等补充说明（AI将参考此规则提取数据）</p>
          </div>
          <textarea
            v-model="extractionRules"
            class="rules-textarea"
            placeholder="请输入规则说明，例如：

1. 代发是供应商报价1#+18元，发顺丰
2. 供应商报价1#的折扣基数规则：
   - 若产品资料仅标注【零售价】，折扣以零售价为基数计算
   - 若产品资料标注【线上活动价】，折扣以线上活动价为基数计算
3. 折扣档位（含税）：
   - 黄色：6.5折
   - 绿色：7折
   - 蓝色：7.5折
   - 紫色：8折"
          ></textarea>
        </div>
      </div>

      <button
        class="btn-start"
        :disabled="!uploadedFiles || uploadedFiles.length === 0"
        @click="startExtraction"
      >
        🤖 开始数据提取
      </button>
      
      <div class="info-box">
        <span class="info-icon">💡</span>
        <p>提示：如需自动提取PPT/PDF/图片中的数据，请配置AI API密钥</p>
      </div>

      <div class="api-config">
        <div class="section-header">
          <h3>🔑 AI API配置（可选）</h3>
          <p>配置后可自动提取PPT/PDF/图片中的产品信息</p>
        </div>
        
        <div v-if="!apiKey" class="api-input-section">
          <div class="api-select">
            <label>选择AI服务：</label>
            <select v-model="aiService" class="service-select">
              <option value="doubao">豆包（推荐）</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>
          <div class="api-input">
            <input
              v-model="apiKeyInput"
              type="password"
              class="key-input"
              placeholder="请输入您的API Key"
            />
          </div>
          <button class="btn-save-key" @click="saveApiKey">保存API Key</button>
        </div>
        
        <div v-else class="api-configured">
          <span class="configured-icon">✓</span>
          <span>已配置 {{ aiService === 'doubao' ? '豆包' : 'OpenAI' }} API</span>
          <button class="btn-clear-key" @click="clearApiKey">清除</button>
        </div>
      </div>
    </div>

    <div v-else-if="isProcessing" class="processing-section">
      <div class="processing-spinner">
        <div class="spinner"></div>
        <p>正在处理文件...</p>
        <div class="progress-text">{{ processingStep }}</div>
      </div>
    </div>

    <div v-else-if="rawExtractedData.length > 0 && !showMappingConfirmed" class="mapping-section">
      <div class="mapping-header">
        <h3>📋 数据录入</h3>
        <p class="mapping-desc">请填写或编辑产品数据</p>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rawExtractedData" :key="index">
              <td v-for="col in columns" :key="col.key">
                <input
                  v-model="row[col.key]"
                  class="cell-input"
                  :placeholder="col.placeholder"
                />
              </td>
              <td>
                <button class="btn-add-row" @click="addRowToRaw(index)">+</button>
                <button class="btn-delete" @click="deleteRowFromRaw(index)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="add-row">
        <button class="btn-add" @click="addEmptyRow">+ 添加一行</button>
      </div>

      <div class="action-bar">
        <button class="btn-back" @click="resetExtraction">← 取消</button>
        <button class="btn-confirm" @click="confirmData">确认数据 →</button>
      </div>
    </div>

    <div v-else class="result-section">
      <div class="result-header">
        <h3>提取结果</h3>
        <div class="header-actions">
          <button class="btn-refresh" @click="startExtraction">🔄 重新提取</button>
          <button class="btn-export" @click="exportToExcel" v-if="extractedData.length > 0">📥 导出 Excel</button>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in extractedData" :key="index">
              <td v-for="col in columns" :key="col.key">
                <input
                  v-if="col.editable !== false"
                  v-model="row[col.key]"
                  class="cell-input"
                  :placeholder="col.placeholder"
                />
                <span v-else>{{ row[col.key] }}</span>
              </td>
              <td>
                <button class="btn-edit" @click="editRow(index)">✏️</button>
                <button class="btn-delete" @click="deleteRow(index)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="add-row">
        <button class="btn-add" @click="addRow">+ 添加一行</button>
      </div>

      <div class="validation-info">
        <h4>强制规范提醒</h4>
        <ul>
          <li>尺寸分隔符使用小写 <code>x</code>，如: 42x31x26cm</li>
          <li>配件数量符使用小写 <code>x</code>，如: 茶杯x2</li>
          <li>产品名称格式: <code>名称-型号</code>（短横线连接，无空格）</li>
          <li>备注仅填写报价条件，不写型号/坐标</li>
        </ul>
      </div>
    </div>

    <div class="action-bar" v-if="extractedData.length > 0">
      <button class="btn-back" @click="$emit('back')">← 返回</button>
      <button
        class="btn-next"
        :disabled="!extractedData.length"
        @click="handleNext"
      >
        确认数据并继续 →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx';

const props = defineProps(['data']);
const emit = defineEmits(['complete', 'back', 'update-data']);

const isDragOver = ref(false);
const uploadedFiles = ref([]);
const isProcessing = ref(false);
const processingStep = ref('');
const extractedData = ref([]);
const rawExtractedData = ref([]);
const showMappingConfirmed = ref(false);
const templateFile = ref(null);
const extractionRules = ref('');
const apiKey = ref(localStorage.getItem('aiApiKey') || '');
const apiKeyInput = ref('');
const aiService = ref(localStorage.getItem('aiService') || 'doubao');
const fieldMapping = ref({
  '编号': '',
  '供应商名称': '',
  '产品名称': '',
  '产品参数': '',
  '营销文案': '',
  '市价': '',
  '供应商报价1': '',
  '供应商一件代发报价': '',
  '备注': '',
  '京东天猫链接': ''
});

const columns = [
  { key: '编号', label: '编号', placeholder: '产品编号/SKU' },
  { key: '供应商名称', label: '供应商名称', placeholder: '供应商名称' },
  { key: '产品名称', label: '产品名称', placeholder: '名称-型号' },
  { key: '产品参数', label: '产品参数', placeholder: '尺寸｜材质｜配件x数量' },
  { key: '营销文案', label: '营销文案', placeholder: '意境｜卖点' },
  { key: '市价', label: '市价', placeholder: '纯数字' },
  { key: '供应商报价1', label: '供应商报价1', placeholder: '成本价' },
  { key: '供应商一件代发报价', label: '供应商一件代发报价', placeholder: '代发成本价' },
  { key: '备注', label: '备注', placeholder: '报价条件' },
  { key: '京东天猫链接', label: '京东/天猫链接', placeholder: '完整URL' }
];

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

const availableFields = computed(() => {
  const fields = new Set();
  rawExtractedData.value.forEach(item => {
    Object.keys(item).forEach(key => fields.add(key));
  });
  return Array.from(fields);
});

const applyMappingTemplate = (type) => {
  if (type === '丝巾') {
    fieldMapping.value = {
      '编号': '编号',
      '供应商名称': '供应商名称',
      '产品名称': '产品名称',
      '产品参数': '产品参数',
      '营销文案': '营销文案',
      '市价': '市价',
      '供应商报价1': '供货价',
      '供应商一件代发报价': '',
      '备注': '备注',
      '京东天猫链接': ''
    };
  } else if (type === '礼盒') {
    fieldMapping.value = {
      '编号': '编号',
      '供应商名称': '供应商名称',
      '产品名称': '产品名称',
      '产品参数': '规格参数',
      '营销文案': '营销文案',
      '市价': '零售价',
      '供应商报价1': '供货价',
      '供应商一件代发报价': '',
      '备注': '备注',
      '京东天猫链接': '链接'
    };
  } else {
    fieldMapping.value = {
      '编号': '',
      '供应商名称': '',
      '产品名称': '',
      '产品参数': '',
      '营销文案': '',
      '市价': '',
      '供应商报价1': '',
      '供应商一件代发报价': '',
      '备注': '',
      '京东天猫链接': ''
    };
  }
};

const confirmMapping = () => {
  let index = 1;
  const mappedData = rawExtractedData.value.map(item => {
    const newItem = {};
    columns.forEach(col => {
      const sourceField = fieldMapping.value[col.key];
      newItem[col.key] = sourceField && item[sourceField] ? item[sourceField] : '';
    });
    newItem['编号'] = `AL-2026-${String(index).padStart(3, '0')}`;
    newItem['供应商名称'] = newItem['供应商名称'] || '奥罗兰丝巾';
    index++;
    return newItem;
  });
  extractedData.value = mappedData;
  showMappingConfirmed.value = true;
};

const startExtraction = async () => {
  isProcessing.value = true;
  processingStep.value = '正在读取文件...';
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (templateFile.value) {
    processingStep.value = '正在解析Excel模板...';
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          rawExtractedData.value = jsonData;
        } else {
          rawExtractedData.value = [
            {
              '产品名称': '产品1',
              '规格参数': '',
              '营销文案': '',
              '零售价': '',
              '供货价': '',
              '备注': ''
            }
          ];
        }
        
        const firstRow = jsonData[0] || {};
        const fields = Object.keys(firstRow);
        if (fields.includes('商品名称') || fields.includes('产品名称') || fields.includes('品名')) {
          applyMappingTemplate('通用');
        } else {
          applyMappingTemplate('通用');
        }
        
        isProcessing.value = false;
      } catch (error) {
        console.error('解析Excel失败:', error);
        rawExtractedData.value = [
          {
            '产品名称': '产品1',
            '规格参数': '',
            '营销文案': '',
            '零售价': '',
            '供货价': '',
            '备注': ''
          }
        ];
        applyMappingTemplate('通用');
        isProcessing.value = false;
      }
    };
    reader.readAsArrayBuffer(templateFile.value);
  } else if (uploadedFiles.value.length > 0) {
    const file = uploadedFiles.value[0];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (apiKey.value && (fileExtension === 'pptx' || fileExtension === 'pdf' || fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png')) {
      processingStep.value = '正在使用AI提取数据...';
      
      const extractedData = await extractDataWithAI(file);
      
      if (extractedData && extractedData.length > 0) {
        rawExtractedData.value = extractedData;
      } else {
        rawExtractedData.value = [
          {
            '产品名称': '',
            '规格参数': '',
            '营销文案': '',
            '零售价': '',
            '供货价': '',
            '备注': ''
          }
        ];
      }
    } else {
      processingStep.value = '正在处理上传的文件...';
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      rawExtractedData.value = [
        {
          '产品名称': '',
          '规格参数': '',
          '营销文案': '',
          '零售价': '',
          '供货价': '',
          '备注': ''
        }
      ];
    }
    
    applyMappingTemplate('通用');
    
    isProcessing.value = false;
  } else {
    rawExtractedData.value = [
      {
        '产品名称': '',
        '规格参数': '',
        '营销文案': '',
        '零售价': '',
        '供货价': '',
        '备注': ''
      }
    ];
    
    applyMappingTemplate('通用');
    
    isProcessing.value = false;
  }
};

const resetExtraction = () => {
  rawExtractedData.value = [];
  extractedData.value = [];
  showMappingConfirmed.value = false;
};

const confirmData = () => {
  let index = 1;
  const mappedData = rawExtractedData.value.map(item => {
    const newItem = {};
    columns.forEach(col => {
      newItem[col.key] = item[col.key] || '';
    });
    if (!newItem['编号'] || newItem['编号'].trim() === '') {
      newItem['编号'] = `AL-2026-${String(index).padStart(3, '0')}`;
    }
    if (!newItem['供应商名称'] || newItem['供应商名称'].trim() === '') {
      newItem['供应商名称'] = '奥罗兰丝巾';
    }
    index++;
    return newItem;
  });
  extractedData.value = mappedData;
  showMappingConfirmed.value = true;
};

const addRowToRaw = (index) => {
  const newRow = {};
  columns.forEach(col => {
    newRow[col.key] = '';
  });
  rawExtractedData.value.splice(index + 1, 0, newRow);
};

const deleteRowFromRaw = (index) => {
  if (rawExtractedData.value.length > 1) {
    rawExtractedData.value.splice(index, 1);
  }
};

const addEmptyRow = () => {
  const newRow = {};
  columns.forEach(col => {
    newRow[col.key] = '';
  });
  rawExtractedData.value.push(newRow);
};

const editRow = (index) => {
};

const deleteRow = (index) => {
  extractedData.value.splice(index, 1);
};

const addRow = () => {
  const newRow = {};
  columns.forEach(col => {
    newRow[col.key] = '';
  });
  newRow['编号'] = `AL-2026-${String(extractedData.value.length + 1).padStart(3, '0')}`;
  newRow['供应商名称'] = '奥罗兰丝巾';
  extractedData.value.push(newRow);
};

const exportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(extractedData.value);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '产品数据');
  XLSX.writeFile(workbook, '产品数据_提取.xlsx');
};

const handleNext = () => {
  emit('update-data', { 
    extractedData: extractedData.value,
    uploadedFiles: uploadedFiles.value
  });
  emit('complete');
};

const handleTemplateSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    templateFile.value = file;
  }
};

const clearTemplate = () => {
  templateFile.value = null;
  document.getElementById('template-input').value = '';
};

const saveApiKey = () => {
  if (apiKeyInput.value.trim()) {
    apiKey.value = apiKeyInput.value.trim();
    localStorage.setItem('aiApiKey', apiKey.value);
    localStorage.setItem('aiService', aiService.value);
    apiKeyInput.value = '';
    alert('API Key 已保存！');
  } else {
    alert('请输入有效的API Key');
  }
};

const clearApiKey = () => {
  apiKey.value = '';
  apiKeyInput.value = '';
  localStorage.removeItem('aiApiKey');
  localStorage.removeItem('aiService');
};

const extractDataWithAI = async (file) => {
  if (!apiKey.value) {
    return null;
  }

  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(',')[1];
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        let prompt = `请从以下文件内容中提取产品信息，输出JSON格式：\n\n文件：${fileName}\n\n请提取：产品名称、规格参数、营销文案、零售价、供货价、备注等信息。\n\n输出格式：[{"产品名称": "xxx", "规格参数": "xxx", "营销文案": "xxx", "零售价": "xxx", "供货价": "xxx", "备注": "xxx"}, ...]`;

        if (extractionRules.value) {
          prompt += `\n\n参考规则：\n${extractionRules.value}`;
        }

        let response;
        if (aiService.value === 'doubao') {
          response = await fetch('https://api.doubao.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey.value}`
            },
            body: JSON.stringify({
              model: 'doubao-3.5-turbo',
              messages: [
                { role: 'system', content: '你是一个产品信息提取专家，擅长从文档中提取结构化数据。' },
                { role: 'user', content: prompt }
              ],
              max_tokens: 2000
            })
          });
        } else {
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey.value}`
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: '你是一个产品信息提取专家，擅长从文档中提取结构化数据。' },
                { role: 'user', content: prompt }
              ],
              max_tokens: 2000
            })
          });
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content || '';
        
        const jsonMatch = result.match(/\[.*\]/s);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          resolve(Array.isArray(extracted) ? extracted : [extracted]);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error('AI提取失败:', error);
        resolve(null);
      }
    };

    if (fileExtension === 'pdf' || fileExtension === 'pptx') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
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

.upload-area {
  margin-bottom: 20px;
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
  margin-bottom: 20px;
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

.btn-start {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-start:disabled {
  background: #e4e7ed;
  cursor: not-allowed;
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
}

.info-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.info-box p {
  margin: 0;
  font-size: 13px;
  color: #0284c7;
  line-height: 1.5;
}

.additional-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
}

.processing-spinner {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
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
  font-size: 16px;
  color: #606266;
  margin: 0 0 12px 0;
}

.progress-text {
  font-size: 14px;
  color: #909399;
}

.mapping-section {
  margin-bottom: 30px;
}

.mapping-header {
  margin-bottom: 20px;
}

.mapping-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
}

.mapping-desc {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.raw-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.raw-preview h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #606266;
}

.raw-items {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.raw-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.raw-field {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.raw-field:last-child {
  margin-bottom: 0;
}

.field-label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.field-value {
  font-size: 12px;
  color: #303133;
}

.mapping-rules {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.mapping-rules h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #606266;
}

.mapping-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}

.mapping-row {
  display: contents;
}

.target-col {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.arrow {
  color: #909399;
  text-align: center;
}

.mapping-select {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
}

.quick-mappings {
  margin-bottom: 20px;
}

.quick-mappings h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.quick-buttons {
  display: flex;
  gap: 12px;
}

.quick-btn {
  padding: 8px 20px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-btn:hover {
  background: #e4e7ed;
}

.result-section {
  margin-bottom: 30px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-refresh, .btn-export {
  padding: 8px 16px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-refresh:hover, .btn-export:hover {
  background: #e4e7ed;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.data-table th, .data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e4e7ed;
}

.data-table th {
  background: #f5f7fa;
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.data-table tr:hover {
  background: #fafafa;
}

.cell-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.cell-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-edit, .btn-delete {
  padding: 4px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.add-row {
  margin-bottom: 20px;
}

.btn-add {
  padding: 8px 20px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover {
  background: #e4e7ed;
}

.validation-info {
  background: #fff7e6;
  border: 1px solid #e6a23c;
  border-radius: 8px;
  padding: 16px;
}

.validation-info h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #e6a23c;
}

.validation-info ul {
  margin: 0;
  padding-left: 20px;
}

.validation-info li {
  margin: 6px 0;
  font-size: 13px;
  color: #8a6d3b;
}

.validation-info code {
  background: rgba(0,0,0,0.1);
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 12px;
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

.btn-confirm, .btn-next {
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

.btn-confirm:hover:not(:disabled), .btn-next:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-confirm:disabled, .btn-next:disabled {
  background: #e4e7ed;
  cursor: not-allowed;
}

.additional-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 1px solid #e4e7ed;
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

.template-upload {
  background: #fafafa;
  border-radius: 12px;
  padding: 24px;
}

.template-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 2px solid transparent;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-option:hover {
  border-color: #e4e7ed;
}

.template-option.active {
  border-color: #667eea;
  background: #f0f5ff;
}

.option-radio {
  position: relative;
  top: 4px;
  width: 20px;
  height: 20px;
}

.option-radio input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.option-radio label {
  display: block;
  width: 20px;
  height: 20px;
  border: 2px solid #dcdfe6;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-radio input:checked + label {
  border-color: #667eea;
  background: #667eea;
}

.option-radio input:checked + label::after {
  content: '';
  position: absolute;
  top: 5px;
  left: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
}

.option-content {
  flex: 1;
}

.option-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.option-content p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #909399;
}

.download-link-small {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: #f5f7fa;
  color: #667eea;
  text-decoration: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.download-link-small:hover {
  background: #e8ecf0;
}

.download-link {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.download-link:hover {
  background: #5a6fd6;
  transform: translateY(-1px);
}

.template-desc {
  font-size: 13px;
  color: #909399;
}

.upload-box-small {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.upload-box-small:hover {
  border-color: #667eea;
  background: #f0f5ff;
}

.upload-label-small {
  cursor: pointer;
  color: #667eea;
  font-size: 14px;
}

.selected-file {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  color: #303133;
}

.clear-btn {
  padding: 4px 12px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.clear-btn:hover {
  background: #e43939;
}

.rules-section {
  background: #fafafa;
  border-radius: 12px;
  padding: 24px;
}

.rules-textarea {
  width: 100%;
  height: 200px;
  padding: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  resize: vertical;
  box-sizing: border-box;
  line-height: 1.6;
}

.rules-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.api-config {
  background: #fafafa;
  border-radius: 12px;
  padding: 24px;
  margin-top: 20px;
}

.api-select {
  display: flex;
  align-items: center;
  gap: 10px;
}

.service-select {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
}

.key-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  margin: 10px 0;
  font-family: monospace;
}

.btn-save-key {
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save-key:hover {
  background: #5a6fd6;
}

.api-configured {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.configured-icon {
  color: #22c55e;
  font-weight: bold;
}

.btn-clear-key {
  margin-left: auto;
  padding: 6px 12px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-clear-key:hover {
  background: #fecaca;
}

.api-input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>