<template>
  <div v-if="showHome">
    <HomePage @start="handleHomeStart" />
  </div>
  <div v-else class="workflow-body">
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-block">
          <span class="brand-mark">C</span>
          <p class="eyebrow">Product Data Automation</p>
          <h1>标品输入输出自动化流程</h1>
        </div>
        <div class="topbar-actions">
          <span class="status-pill" data-mode="offline">Offline</span>
          <button class="icon-button" type="button" title="保存当前配置" aria-label="保存当前配置">✓</button>
          <button class="secondary-action home-link" type="button" @click="showHome = true">返回首页</button>
        </div>
      </header>

      <main class="workspace">
        <aside class="node-panel" aria-label="工作流节点">
          <div class="panel-title">
            <span>选择起始节点</span>
            <strong>{{ nodes.length }}</strong>
          </div>
          <nav class="node-list">
            <button
              v-for="(node, index) in nodes"
              :key="node.id"
              class="node-button"
              :class="{
                'is-active': currentNode === index
              }"
              type="button"
              @click="goToNode(index)"
            >
              <span class="node-index">{{ index + 1 }}</span>
              <div class="node-copy">
                <strong>{{ node.name }}</strong>
                <span>{{ node.description }}</span>
              </div>
            </button>
          </nav>
        </aside>

        <section class="work-area" aria-live="polite">
          <div class="flow-strip">
            <div
              v-for="(node, index) in nodes"
              :key="node.id"
              class="flow-step"
              :class="{
                'is-active': currentNode === index,
                'is-queued': currentNode < index,
                'is-skipped': skippedNodes.includes(index)
              }"
            >
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <strong>{{ node.name }}</strong>
            </div>
          </div>

          <div class="section-heading">
            <div>
              <p class="eyebrow">节点 {{ currentNode + 1 }}</p>
              <h2>{{ nodes[currentNode].name }}</h2>
            </div>
          </div>

          <div class="form-grid">
            <div class="input-zone">
              <transition name="fade" mode="out-in">
                <component
                  :is="currentComponent"
                  :key="currentNode"
                  @complete="handleComplete"
                  @skip="handleSkip"
                  @back="handleBack"
                  @next="handleNext"
                  :data="processData"
                  @update-data="updateProcessData"
                />
              </transition>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import HomePage from './components/HomePage.vue'
import NodeUpload from './components/NodeUpload.vue'
import NodeExtract from './components/NodeExtract.vue'
import NodeImage from './components/NodeImage.vue'
import NodeFeishu from './components/NodeFeishu.vue'
import NodeClean from './components/NodeClean.vue'
import NodeExcel from './components/NodeExcel.vue'
import NodePPT from './components/NodePPT.vue'
import NodePPTPrice from './components/NodePPTPrice.vue'

const showHome = ref(true)

const nodes = ref([
  { id: 1, name: '提取数据', description: '上传PPT/PDF/图片，AI识别产品信息', status: 'pending' },
  { id: 2, name: '飞书上传', description: '上传到多维表格', status: 'pending' },
  { id: 3, name: '图片处理', description: '裁切与扩图', status: 'pending' },
  { id: 4, name: '数据清理', description: '清洗处理数据', status: 'pending' },
  { id: 5, name: '生成Excel', description: '推品表格输出', status: 'pending' },
  { id: 6, name: '生成PPT', description: '占位符模板替换', status: 'pending' },
  { id: 7, name: 'PPT价格修改', description: '核心价改供货价', status: 'pending' }
])

const currentNode = ref(0)
const completedNodes = ref([])
const skippedNodes = ref([])
const processData = ref({
  uploadedFiles: [],
  extractedData: [],
  imageResults: [],
  feishuLink: '',
  feishuData: [],
  cleanedData: [],
  excelPath: '',
  pptPath: '',
  dataSource: 'new'
})

const currentComponent = computed(() => {
  const components = [
    NodeExtract,
    NodeFeishu,
    NodeImage,
    NodeClean,
    NodeExcel,
    NodePPT,
    NodePPTPrice
  ]
  return components[currentNode.value]
})

const goToNode = (index) => {
  currentNode.value = index
}

const handleHomeStart = (stepIndex) => {
  showHome.value = false
  currentNode.value = stepIndex
}

const handleComplete = () => {
  if (!completedNodes.value.includes(currentNode.value)) {
    completedNodes.value.push(currentNode.value)
  }
  if (currentNode.value < nodes.value.length - 1) {
    currentNode.value++
  }
}

const handleSkip = () => {
  if (!skippedNodes.value.includes(currentNode.value)) {
    skippedNodes.value.push(currentNode.value)
  }
  if (currentNode.value < nodes.value.length - 1) {
    currentNode.value++
  }
}

const handleBack = () => {
  if (currentNode.value > 0) {
    currentNode.value--
  }
}

const handleNext = () => {
  if (currentNode.value < nodes.value.length - 1) {
    currentNode.value++
  }
}

const updateProcessData = (newData) => {
  processData.value = { ...processData.value, ...newData }
}
</script>

<style scoped>
:root {
  --ink: #050505;
  --muted: #5f6064;
  --paper: #ffffff;
  --soft: #f1f1f1;
  --line: #111111;
  --blue: #2725d8;
  --green: #116f57;
  --orange: #ff8128;
  --coral: #f55237;
  --yellow: #ffc845;
  --pink: #e579db;
  --shadow: 0 26px 65px rgba(0, 0, 0, 0.16);
}

.workflow-body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--ink);
  background:
    linear-gradient(rgba(5, 5, 5, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(5, 5, 5, 0.035) 1px, transparent 1px),
    #f7f7f4;
  background-size: 56px 56px;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "PingFang SC",
    "Microsoft YaHei",
    sans-serif;
}

.app-shell {
  min-height: 100vh;
  padding: clamp(20px, 3vw, 42px);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  max-width: 1560px;
  margin: 0 auto;
  padding: 0 4px 22px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.12);
}

.brand-block {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  column-gap: 14px;
}

.brand-mark {
  grid-row: span 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: #fff;
  background: #000;
  font-size: 18px;
  font-weight: 900;
}

.brand-block .eyebrow,
.section-heading .eyebrow,
.start-console .eyebrow,
.clean-result .eyebrow {
  margin: 0 0 5px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.brand-block h1 {
  margin: 0;
  max-width: none;
  font-size: clamp(24px, 2.35vw, 36px);
  font-weight: 800;
  line-height: 1.08;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.primary-action,
.secondary-action,
.icon-button,
.text-button,
.scope-button {
  border: 1px solid transparent;
  border-radius: 999px;
  min-height: 40px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.primary-action {
  padding: 0 22px;
  color: #fff;
  background: #000;
  font-weight: 800;
}

.primary-action:disabled {
  cursor: not-allowed;
  color: rgba(255, 255, 255, 0.72);
  background: #b9bcc3;
}

.secondary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(5, 5, 5, 0.14);
  font-weight: 800;
}

.home-link {
  min-height: 40px;
}

.icon-button {
  width: 40px;
  color: #fff;
  background: #000;
  border-color: #000;
  font-weight: 900;
}

.status-pill,
.mini-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #4f5156;
  background: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.status-pill {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(5, 5, 5, 0.1);
}

.status-pill[data-mode="offline"] {
  color: #9b3828;
  background: rgba(245, 82, 55, 0.1);
}

.workspace {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: clamp(18px, 2.4vw, 34px);
  max-width: 1560px;
  margin: 28px auto 0;
}

.node-panel {
  position: sticky;
  top: 20px;
  align-self: start;
  min-height: calc(100vh - 130px);
  padding: 16px;
  border: 1px solid rgba(5, 5, 5, 0.12);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.06);
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 4px 14px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.1);
  font-size: 13px;
  font-weight: 900;
}

.panel-title strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #fff;
  background: #000;
}

.node-list {
  display: grid;
  gap: 8px;
  padding-top: 14px;
}

.node-button {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 16px;
  color: #85878c;
  background: transparent;
  text-align: left;
}

.node-button.is-active {
  color: #000;
  background: #fff;
  border-color: #000;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.08);
}

.node-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #eceef2;
  font-size: 16px;
  font-weight: 900;
}

.node-button.is-active .node-index {
  color: #fff;
  background: #000;
}

.node-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.node-copy strong {
  overflow: hidden;
  font-size: 16px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-copy span {
  overflow: hidden;
  color: currentColor;
  font-size: 12px;
  line-height: 1.35;
  opacity: 0.75;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-area {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(5, 5, 5, 0.12);
  border-radius: 28px;
  background:
    radial-gradient(circle at 91% 12%, rgba(255, 200, 69, 0.22) 0 52px, transparent 53px),
    radial-gradient(circle at 82% 6%, rgba(229, 121, 219, 0.2) 0 34px, transparent 35px),
    rgba(255, 255, 255, 0.9);
  box-shadow: 0 26px 80px rgba(0, 0, 0, 0.07);
  padding: clamp(22px, 3vw, 42px);
}

.work-area::before,
.work-area::after {
  position: absolute;
  z-index: 0;
  content: "";
  pointer-events: none;
}

.work-area::before {
  top: 24px;
  right: 36px;
  width: 190px;
  height: 112px;
  border-radius: 56px 56px 18px 18px;
  background:
    linear-gradient(135deg, transparent 0 38%, var(--orange) 39% 56%, transparent 57%),
    linear-gradient(90deg, var(--blue) 0 34%, var(--green) 34% 64%, var(--yellow) 64%);
  opacity: 0.13;
  transform: rotate(-5deg);
}

.work-area::after {
  top: 56px;
  right: 200px;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--coral);
  opacity: 0.1;
}

.flow-strip,
.start-console,
.section-heading,
.form-grid {
  position: relative;
  z-index: 1;
}

.flow-strip {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 22px;
}

.flow-step {
  min-height: 54px;
  padding: 9px 10px;
  border: 1px solid rgba(5, 5, 5, 0.1);
  border-radius: 12px;
  color: #77797f;
  background: #f7f7f4;
}

.flow-step span {
  display: block;
  margin-bottom: 4px;
  color: var(--blue);
  font-size: 11px;
  font-weight: 900;
}

.flow-step strong {
  display: block;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-step.is-active {
  color: #fff;
  background: #000;
  border-color: #000;
}

.flow-step.is-active span {
  color: #fff;
}

.flow-step.is-queued {
  background: rgba(39, 37, 216, 0.06);
}

.flow-step.is-skipped {
  opacity: 0.45;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin: 28px 0 18px;
}

.form-grid {
  display: grid;
  gap: 20px;
}

.input-zone {
  min-width: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1180px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .node-panel {
    position: static;
    min-height: auto;
  }

  .node-list,
  .flow-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .app-shell {
    padding: 16px;
  }

  .topbar {
    align-items: stretch;
    flex-direction: column;
  }

  .brand-block {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .brand-mark {
    width: 34px;
    height: 34px;
  }

  .brand-block h1 {
    font-size: 23px;
  }

  .topbar-actions {
    justify-content: flex-start;
  }

  .work-area,
  .node-panel {
    border-radius: 20px;
    padding: 14px;
  }

  .node-list,
  .flow-strip {
    grid-template-columns: 1fr;
  }
}
</style>
