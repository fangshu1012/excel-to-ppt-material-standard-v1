<template>
  <div class="cover-shell">
    <section class="cover-page" aria-label="标品输入输出自动化封面">
      <header class="site-header">
        <a class="brand" href="#" aria-label="标品自动化首页">
          <span class="brand-symbol" aria-hidden="true"></span>
          <span class="brand-divider">/</span>
          <span class="brand-name">standard@workflow.ai</span>
        </a>

        <nav class="nav-links" aria-label="页面导航">
          <a href="#platform">Platform</a>
          <span aria-hidden="true">.</span>
          <a href="#workflow">Workflow</a>
          <span aria-hidden="true">.</span>
          <a href="#output">Output</a>
        </nav>

        <div class="header-actions">
          <span>7 Nodes</span>
          <a class="outline-button" href="#" @click.prevent="goToWorkflow">
            Start
            <span aria-hidden="true">↘</span>
          </a>
        </div>
      </header>

      <div class="hero-grid" id="platform">
        <div class="hero-title">
          <p class="kicker">Product Data Automation</p>
          <h1>
            标品输入<br />
            输出自动化
          </h1>
        </div>

        <div class="hero-copy">
          <span class="slash" aria-hidden="true">/</span>
          <p>从供应商资料到推品表与展示PPT，压缩成一条可选择起点的自动化流程。</p>
          <a class="solid-button" href="#" @click.prevent="goToWorkflow">
            Start
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <section class="stage" id="workflow" aria-label="自动化流程预览">
        <div class="stage-art" aria-hidden="true">
          <div class="sun"></div>
          <div class="cloud cloud-one"></div>
          <div class="cloud cloud-two"></div>
          <div class="figure">
            <div class="head"></div>
            <div class="hair"></div>
            <div class="torso"></div>
            <div class="arm arm-left"></div>
            <div class="arm arm-right"></div>
            <div class="leg"></div>
          </div>
          <div class="blocks">
            <span class="block block-black"></span>
            <span class="block block-blue"></span>
            <span class="block block-orange"></span>
            <span class="block block-green"></span>
          </div>
          <div class="plant plant-one"></div>
          <div class="plant plant-two"></div>
        </div>

        <ol class="workflow-list" aria-label="流程节点">
          <li v-for="(node, index) in nodes" :key="index" @click="selectNode(index)">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            {{ node.name }}
          </li>
        </ol>
      </section>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['start'])

const nodes = ref([
  { name: '提取数据', description: '上传PPT/PDF/图片，AI识别产品信息' },
  { name: '飞书上传', description: '上传到多维表格' },
  { name: '图片处理', description: '裁切与扩图' },
  { name: '数据清理', description: '清洗处理数据' },
  { name: '生成Excel', description: '推品表格输出' },
  { name: '生成PPT', description: '占位符模板替换' },
  { name: 'PPT价格修改', description: '核心价改供货价' }
])

const selectNode = (index) => {
  emit('start', index)
}

const goToWorkflow = () => {
  emit('start', 0)
}
</script>

<style scoped>
.cover-shell {
  display: grid;
  min-height: 100vh;
  padding: 0;
  place-items: center;
}

.cover-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  padding: clamp(16px, 2vw, 28px) clamp(24px, 5vw, 80px) clamp(16px, 2vw, 28px);
  background: var(--paper);
}

.site-header,
.brand,
.nav-links,
.header-actions,
.hero-copy {
  display: flex;
  align-items: center;
}

.site-header {
  justify-content: space-between;
  gap: 24px;
  font-size: clamp(13px, 1.05vw, 18px);
  line-height: 1;
}

.brand {
  gap: 16px;
  min-width: 248px;
  font-weight: 700;
  color: inherit;
  text-decoration: none;
}

.brand-symbol {
  position: relative;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
}

.brand-symbol::before,
.brand-symbol::after {
  position: absolute;
  inset: 15px 0;
  content: "";
  background: var(--ink);
  transform: rotate(0deg);
}

.brand-symbol::after {
  transform: rotate(90deg);
}

.brand-symbol {
  background:
    linear-gradient(var(--ink), var(--ink)) center / 7px 38px no-repeat,
    linear-gradient(var(--ink), var(--ink)) center / 38px 7px no-repeat;
  transform: rotate(45deg);
}

.brand-divider,
.slash {
  font-weight: 800;
}

.nav-links {
  gap: 13px;
  justify-content: center;
  flex: 1;
  font-weight: 600;
}

.nav-links a {
  color: inherit;
  text-decoration: none;
}

.header-actions {
  gap: 18px;
  justify-content: flex-end;
  min-width: 238px;
}

.outline-button,
.solid-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 48px;
  padding: 0 28px;
  border-radius: 999px;
  font-weight: 800;
  white-space: nowrap;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.outline-button {
  border: 1.5px solid var(--line);
  background: transparent;
}

.solid-button {
  height: 46px;
  min-width: 126px;
  color: #fff;
  background: #000;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.82fr) minmax(360px, 1fr);
  gap: clamp(24px, 4vw, 80px);
  align-items: end;
  margin: clamp(24px, 4vh, 48px) auto 0;
  max-width: 1220px;
}

.kicker {
  margin: 0 0 18px;
  color: var(--muted);
  font-size: clamp(12px, 0.9vw, 14px);
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  max-width: 520px;
  font-size: clamp(52px, 5.25vw, 92px);
  font-weight: 600;
  letter-spacing: 0;
  line-height: 0.96;
}

.hero-copy {
  gap: clamp(28px, 4vw, 58px);
  padding-bottom: clamp(6px, 0.8vw, 12px);
}

.slash {
  font-size: clamp(36px, 3.8vw, 66px);
  line-height: 1;
}

.hero-copy p {
  width: min(300px, 100%);
  margin: 0;
  font-size: clamp(16px, 1.18vw, 20px);
  font-weight: 600;
  line-height: 1.28;
}

.stage {
  position: relative;
  min-height: clamp(310px, 32vw, 420px);
  margin: clamp(36px, 4.6vw, 58px) 0 0;
  overflow: hidden;
  border-radius: 34px 34px 34px 0;
  background: var(--soft);
}

.stage-art {
  position: absolute;
  inset: 0;
}

.sun {
  position: absolute;
  left: 11%;
  top: 14%;
  width: clamp(52px, 5.2vw, 78px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--yellow);
}

.cloud {
  position: absolute;
  height: 18px;
  border-radius: 999px;
  background: #fff;
  opacity: 0.92;
}

.cloud::before,
.cloud::after {
  position: absolute;
  bottom: 2px;
  content: "";
  border-radius: 50%;
  background: #fff;
}

.cloud::before {
  left: 24%;
  width: 32px;
  height: 24px;
}

.cloud::after {
  right: 18%;
  width: 44px;
  height: 30px;
}

.cloud-one {
  left: 5%;
  top: 28%;
  width: 260px;
}

.cloud-two {
  right: 7%;
  top: 12%;
  width: 150px;
}

.blocks {
  position: absolute;
  left: 0;
  bottom: 0;
  width: clamp(260px, 25vw, 390px);
  height: clamp(210px, 22vw, 320px);
}

.block {
  position: absolute;
  bottom: 0;
  display: block;
}

.block-black {
  left: 0;
  width: 26%;
  height: 58%;
  border-radius: 0 0 0 28px;
  background: #020213;
}

.block-blue {
  left: 15%;
  width: 38%;
  height: 78%;
  clip-path: polygon(0 24%, 100% 0, 100% 100%, 0 100%);
  background: var(--blue);
}

.block-orange {
  left: 38%;
  width: 26%;
  height: 42%;
  clip-path: polygon(0 38%, 50% 0, 100% 38%, 75% 38%, 75% 100%, 0 100%);
  background: var(--orange);
}

.block-green {
  left: 55%;
  width: 31%;
  height: 52%;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 42%, 26% 42%, 26% 0);
  background: var(--green);
}

.stage::before {
  position: absolute;
  left: -1%;
  top: 4%;
  width: 11%;
  height: 34%;
  border-radius: 0 0 90px 0;
  content: "";
  background: var(--pink);
}

.stage::after {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 28%;
  height: 19%;
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  content: "";
  background: var(--yellow);
}

.figure {
  position: absolute;
  left: 44%;
  top: 6%;
  width: clamp(210px, 24vw, 340px);
  height: clamp(230px, 25vw, 350px);
  transform: translateX(-50%);
}

.head {
  position: absolute;
  left: 43%;
  top: 2%;
  width: 36px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #9b3828;
}

.hair {
  position: absolute;
  left: 39%;
  top: 0;
  width: 42px;
  height: 28px;
  border-radius: 50% 50% 35% 45%;
  background: #1d1425;
}

.torso {
  position: absolute;
  left: 36%;
  top: 18%;
  width: 118px;
  height: 172px;
  border-radius: 72px 70px 12px 14px;
  background: var(--coral);
  transform: rotate(9deg);
}

.arm {
  position: absolute;
  top: 35%;
  height: 28px;
  border-radius: 999px;
  background: var(--coral);
}

.arm-left {
  left: 14%;
  width: 150px;
  transform: rotate(-19deg);
}

.arm-right {
  right: 2%;
  width: 148px;
  transform: rotate(35deg);
}

.leg {
  position: absolute;
  left: 32%;
  bottom: 0;
  width: 240px;
  height: 68px;
  border-radius: 999px 999px 999px 20px;
  background: var(--yellow);
  transform: rotate(-14deg);
}

.plant {
  position: absolute;
  right: 6%;
  bottom: 0;
  width: 70px;
  height: 126px;
  border-left: 4px solid var(--orange);
  transform-origin: bottom;
}

.plant::before,
.plant::after {
  position: absolute;
  top: 0;
  width: 54px;
  height: 38px;
  content: "";
  background: var(--green);
  clip-path: polygon(50% 0, 63% 39%, 100% 22%, 70% 58%, 98% 88%, 56% 76%, 35% 100%, 38% 60%, 0 55%, 38% 38%);
}

.plant::before {
  left: -38px;
}

.plant::after {
  left: 10px;
  transform: scale(0.85) rotate(18deg);
}

.plant-two {
  right: 1.5%;
  height: 86px;
  transform: scale(0.82);
}

.workflow-list {
  position: absolute;
  left: 50%;
  bottom: 32px;
  z-index: 3;
  display: flex;
  justify-content: center;
  gap: 12px;
  width: min(950px, calc(100% - 60px));
  margin: 0;
  padding: 16px 24px;
  list-style: none;
  transform: translateX(-50%);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.workflow-list li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 90px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8f9fa;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.workflow-list li:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.15);
}

.workflow-list span {
  color: var(--blue);
  font-size: 12px;
}

@media (max-width: 1180px) {
  .nav-links {
    display: none;
  }

  .hero-grid {
    grid-template-columns: 1fr;
    gap: 26px;
    margin-top: 76px;
  }

  .hero-copy {
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .hero-copy p {
    width: min(520px, 100%);
  }

  .prompt-card {
    width: min(720px, calc(100% - 56px));
  }

  .workflow-list {
    right: 24px;
    left: auto;
    width: min(420px, 46%);
    grid-template-columns: repeat(2, minmax(0, 1fr));
    transform: none;
  }
}

@media (max-width: 760px) {
  .cover-shell {
    padding: 0;
    place-items: stretch;
  }

  .cover-page {
    width: 100%;
    min-height: 100vh;
    padding: 24px 18px 30px;
  }

  .site-header {
    align-items: flex-start;
  }

  .brand {
    min-width: 0;
    gap: 10px;
  }

  .brand-name,
  .header-actions span {
    display: none;
  }

  .outline-button {
    height: 42px;
    padding: 0 18px;
  }

  h1 {
    max-width: 340px;
    font-size: clamp(48px, 13.8vw, 58px);
    line-height: 1.08;
  }

  .hero-grid {
    margin-top: 64px;
  }

  .hero-copy {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .solid-button {
    grid-column: 2;
    justify-self: start;
  }

  .stage {
    min-height: 560px;
    border-radius: 28px 28px 28px 0;
  }

  .figure {
    left: 58%;
    top: 5%;
    transform: translateX(-50%) scale(0.78);
  }

  .blocks {
    width: 250px;
    height: 230px;
  }

  .workflow-list {
    left: 16px;
    right: 16px;
    bottom: 18px;
    width: auto;
    padding: 12px 16px;
    overflow-x: auto;
  }
  
  .workflow-list li {
    min-width: 72px;
    padding: 8px 10px;
    font-size: 12px;
    flex-shrink: 0;
  }

  .plant-one,
  .plant-two {
    display: none;
  }
}
</style>

