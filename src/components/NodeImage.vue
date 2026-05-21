<template>
  <div class="node-container">
    <div class="node-header">
      <h2>节点3: 图片处理</h2>
      <p class="description">图片裁切与智能扩图处理</p>
    </div>

    <div class="feature-tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'crop' }"
        @click="activeTab = 'crop'"
      >
        📐 图片裁切
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'expand' }"
        @click="activeTab = 'expand'"
      >
        🖼️ 智能扩图
      </button>
    </div>

    <div v-if="activeTab === 'crop'">
      <div v-if="!images.length" class="upload-section">
        <div 
          class="upload-area"
          :class="{ 'drag-over': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave="isDragOver = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input 
            type="file" 
            ref="fileInput" 
            multiple 
            accept="image/*" 
            @change="handleFileSelect"
            style="display: none"
          />
          <div class="upload-icon">📷</div>
          <div class="upload-text">点击或拖拽上传图片</div>
          <div class="upload-hint">支持 PNG、JPG、JPEG 格式</div>
        </div>
      </div>

    <div v-else class="image-management">
      <div class="management-header">
        <div class="image-count">已上传 {{ images.length }} 张图片</div>
        <div class="header-actions">
          <button class="btn-add-more" @click="triggerFileInput">+ 添加更多</button>
          <button class="btn-clear-all" @click="clearAll">清空全部</button>
        </div>
      </div>

      <div class="image-grid">
        <div 
          v-for="(img, index) in images" 
          :key="index" 
          class="image-card"
          :class="{ 'has-issue': img.hasIssue, 'is-selected': selectedImages.includes(index) }"
        >
          <div class="image-checkbox" @click.stop="toggleSelect(index)">
            <input type="checkbox" :checked="selectedImages.includes(index)" @change="toggleSelect(index)" />
          </div>
          <div class="image-preview" @click="openCropper(index)">
            <img 
              :src="img.croppedPreview || img.preview" 
              :alt="img.name" 
              :class="{ 'is-cropped': img.croppedPreview }"
            />
            <div v-if="img.hasIssue" class="issue-badge">需调整</div>
            <div v-else-if="img.croppedPreview" class="cropped-badge">已裁切</div>
            <div class="crop-overlay">
              <span>{{ img.croppedPreview ? '重新裁切' : '点击裁切' }}</span>
            </div>
          </div>
          <div class="image-info">
            <div class="image-name" :title="img.name">{{ img.name }}</div>
            <div class="image-size">{{ img.width }} × {{ img.height }}</div>
          </div>
          <button class="btn-remove" @click="removeImage(index)">×</button>
        </div>
      </div>

      <div class="action-buttons">
        <div class="selection-actions">
          <button class="btn-select-all" @click="toggleSelectAll">
            {{ selectedImages.length === images.length ? '取消全选' : '全选' }}
          </button>
          <span class="selected-count">已选择 {{ selectedImages.length }} 张</span>
        </div>
        <div class="crop-position-selector">
          <span class="crop-label">裁切位置:</span>
          <button 
            class="crop-position-btn" 
            :class="{ active: cropPosition === 'left' }"
            @click="cropPosition = 'left'"
          >左</button>
          <button 
            class="crop-position-btn" 
            :class="{ active: cropPosition === 'center' }"
            @click="cropPosition = 'center'"
          >中</button>
          <button 
            class="crop-position-btn" 
            :class="{ active: cropPosition === 'right' }"
            @click="cropPosition = 'right'"
          >右</button>
        </div>
        <button class="btn-auto-crop" @click="autoCropAll">
          🔄 自动裁切全部
        </button>
        <button class="btn-download-selected" @click="downloadSelected" :disabled="selectedImages.length === 0">
          ⬇️ 下载选中 ({{ selectedImages.length }})
        </button>
        <button class="btn-download-all" @click="downloadAll">
          ⬇️ 下载全部
        </button>
      </div>
    </div>
    </div>

    <div v-if="activeTab === 'expand'" class="expand-section">
      <div v-if="!expandImages.length" class="upload-section">
        <div 
          class="upload-area"
          :class="{ 'drag-over': isExpandDragOver }"
          @dragover.prevent="isExpandDragOver = true"
          @dragleave="isExpandDragOver = false"
          @drop.prevent="handleExpandDrop"
          @click="triggerExpandFileInput"
        >
          <input 
            type="file" 
            ref="expandFileInput" 
            multiple 
            accept="image/*" 
            @change="handleExpandFileSelect"
            style="display: none"
          />
          <div class="upload-icon">🖼️</div>
          <div class="upload-text">点击或拖拽上传需要扩图的图片</div>
          <div class="upload-hint">支持 PNG、JPG、JPEG 格式</div>
        </div>
      </div>

      <div v-else class="expand-images">
        <div class="management-header">
          <div class="image-count">已上传 {{ expandImages.length }} 张图片</div>
          <div class="header-actions">
            <button class="btn-add-more" @click="triggerExpandFileInput">+ 添加更多</button>
            <button class="btn-clear-all" @click="clearExpandAll">清空全部</button>
          </div>
        </div>

        <div class="image-grid">
          <div 
            v-for="(img, index) in expandImages" 
            :key="index" 
            class="image-card"
            :class="{ 'is-processing': img.isProcessing, 'is-expanded': img.expandedUrl }"
          >
            <div class="image-preview">
              <img 
                :src="img.expandedUrl || img.preview" 
                :alt="img.name" 
                :class="{ 'is-expanded': img.expandedUrl }"
              />
              <div v-if="img.isProcessing" class="processing-badge">处理中...</div>
              <div v-else-if="img.expandedUrl" class="expanded-badge">已扩图</div>
              <div v-else-if="img.error" class="error-badge">失败</div>
            </div>
            <div class="image-info">
              <div class="image-name" :title="img.name">{{ img.name }}</div>
              <div class="image-size">{{ img.width }} × {{ img.height }}</div>
            </div>
            <button class="btn-remove" @click="removeExpandImage(index)">×</button>
          </div>
        </div>

        <div class="action-buttons">
          <div class="expand-settings">
            <span class="expand-label">扩图比例:</span>
            <select class="expand-ratio-select" v-model="expandRatio">
              <option value="1:1">1:1 正方形</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
              <option value="9:16">9:16 竖版</option>
            </select>
          </div>
          <button class="btn-expand-all" @click="expandAllImages" :disabled="expandImages.length === 0 || isExpanding">
            🚀 {{ isExpanding ? '扩图中...' : '批量扩图' }}
          </button>
          <button class="btn-download-expanded" @click="downloadExpandedImages" :disabled="expandedCount === 0">
            ⬇️ 下载扩图结果 ({{ expandedCount }})
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCropper" class="cropper-modal" @click.self="closeCropper">
      <div class="cropper-container">
        <div class="cropper-header">
          <h3>调整裁切区域 (4:3)</h3>
          <button class="btn-close" @click="closeCropper">×</button>
        </div>
        <div class="cropper-body">
          <div class="cropper-main-area">
            <div 
              class="cropper-canvas-wrapper"
              ref="cropperCanvasWrapper"
            >
              <canvas 
                ref="cropperCanvas"
                class="cropper-canvas"
                :class="{ active: isDragging }"
                @mousedown="handleCanvasMouseDown"
              ></canvas>
              
              <div 
                class="crop-box"
                :style="{
                  left: cropBoxPosition.x + 'px',
                  top: cropBoxPosition.y + 'px',
                  width: cropBoxSize.width + 'px',
                  height: cropBoxSize.height + 'px'
                }"
                @mousedown.stop="handleCropBoxMouseDown"
              >
                <div class="crop-box-inner"></div>
                <div class="resize-handle resize-nw" @mousedown.stop="(e) => handleResizeHandleMouseDown('nw', e)"></div>
                <div class="resize-handle resize-ne" @mousedown.stop="(e) => handleResizeHandleMouseDown('ne', e)"></div>
                <div class="resize-handle resize-sw" @mousedown.stop="(e) => handleResizeHandleMouseDown('sw', e)"></div>
                <div class="resize-handle resize-se" @mousedown.stop="(e) => handleResizeHandleMouseDown('se', e)"></div>
              </div>
            </div>
            
            <div class="cropper-result-preview">
              <div class="preview-label">裁切预览</div>
              <canvas 
                ref="previewCanvas"
                class="preview-canvas"
              ></canvas>
            </div>
          </div>
          
          <div class="cropper-controls">
            <div class="control-group">
              <label>缩放: {{ Math.round(cropperZoom * 100) }}%</label>
              <input 
                type="range" 
                v-model.number="cropperZoom" 
                min="0.25" 
                max="4" 
                step="0.1"
                @input="redrawCanvas"
              />
            </div>
            <div class="control-group">
              <button class="btn-zoom-out" @click="zoomOut">-</button>
              <button class="btn-zoom-reset" @click="resetZoom">100%</button>
              <button class="btn-zoom-in" @click="zoomIn">+</button>
            </div>
          </div>
        </div>
        <div class="cropper-footer">
          <button class="btn-reset" @click="resetCrop">重置</button>
          <button class="btn-apply" @click="applyCrop">应用</button>
        </div>
      </div>
    </div>

    <div v-if="isProcessing" class="processing-overlay">
      <div class="processing-content">
        <div class="spinner"></div>
        <p>{{ processingText }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${processingProgress}%` }"></div>
        </div>
      </div>
    </div>

    <div class="action-bar">
      <button class="btn-back" @click="$emit('back')">← 返回</button>
      <button class="btn-skip-node" @click="$emit('skip')">跳过此步骤 →</button>
      <button class="btn-next" @click="handleNext">确认并继续 →</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const emit = defineEmits(['complete', 'back', 'skip', 'update-data']);

const fileInput = ref(null);
const images = ref([]);
const selectedImages = ref([]);
const isDragOver = ref(false);
const showCropper = ref(false);
const currentImageIndex = ref(-1);
const currentImage = ref(null);
const isProcessing = ref(false);
const processingText = ref('');
const processingProgress = ref(0);
const cropPosition = ref('left');
const activeTab = ref('crop');

const cropSettings = reactive({
  x: 0,
  y: 0,
  scale: 100
});

const ASPECT_RATIO = 4 / 3;

const expandFileInput = ref(null);
const expandImages = ref([]);
const isExpandDragOver = ref(false);
const isExpanding = ref(false);
const expandRatio = ref('1:1');

const JIMENG_API_CONFIG = {
  baseUrl: 'https://api.jimeng.io',
  apiKey: '',
  secretKey: ''
};

const cropperCanvasWrapper = ref(null);
const cropperCanvas = ref(null);
const previewCanvas = ref(null);
const cropperZoom = ref(1);
const isDragging = ref(false);
const isResizing = ref(false);
const dragStart = reactive({ x: 0, y: 0 });
const cropBoxStart = reactive({ x: 0, y: 0 });

const cropBoxPosition = reactive({ x: 0, y: 0 });
const cropBoxSize = reactive({ width: 320, height: 240 });
const cropperCanvasSize = reactive({ width: 600, height: 500 });

const resizeDirection = ref('');
const loadedImage = ref(null);

const toggleSelect = (index) => {
  const idx = selectedImages.value.indexOf(index);
  if (idx === -1) {
    selectedImages.value.push(index);
  } else {
    selectedImages.value.splice(idx, 1);
  }
};

const toggleSelectAll = () => {
  if (selectedImages.value.length === images.value.length) {
    selectedImages.value = [];
  } else {
    selectedImages.value = images.value.map((_, i) => i);
  }
};

const updateCanvasSize = () => {
  if (cropperCanvasWrapper.value && cropperCanvas.value) {
    const rect = cropperCanvasWrapper.value.getBoundingClientRect();
    cropperCanvasSize.width = rect.width;
    cropperCanvasSize.height = rect.height;
    
    cropperCanvas.value.width = cropperCanvasSize.width;
    cropperCanvas.value.height = cropperCanvasSize.height;
    
    recalculateCropBox();
  }
};

const recalculateCropBox = () => {
  if (!currentImage.value || !cropperCanvas.value || !loadedImage.value) return;
  
  const img = loadedImage.value;
  const imgRatio = img.width / img.height;
  const targetRatio = ASPECT_RATIO;
  
  let scale = 1;
  
  if (imgRatio > cropperCanvasSize.width / cropperCanvasSize.height) {
    scale = cropperCanvasSize.width / img.width;
  } else {
    scale = cropperCanvasSize.height / img.height;
  }
  
  const displayWidth = img.width * scale * cropperZoom.value;
  const displayHeight = img.height * scale * cropperZoom.value;
  
  let boxWidth = Math.min(displayWidth, cropperCanvasSize.width * 0.8);
  let boxHeight = boxWidth / targetRatio;
  
  if (boxHeight > cropperCanvasSize.height * 0.8) {
    boxHeight = cropperCanvasSize.height * 0.8;
    boxWidth = boxHeight * targetRatio;
  }
  
  cropBoxSize.width = boxWidth;
  cropBoxSize.height = boxHeight;
  
  cropBoxPosition.x = (cropperCanvasSize.width - boxWidth) / 2;
  cropBoxPosition.y = (cropperCanvasSize.height - boxHeight) / 2;
  
  redrawCanvas();
};

const redrawCanvas = () => {
  if (!cropperCanvas.value || !loadedImage.value) return;
  
  const ctx = cropperCanvas.value.getContext('2d');
  const img = loadedImage.value;
  
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, cropperCanvasSize.width, cropperCanvasSize.height);
  
  const imgRatio = img.width / img.height;
  let scale = 1;
  
  if (imgRatio > cropperCanvasSize.width / cropperCanvasSize.height) {
    scale = cropperCanvasSize.width / img.width;
  } else {
    scale = cropperCanvasSize.height / img.height;
  }
  
  const displayWidth = img.width * scale * cropperZoom.value;
  const displayHeight = img.height * scale * cropperZoom.value;
  
  const offsetX = (cropperCanvasSize.width - displayWidth) / 2;
  const offsetY = (cropperCanvasSize.height - displayHeight) / 2;
  
  ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight);
  
  updatePreview();
};

const updatePreview = () => {
  if (!previewCanvas.value || !loadedImage.value) return;
  
  const ctx = previewCanvas.value.getContext('2d');
  const img = loadedImage.value;
  
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, previewCanvas.value.width, previewCanvas.value.height);
  
  const imgRatio = img.width / img.height;
  let scale = 1;
  
  if (imgRatio > cropperCanvasSize.width / cropperCanvasSize.height) {
    scale = cropperCanvasSize.width / img.width;
  } else {
    scale = cropperCanvasSize.height / img.height;
  }
  
  const displayWidth = img.width * scale * cropperZoom.value;
  const displayHeight = img.height * scale * cropperZoom.value;
  
  const offsetX = (cropperCanvasSize.width - displayWidth) / 2;
  const offsetY = (cropperCanvasSize.height - displayHeight) / 2;
  
  const sx = (cropBoxPosition.x - offsetX) / (scale * cropperZoom.value);
  const sy = (cropBoxPosition.y - offsetY) / (scale * cropperZoom.value);
  const sw = cropBoxSize.width / (scale * cropperZoom.value);
  const sh = cropBoxSize.height / (scale * cropperZoom.value);
  
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, previewCanvas.value.width, previewCanvas.value.height);
};

const zoomIn = () => {
  cropperZoom.value = Math.min(4, cropperZoom.value + 0.25);
  recalculateCropBox();
};

const zoomOut = () => {
  cropperZoom.value = Math.max(0.25, cropperZoom.value - 0.25);
  recalculateCropBox();
};

const handleCanvasMouseDown = (e) => {
  isDragging.value = true;
  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
  cropBoxStart.x = cropBoxPosition.x;
  cropBoxStart.y = cropBoxPosition.y;
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleCropBoxMouseDown = (e) => {
  isDragging.value = true;
  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
  cropBoxStart.x = cropBoxPosition.x;
  cropBoxStart.y = cropBoxPosition.y;
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleMouseMove = (e) => {
  if (!isDragging.value && !isResizing.value) return;

  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;

  if (isResizing.value) {
    resizeCropBox(dx, dy);
    cropBoxStart.x = cropBoxPosition.x;
    cropBoxStart.y = cropBoxPosition.y;
  } else {
    moveCropBox(dx, dy);
    cropBoxStart.x = cropBoxPosition.x;
    cropBoxStart.y = cropBoxPosition.y;
  }

  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
};

const handleMouseUp = () => {
  isDragging.value = false;
  isResizing.value = false;
  resizeDirection.value = '';
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
};

const moveCropBox = (dx, dy) => {
  const newX = cropBoxStart.x + dx;
  const newY = cropBoxStart.y + dy;
  
  cropBoxPosition.x = Math.max(0, Math.min(newX, cropperCanvasSize.width - cropBoxSize.width));
  cropBoxPosition.y = Math.max(0, Math.min(newY, cropperCanvasSize.height - cropBoxSize.height));
  
  updatePreview();
};

const resizeCropBox = (dx, dy) => {
  const minSize = 50;
  const targetRatio = ASPECT_RATIO;
  
  const direction = resizeDirection.value;
  
  let newWidth = cropBoxSize.width;
  let newHeight = cropBoxSize.height;
  let newX = cropBoxPosition.x;
  let newY = cropBoxPosition.y;
  
  let scaleChange = 1;
  
  if (direction === 'se') {
    scaleChange = (cropBoxSize.width + dx) / cropBoxSize.width;
  } else if (direction === 'sw') {
    scaleChange = (cropBoxSize.width - dx) / cropBoxSize.width;
  } else if (direction === 'ne') {
    scaleChange = (cropBoxSize.width + dx) / cropBoxSize.width;
  } else if (direction === 'nw') {
    scaleChange = (cropBoxSize.width - dx) / cropBoxSize.width;
  }
  
  newWidth = Math.max(minSize, Math.min(cropperCanvasSize.width, cropBoxSize.width * scaleChange));
  newHeight = newWidth / targetRatio;
  
  if (direction.includes('w')) {
    newX = cropBoxPosition.x + (cropBoxSize.width - newWidth);
  }
  if (direction.includes('n')) {
    newY = cropBoxPosition.y + (cropBoxSize.height - newHeight);
  }
  
  cropBoxSize.width = newWidth;
  cropBoxSize.height = newHeight;
  cropBoxPosition.x = Math.max(0, Math.min(newX, cropperCanvasSize.width - newWidth));
  cropBoxPosition.y = Math.max(0, Math.min(newY, cropperCanvasSize.height - newHeight));
  
  updatePreview();
};

const handleResizeHandleMouseDown = (direction, e) => {
  e.stopPropagation();
  e.preventDefault();
  isResizing.value = true;
  resizeDirection.value = direction;
  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const resetZoom = () => {
  cropperZoom.value = 1;
  recalculateCropBox();
};

const openCropper = (index) => {
  currentImageIndex.value = index;
  currentImage.value = images.value[index];
  cropperZoom.value = 1;
  
  const img = new Image();
  img.onload = () => {
    loadedImage.value = img;
    
    setTimeout(() => {
      if (previewCanvas.value) {
        previewCanvas.value.width = 200;
        previewCanvas.value.height = 150;
      }
      updateCanvasSize();
      recalculateCropBox();
    }, 100);
  };
  img.src = currentImage.value.preview;
  
  showCropper.value = true;
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  processFiles(files);
};

const handleDrop = (e) => {
  isDragOver.value = false;
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  processFiles(files);
};

const processFiles = async (files) => {
  isProcessing.value = true;
  processingText.value = `正在处理 ${files.length} 张图片...`;
  
  const promises = files.map(file => loadImage(file));
  const results = await Promise.allSettled(promises);
  
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      images.value.push(result.value);
    } else {
      console.error(`处理图片 ${i} 失败:`, result.reason);
    }
  });
  
  processingProgress.value = 100;
  processingText.value = `处理完成，共 ${images.value.length} 张图片`;
  setTimeout(() => {
    isProcessing.value = false;
  }, 500);
};

const loadImage = (file) => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            const preview = e.target.result;
            const currentRatio = img.width / img.height;
            const needsCrop = Math.abs(currentRatio - ASPECT_RATIO) > 0.05;
            
            resolve({
              name: file.name,
              width: img.width,
              height: img.height,
              preview: preview,
              hasIssue: needsCrop,
              cropSettings: { x: 0, y: 0, scale: 100 }
            });
          };
          img.onerror = () => {
            resolve({
              name: file.name,
              width: 0,
              height: 0,
              preview: e.target.result,
              hasIssue: true,
              cropSettings: { x: 0, y: 0, scale: 100 }
            });
          };
          img.src = e.target.result;
        } catch (err) {
          resolve({
            name: file.name,
            width: 0,
            height: 0,
            preview: '',
            hasIssue: true,
            cropSettings: { x: 0, y: 0, scale: 100 }
          });
        }
      };
      reader.onerror = () => {
        resolve({
          name: file.name,
          width: 0,
          height: 0,
          preview: '',
          hasIssue: true,
          cropSettings: { x: 0, y: 0, scale: 100 }
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      resolve({
        name: file.name,
        width: 0,
        height: 0,
        preview: '',
        hasIssue: true,
        cropSettings: { x: 0, y: 0, scale: 100 }
      });
    }
  });
};

const closeCropper = () => {
  showCropper.value = false;
  currentImageIndex.value = -1;
  currentImage.value = null;
};

const resetCrop = () => {
  cropSettings.x = 0;
  cropSettings.y = 0;
  cropSettings.scale = 100;
};

const applyCrop = () => {
  if (currentImageIndex.value >= 0 && currentImage.value && loadedImage.value) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    const img = loadedImage.value;
    const imgRatio = img.width / img.height;
    let scale = 1;
    
    if (imgRatio > cropperCanvasSize.width / cropperCanvasSize.height) {
      scale = cropperCanvasSize.width / img.width;
    } else {
      scale = cropperCanvasSize.height / img.height;
    }
    
    const displayWidth = img.width * scale * cropperZoom.value;
    const displayHeight = img.height * scale * cropperZoom.value;
    
    const offsetX = (cropperCanvasSize.width - displayWidth) / 2;
    const offsetY = (cropperCanvasSize.height - displayHeight) / 2;
    
    const sx = (cropBoxPosition.x - offsetX) / (scale * cropperZoom.value);
    const sy = (cropBoxPosition.y - offsetY) / (scale * cropperZoom.value);
    const sw = cropBoxSize.width / (scale * cropperZoom.value);
    const sh = cropBoxSize.height / (scale * cropperZoom.value);
    
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 400, 300);
    
    images.value[currentImageIndex.value].croppedPreview = canvas.toDataURL('image/jpeg', 0.9);
    images.value[currentImageIndex.value].cropArea = {
      sx: sx,
      sy: sy,
      sw: sw,
      sh: sh
    };
    images.value[currentImageIndex.value].hasIssue = false;
  }
  closeCropper();
};

const removeImage = (index) => {
  images.value.splice(index, 1);
  selectedImages.value = selectedImages.value.filter(i => i !== index);
  selectedImages.value = selectedImages.value.map(i => i > index ? i - 1 : i);
};

const clearAll = () => {
  images.value = [];
  selectedImages.value = [];
};

const autoCropAll = async () => {
  isProcessing.value = true;
  processingText.value = '正在自动裁切...';
  
  for (let i = 0; i < images.value.length; i++) {
    processingProgress.value = Math.round((i / images.value.length) * 100);
    const img = images.value[i];
    
    const croppedPreview = await generateCroppedPreview(img);
    img.croppedPreview = croppedPreview;
    img.hasIssue = false;
  }
  
  processingProgress.value = 100;
  processingText.value = '自动裁切完成';
  setTimeout(() => {
    isProcessing.value = false;
  }, 500);
};

const generateCroppedPreview = (imgData) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const targetRatio = ASPECT_RATIO;
      let cropWidth, cropHeight, sx, sy;
      
      const imgWidth = imgData.width || img.width;
      const imgHeight = imgData.height || img.height;
      const currentRatio = imgWidth / imgHeight;
      
      if (currentRatio > targetRatio) {
        cropHeight = imgHeight;
        cropWidth = cropHeight * targetRatio;
        
        const autoPosition = findAutoCropPosition(img, 'horizontal', cropWidth, imgWidth, imgHeight);
        console.log('自动裁切位置:', autoPosition);
        
        if (autoPosition === 'left' || cropPosition.value === 'left') {
          sx = 0;
        } else if (autoPosition === 'right' || cropPosition.value === 'right') {
          sx = imgWidth - cropWidth;
        } else if (cropPosition.value === 'center') {
          sx = (imgWidth - cropWidth) / 2;
        } else {
          sx = 0;
        }
        sy = 0;
      } else {
        cropWidth = imgWidth;
        cropHeight = cropWidth / targetRatio;
        
        const autoPosition = findAutoCropPosition(img, 'vertical', cropHeight, imgWidth, imgHeight);
        console.log('自动裁切位置:', autoPosition);
        
        sx = 0;
        if (autoPosition === 'top' || cropPosition.value === 'left') {
          sy = 0;
        } else if (autoPosition === 'bottom' || cropPosition.value === 'right') {
          sy = imgHeight - cropHeight;
        } else if (cropPosition.value === 'center') {
          sy = (imgHeight - cropHeight) / 2;
        } else {
          sy = 0;
        }
      }
      
      console.log('最终裁切区域:', { sx, sy, cropWidth, cropHeight });
      
      canvas.width = 400;
      canvas.height = 300;
      
      ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, 400, 300);
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = imgData.preview;
  });
};

const findAutoCropPosition = (img, direction, cropSize, imgWidth, imgHeight) => {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  const scale = Math.min(500 / imgWidth, 500 / imgHeight);
  const scaledWidth = Math.round(imgWidth * scale);
  const scaledHeight = Math.round(imgHeight * scale);
  
  tempCanvas.width = scaledWidth;
  tempCanvas.height = scaledHeight;
  tempCtx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, scaledWidth, scaledHeight);
  
  const imageData = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight);
  const pixels = imageData.data;
  
  if (direction === 'horizontal') {
    const scanHeight = Math.floor(scaledHeight * 0.9);
    const startY = Math.floor(scaledHeight * 0.05);
    
    const leftTextScore = detectTextArea(pixels, scaledWidth, scaledHeight, 0, Math.floor(scaledWidth * 0.45), startY, scanHeight);
    const rightTextScore = detectTextArea(pixels, scaledWidth, scaledHeight, Math.floor(scaledWidth * 0.55), scaledWidth, startY, scanHeight);
    
    console.log('左右文字检测:', { 
      leftText: leftTextScore, 
      rightText: rightTextScore 
    });
    
    if (rightTextScore > leftTextScore * 2.5 || rightTextScore > 8) {
      console.log('检测到右侧文字较多，从左侧裁切');
      return 'left';
    } else if (leftTextScore > rightTextScore * 2.5 || leftTextScore > 8) {
      console.log('检测到左侧文字较多，从右侧裁切');
      return 'right';
    }
  } else {
    const scanWidth = Math.floor(scaledWidth * 0.9);
    const startX = Math.floor(scaledWidth * 0.05);
    
    const topTextScore = detectTextArea(pixels, scaledWidth, scaledHeight, startX, scanWidth, 0, Math.floor(scaledHeight * 0.45), true);
    const bottomTextScore = detectTextArea(pixels, scaledWidth, scaledHeight, startX, scanWidth, Math.floor(scaledHeight * 0.55), scaledHeight, true);
    
    console.log('上下文字检测:', { 
      topText: topTextScore, 
      bottomText: bottomTextScore 
    });
    
    if (bottomTextScore > topTextScore * 2.5 || bottomTextScore > 8) {
      console.log('检测到下方文字较多，从上方裁切');
      return 'top';
    } else if (topTextScore > bottomTextScore * 2.5 || topTextScore > 8) {
      console.log('检测到上方文字较多，从下方裁切');
      return 'bottom';
    }
  }
  
  console.log('未检测到明显文字区域，使用居中裁切');
  return 'center';
};

const detectTextArea = (pixels, width, height, startX, endX, startY, endY, isVertical = false) => {
  let textScore = 0;
  let pixelCount = 0;
  
  const actualStartX = Math.max(0, Math.min(startX, width - 1));
  const actualEndX = Math.max(actualStartX, Math.min(endX, width - 1));
  const actualStartY = Math.max(0, Math.min(startY, height - 1));
  const actualEndY = Math.max(actualStartY, Math.min(endY, height - 1));
  
  const sampleStep = 2;
  
  for (let x = actualStartX; x < actualEndX; x += sampleStep) {
    for (let y = actualStartY; y < actualEndY; y += sampleStep) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      
      if (brightness < 100 && saturation < 80) {
        textScore++;
      }
      
      pixelCount++;
    }
  }
  
  return pixelCount > 0 ? (textScore / pixelCount) * 100 : 0;
};

const findOptimalCropPosition = (img, direction, cropSize) => {
  const fullSize = direction === 'horizontal' ? img.width : img.height;
  const cropArea = Math.round(cropSize);
  
  if (fullSize <= cropArea) {
    return 0;
  }
  
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  const scale = Math.min(500 / img.width, 500 / img.height);
  const scaledWidth = Math.round(img.width * scale);
  const scaledHeight = Math.round(img.height * scale);
  
  tempCanvas.width = scaledWidth;
  tempCanvas.height = scaledHeight;
  tempCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, scaledWidth, scaledHeight);
  
  const imageData = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight);
  const pixels = imageData.data;
  
  const edgeThreshold = 20;
  
  if (direction === 'horizontal') {
    const thirdWidth = Math.floor(scaledWidth / 3);
    
    const leftEdgeCount = countEdges(pixels, scaledWidth, scaledHeight, 0, thirdWidth, edgeThreshold);
    const middleEdgeCount = countEdges(pixels, scaledWidth, scaledHeight, thirdWidth, thirdWidth * 2, edgeThreshold);
    const rightEdgeCount = countEdges(pixels, scaledWidth, scaledHeight, thirdWidth * 2, scaledWidth, edgeThreshold);
    
    const minEdgeCount = Math.min(leftEdgeCount, middleEdgeCount, rightEdgeCount);
    
    if (rightEdgeCount > leftEdgeCount * 1.5 && leftEdgeCount === minEdgeCount) {
      return 0;
    } else if (leftEdgeCount > rightEdgeCount * 1.5 && rightEdgeCount === minEdgeCount) {
      return Math.round((fullSize - cropArea));
    }
  } else {
    const thirdHeight = Math.floor(scaledHeight / 3);
    
    const topEdgeCount = countEdges(pixels, scaledWidth, scaledHeight, 0, thirdHeight, edgeThreshold, true);
    const middleEdgeCount = countEdges(pixels, scaledWidth, scaledHeight, thirdHeight, thirdHeight * 2, edgeThreshold, true);
    const bottomEdgeCount = countEdges(pixels, scaledWidth, scaledHeight, thirdHeight * 2, scaledHeight, edgeThreshold, true);
    
    const minEdgeCount = Math.min(topEdgeCount, middleEdgeCount, bottomEdgeCount);
    
    if (bottomEdgeCount > topEdgeCount * 1.5 && topEdgeCount === minEdgeCount) {
      return 0;
    } else if (topEdgeCount > bottomEdgeCount * 1.5 && bottomEdgeCount === minEdgeCount) {
      return Math.round((fullSize - cropArea));
    }
  }
  
  return Math.round((fullSize - cropArea) / 2);
};

const countHorizontalEdges = (pixels, width, height, startX, endX, threshold, startY = 0, scanHeight = null) => {
  let edgeCount = 0;
  const actualStartY = startY;
  const actualEndY = scanHeight ? startY + scanHeight : height - 1;
  
  for (let x = startX; x < Math.min(endX, width - 1); x++) {
    for (let y = actualStartY; y < actualEndY; y++) {
      const idx1 = (y * width + x) * 4;
      const idxRight = (y * width + x + 1) * 4;
      
      const bright1 = pixels[idx1] * 0.299 + pixels[idx1 + 1] * 0.587 + pixels[idx1 + 2] * 0.114;
      const brightRight = pixels[idxRight] * 0.299 + pixels[idxRight + 1] * 0.587 + pixels[idxRight + 2] * 0.114;
      
      if (Math.abs(bright1 - brightRight) > threshold) {
        edgeCount++;
      }
    }
  }
  
  return edgeCount;
};

const countVerticalEdges = (pixels, width, height, startY, endY, threshold, startX = 0, scanWidth = null) => {
  let edgeCount = 0;
  const actualStartX = startX;
  const actualEndX = scanWidth ? startX + scanWidth : width - 1;
  
  for (let y = startY; y < Math.min(endY, height - 1); y++) {
    for (let x = actualStartX; x < actualEndX; x++) {
      const idx1 = (y * width + x) * 4;
      const idxDown = ((y + 1) * width + x) * 4;
      
      const bright1 = pixels[idx1] * 0.299 + pixels[idx1 + 1] * 0.587 + pixels[idx1 + 2] * 0.114;
      const brightDown = pixels[idxDown] * 0.299 + pixels[idxDown + 1] * 0.587 + pixels[idxDown + 2] * 0.114;
      
      if (Math.abs(bright1 - brightDown) > threshold) {
        edgeCount++;
      }
    }
  }
  
  return edgeCount;
};

const countEdges = (pixels, width, height, start, end, threshold, isVertical = false) => {
  let edgeCount = 0;
  
  if (!isVertical) {
    for (let x = start; x < Math.min(end, width - 1); x++) {
      for (let y = 0; y < height - 1; y++) {
        const idx1 = (y * width + x) * 4;
        const idxRight = (y * width + x + 1) * 4;
        
        const bright1 = pixels[idx1] * 0.299 + pixels[idx1 + 1] * 0.587 + pixels[idx1 + 2] * 0.114;
        const brightRight = pixels[idxRight] * 0.299 + pixels[idxRight + 1] * 0.587 + pixels[idxRight + 2] * 0.114;
        
        if (Math.abs(bright1 - brightRight) > threshold) {
          edgeCount++;
        }
      }
    }
  } else {
    for (let y = start; y < Math.min(end, height - 1); y++) {
      for (let x = 0; x < width - 1; x++) {
        const idx1 = (y * width + x) * 4;
        const idxDown = ((y + 1) * width + x) * 4;
        
        const bright1 = pixels[idx1] * 0.299 + pixels[idx1 + 1] * 0.587 + pixels[idx1 + 2] * 0.114;
        const brightDown = pixels[idxDown] * 0.299 + pixels[idxDown + 1] * 0.587 + pixels[idxDown + 2] * 0.114;
        
        if (Math.abs(bright1 - brightDown) > threshold) {
          edgeCount++;
        }
      }
    }
  }
  
  return edgeCount;
};

const cropAndDownload = async (imgData, index) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 1200;
      canvas.height = 900;
      
      if (imgData.cropArea) {
        ctx.drawImage(img, imgData.cropArea.sx, imgData.cropArea.sy, imgData.cropArea.sw, imgData.cropArea.sh, 0, 0, 1200, 900);
      } else {
        const targetRatio = ASPECT_RATIO;
        let cropWidth, cropHeight, sx, sy;
        
        const imgWidth = img.width;
        const imgHeight = img.height;
        const currentRatio = imgWidth / imgHeight;
        
        if (currentRatio > targetRatio) {
          cropHeight = imgHeight;
          cropWidth = cropHeight * targetRatio;
          
          const autoPosition = findAutoCropPosition(img, 'horizontal', cropWidth, imgWidth, imgHeight);
          
          if (autoPosition === 'left' || cropPosition.value === 'left') {
            sx = 0;
          } else if (autoPosition === 'right' || cropPosition.value === 'right') {
            sx = imgWidth - cropWidth;
          } else {
            sx = (imgWidth - cropWidth) / 2;
          }
          sy = 0;
        } else {
          cropWidth = imgWidth;
          cropHeight = cropWidth / targetRatio;
          
          const autoPosition = findAutoCropPosition(img, 'vertical', cropHeight, imgWidth, imgHeight);
          
          sx = 0;
          if (autoPosition === 'top' || cropPosition.value === 'left') {
            sy = 0;
          } else if (autoPosition === 'bottom' || cropPosition.value === 'right') {
            sy = imgHeight - cropHeight;
          } else {
            sy = (imgHeight - cropHeight) / 2;
          }
        }
        
        ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, 1200, 900);
      }
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = imgData.name;
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    };
    img.src = imgData.preview;
  });
};

const downloadSelected = async () => {
  if (selectedImages.value.length === 0) return;
  
  isProcessing.value = true;
  processingText.value = `正在裁切并下载 ${selectedImages.value.length} 张图片...`;
  
  for (let i = 0; i < selectedImages.value.length; i++) {
    processingProgress.value = Math.round((i / selectedImages.value.length) * 100);
    await cropAndDownload(images.value[selectedImages.value[i]], selectedImages.value[i]);
    await new Promise(r => setTimeout(r, 300));
  }
  
  processingProgress.value = 100;
  setTimeout(() => {
    isProcessing.value = false;
  }, 500);
};

const downloadAll = async () => {
  isProcessing.value = true;
  processingText.value = '正在裁切并下载图片...';
  
  for (let i = 0; i < images.value.length; i++) {
    processingProgress.value = Math.round((i / images.value.length) * 100);
    await cropAndDownload(images.value[i], i);
    await new Promise(r => setTimeout(r, 300));
  }
  
  processingProgress.value = 100;
  setTimeout(() => {
    isProcessing.value = false;
  }, 500);
};

const triggerExpandFileInput = () => {
  expandFileInput.value?.click();
};

const handleExpandFileSelect = (e) => {
  const files = Array.from(e.target.files);
  processExpandFiles(files);
};

const handleExpandDrop = (e) => {
  isExpandDragOver.value = false;
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  processExpandFiles(files);
};

const processExpandFiles = (files) => {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        expandImages.value.push({
          name: file.name,
          preview: e.target.result,
          width: img.width,
          height: img.height,
          expandedUrl: null,
          isProcessing: false,
          error: null
        });
        img.src = '';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const removeExpandImage = (index) => {
  expandImages.value.splice(index, 1);
};

const clearExpandAll = () => {
  expandImages.value = [];
};

const expandedCount = () => {
  return expandImages.value.filter(img => img.expandedUrl).length;
};

const expandImage = async (imgData, index) => {
  return new Promise(async (resolve) => {
    expandImages.value[index].isProcessing = true;
    expandImages.value[index].error = null;
    
    if (!JIMENG_API_CONFIG.apiKey || !JIMENG_API_CONFIG.secretKey) {
      await simulateExpandImage(imgData, index);
      resolve();
      return;
    }
    
    try {
      const response = await fetch(`${JIMENG_API_CONFIG.baseUrl}/api/image/expand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': JIMENG_API_CONFIG.apiKey,
          'X-Secret-Key': JIMENG_API_CONFIG.secretKey
        },
        body: JSON.stringify({
          image: imgData.preview.split(',')[1],
          ratio: expandRatio.value,
          format: 'png'
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.url) {
        expandImages.value[index].expandedUrl = result.data.url;
      } else {
        expandImages.value[index].error = result.message || '扩图失败';
      }
    } catch (error) {
      expandImages.value[index].error = '网络错误';
      console.error('扩图API调用失败:', error);
    }
    
    expandImages.value[index].isProcessing = false;
    resolve();
  });
};

const simulateExpandImage = async (imgData, index) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const ratioParts = expandRatio.value.split(':');
        const targetRatio = parseInt(ratioParts[0]) / parseInt(ratioParts[1]);
        
        let newWidth, newHeight;
        const currentRatio = img.width / img.height;
        
        if (currentRatio < targetRatio) {
          newHeight = img.height;
          newWidth = Math.round(img.height * targetRatio);
        } else {
          newWidth = img.width;
          newHeight = Math.round(img.width / targetRatio);
        }
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, newWidth, newHeight);
        
        const offsetX = (newWidth - img.width) / 2;
        const offsetY = (newHeight - img.height) / 2;
        ctx.drawImage(img, offsetX, offsetY);
        
        expandImages.value[index].expandedUrl = canvas.toDataURL('image/png');
        expandImages.value[index].isProcessing = false;
        resolve();
      };
      img.src = imgData.preview;
    }, 1500);
  });
};

const expandAllImages = async () => {
  isExpanding.value = true;
  
  for (let i = 0; i < expandImages.value.length; i++) {
    if (!expandImages.value[i].expandedUrl && !expandImages.value[i].isProcessing) {
      await expandImage(expandImages.value[i], i);
    }
  }
  
  isExpanding.value = false;
};

const downloadExpandedImages = async () => {
  const expanded = expandImages.value.filter(img => img.expandedUrl);
  
  for (const imgData of expanded) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expanded_${imgData.name}`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = imgData.expandedUrl;
    
    await new Promise(r => setTimeout(r, 300));
  }
};

const handleNext = () => {
  emit('update-data', { images: images.value });
  emit('complete');
};
</script>

<style scoped>
.node-container {
  padding: 30px;
  position: relative;
}

.node-header {
  margin-bottom: 20px;
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

.feature-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 4px;
  background: #f5f7fa;
  border-radius: 10px;
  width: fit-content;
}

.tab-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: #e4e7ed;
}

.tab-btn.active {
  background: white;
  color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.upload-section {
  max-width: 600px;
  margin: 0 auto;
}

.upload-area {
  border: 3px dashed #dcdfe6;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover, .upload-area.drag-over {
  border-color: #409eff;
  background: #f0f5ff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 18px;
  color: #303133;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #909399;
}

.image-management {
  margin-bottom: 30px;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.image-count {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-add-more, .btn-clear-all {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-more {
  background: #409eff;
  color: white;
  border: none;
}

.btn-add-more:hover {
  background: #66b1ff;
}

.btn-clear-all {
  background: white;
  color: #909399;
  border: 1px solid #dcdfe6;
}

.btn-clear-all:hover {
  color: #f56c6c;
  border-color: #f56c6c;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.image-card {
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.image-card.has-issue {
  border: 2px solid #e6a23c;
}

.image-card.is-selected {
  border: 2px solid #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.3);
}

.image-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 20;
  background: white;
  border-radius: 4px;
  padding: 2px;
}

.image-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.image-preview {
  position: relative;
  padding-top: 75%;
  background: #f5f7fa;
  overflow: hidden;
  cursor: pointer;
}

.image-preview img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.issue-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: #e6a23c;
  color: white;
  font-size: 12px;
  border-radius: 4px;
}

.cropped-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: #67c23a;
  color: white;
  font-size: 12px;
  border-radius: 4px;
}

img.is-cropped {
  object-fit: cover;
}

.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-preview:hover .crop-overlay {
  opacity: 1;
}

.crop-overlay span {
  color: white;
  font-size: 14px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
}

.image-info {
  padding: 12px;
}

.image-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-size {
  font-size: 12px;
  color: #909399;
}

.btn-remove {
  position: absolute;
  top: 8px;
  left: 36px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-card:hover .btn-remove {
  opacity: 1;
}

.btn-remove:hover {
  background: #f56c6c;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-top: 24px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-select-all {
  padding: 8px 16px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-select-all:hover {
  background: #e4e7ed;
}

.selected-count {
  font-size: 14px;
  color: #606266;
}

.crop-position-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crop-label {
  font-size: 14px;
  color: #606266;
}

.crop-position-btn {
  padding: 6px 16px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.crop-position-btn:hover {
  background: #e4e7ed;
}

.crop-position-btn.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}

.btn-auto-crop, .btn-download-all, .btn-download-selected {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-auto-crop {
  background: #67c23a;
  color: white;
  border: none;
}

.btn-auto-crop:hover {
  background: #85ce61;
}

.btn-download-selected {
  background: #e6a23c;
  color: white;
  border: none;
}

.btn-download-selected:hover:not(:disabled) {
  background: #ebb563;
}

.btn-download-selected:disabled {
  background: #dcdfe6;
  cursor: not-allowed;
}

.btn-download-all {
  background: #409eff;
  color: white;
  border: none;
}

.btn-download-all:hover {
  background: #66b1ff;
}

.cropper-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cropper-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cropper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.cropper-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.btn-close {
  width: 32px;
  height: 32px;
  background: #f5f7fa;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: #f56c6c;
  color: white;
}

.cropper-body {
  display: flex;
  padding: 20px;
  gap: 20px;
  flex: 1;
  overflow: hidden;
  flex-direction: column;
}

.cropper-main-area {
  display: flex;
  flex: 1;
  gap: 20px;
  min-height: 400px;
}

.cropper-canvas-wrapper {
  flex: 1;
  position: relative;
  background: #333;
  border-radius: 8px;
  min-height: 400px;
  user-select: none;
  -webkit-user-select: none;
}

.cropper-canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;
  pointer-events: none;
}

.cropper-canvas.active {
  pointer-events: auto;
}

.preview-canvas {
  width: 200px;
  height: 150px;
  border-radius: 8px;
  border: 2px solid #409eff;
}

.crop-box {
  position: absolute;
  border: 2px solid #409eff;
  cursor: move;
  z-index: 10;
  pointer-events: auto;
}

.crop-box-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(64, 158, 255, 0.1);
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #409eff;
  border: 3px solid white;
  border-radius: 50%;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.resize-handle.resize-nw {
  top: 2px;
  left: 2px;
  cursor: nwse-resize;
}

.resize-handle.resize-ne {
  top: 2px;
  right: 2px;
  cursor: nesw-resize;
}

.resize-handle.resize-sw {
  bottom: 2px;
  left: 2px;
  cursor: nesw-resize;
}

.resize-handle.resize-se {
  bottom: 2px;
  right: 2px;
  cursor: nwse-resize;
}

.cropper-result-preview {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-label {
  font-size: 14px;
  color: #606266;
  text-align: center;
}

.cropper-controls {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  justify-content: center;
  padding-top: 10px;
  border-top: 1px solid #e4e7ed;
}

.cropper-controls .control-group:first-child {
  width: 300px;
}

.btn-zoom-out, .btn-zoom-reset, .btn-zoom-in {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #dcdfe6;
  background: white;
}

.btn-zoom-out:hover, .btn-zoom-reset:hover, .btn-zoom-in:hover {
  background: #f5f7fa;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-size: 14px;
  color: #606266;
}

.control-group input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e4e7ed;
  outline: none;
  -webkit-appearance: none;
}

.control-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #409eff;
  cursor: pointer;
}

.cropper-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e4e7ed;
}

.btn-reset, .btn-apply {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-reset {
  background: #f5f7fa;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-reset:hover {
  background: #e4e7ed;
}

.btn-apply {
  background: #409eff;
  color: white;
  border: none;
}

.btn-apply:hover {
  background: #66b1ff;
}

.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.processing-content {
  background: white;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  min-width: 300px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.processing-content p {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #409eff;
  transition: width 0.3s ease;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
}

.btn-back, .btn-skip-node, .btn-next {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.btn-back:hover {
  background: #e4e7ed;
}

.btn-skip-node {
  background: #fff7e6;
  border: 1px solid #e6a23c;
  color: #e6a23c;
}

.btn-skip-node:hover {
  background: #ffeeba;
}

.btn-next {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-next:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.expand-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.expand-images {
  animation: fadeIn 0.3s ease;
}

.expand-settings {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-label {
  font-size: 14px;
  color: #606266;
}

.expand-ratio-select {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.expand-ratio-select:focus {
  outline: none;
  border-color: #409eff;
}

.btn-expand-all {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-expand-all:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-expand-all:disabled {
  background: #e4e7ed;
  cursor: not-allowed;
}

.btn-download-expanded {
  padding: 12px 24px;
  background: #67c23a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-download-expanded:hover:not(:disabled) {
  background: #5daf34;
}

.btn-download-expanded:disabled {
  background: #dcdfe6;
  cursor: not-allowed;
}

.processing-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #409eff;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.expanded-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #67c23a;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.error-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #f56c6c;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}
</style>
