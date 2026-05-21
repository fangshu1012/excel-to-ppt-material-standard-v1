export function generateHtmlContent(dataRows, imageMap) {
  const productPages = dataRows.map((item, index) => {
    const code = item['编号'] || '';
    const imgSrc = imageMap[code] || '';
    const name = item['名称'] || '';
    const specs = item['产品参数'] || '';
    const sellingPoint = item['一句话卖点'] || '';
    const marketPrice = item['市场价'] || '-';
    const supplyPrice = item['供货价报价'] || '-';
    const dropshipPrice = item['一件代发报价'] || '';
    const link = item['京东/天猫链接'] || '';

    return `
      <div class="page product-page">
        <div class="product-container">
          <div class="product-image-section">
            <div class="image-frame">
              ${imgSrc ? `<img src="${imgSrc}" alt="${name}" class="product-image" />` : '<div class="no-product-image">暂无产品图片</div>'}
            </div>
          </div>
          <div class="product-info-section">
            <h2 class="product-name">${name}</h2>
            <p class="product-code">产品编号: ${code}</p>
            ${sellingPoint ? `<p class="product-selling-point">${sellingPoint}</p>` : ''}
            ${specs ? `<div class="product-specs"><strong>产品参数:</strong><br>${specs}</div>` : ''}
            <div class="price-section">
              <div class="price-item">
                <span class="price-label">市场价</span>
                <span class="price-value market">${marketPrice !== '-' ? '¥' + marketPrice : '-'}</span>
              </div>
              <div class="price-item">
                <span class="price-label">供货价</span>
                <span class="price-value supply">${supplyPrice !== '-' ? '¥' + supplyPrice : '-'}</span>
              </div>
              ${dropshipPrice ? `
              <div class="price-item">
                <span class="price-label">一件代发</span>
                <span class="price-value dropship">¥${dropshipPrice}</span>
              </div>
              ` : ''}
            </div>
            ${link ? `<p class="product-link"><a href="${link}" target="_blank">查看详情 →</a></p>` : ''}
          </div>
        </div>
        <div class="page-nav">
          <button class="nav-btn" onclick="navigatePage(${index - 1})" ${index === 0 ? 'disabled' : ''}>‹</button>
          <span>${index + 1} / ${dataRows.length}</span>
          <button class="nav-btn" onclick="navigatePage(${index + 1})" ${index === dataRows.length - 1 ? 'disabled' : ''}>›</button>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>企业定制礼品系列精选</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: #f5f5f5;
      overflow: hidden;
    }
    
    .page {
      min-height: 100vh;
      width: 100vw;
      display: none;
      position: relative;
    }
    
    .page.active {
      display: block;
    }
    
    .cover-page {
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }
    
    .cover-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3Cpattern id='leaf-pattern' patternUnits='userSpaceOnUse' width='100' height='100'%3E%3Cpath d='M50 0 Q75 25 50 50 Q25 75 50 100 Q75 75 50 50 Q25 25 50 0' fill='%23d4d9de' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23leaf-pattern)'/%3E%3C/svg%3E");
    }
    
    .cover-content {
      position: relative;
      z-index: 1;
    }
    
    .cover-subtitle {
      font-size: 14px;
      color: #8892a0;
      letter-spacing: 8px;
      margin-bottom: 20px;
      text-transform: uppercase;
    }
    
    .cover-title {
      font-size: 48px;
      color: #c4a35a;
      font-weight: 300;
      margin-bottom: 10px;
      letter-spacing: 4px;
    }
    
    .cover-title-highlight {
      font-size: 64px;
      color: #a08030;
      font-weight: 700;
      margin-bottom: 30px;
      letter-spacing: 8px;
    }
    
    .cover-divider {
      width: 60px;
      height: 2px;
      background: #c4a35a;
      margin: 0 auto 30px;
    }
    
    .cover-slogan {
      font-size: 16px;
      color: #6c757d;
      margin-bottom: 60px;
      letter-spacing: 4px;
    }
    
    .cover-footer {
      font-size: 14px;
      color: #9ca3af;
      line-height: 2;
    }
    
    .product-page {
      background: #ffffff;
      padding: 40px 20px;
    }
    
    .product-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      align-items: center;
    }
    
    .product-image-section {
      display: flex;
      justify-content: center;
    }
    
    .image-frame {
      width: 100%;
      max-width: 480px;
      aspect-ratio: 4/3;
      background: #f8f9fa;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    
    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .no-product-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #adb5bd;
      font-size: 18px;
    }
    
    .product-info-section {
      padding: 20px;
    }
    
    .product-name {
      font-size: 32px;
      color: #2d3436;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .product-code {
      font-size: 14px;
      color: #6c757d;
      margin-bottom: 20px;
    }
    
    .product-selling-point {
      font-size: 16px;
      color: #495057;
      line-height: 1.6;
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-left: 4px solid #c4a35a;
      border-radius: 0 8px 8px 0;
    }
    
    .product-specs {
      font-size: 14px;
      color: #495057;
      line-height: 1.8;
      margin-bottom: 25px;
      padding: 15px;
      background: #fafafa;
      border-radius: 8px;
    }
    
    .price-section {
      display: flex;
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .price-item {
      display: flex;
      flex-direction: column;
    }
    
    .price-label {
      font-size: 12px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    
    .price-value {
      font-size: 28px;
      font-weight: 700;
    }
    
    .price-value.market {
      color: #6c757d;
    }
    
    .price-value.supply {
      color: #28a745;
    }
    
    .price-value.dropship {
      color: #17a2b8;
    }
    
    .product-link a {
      color: #c4a35a;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
    }
    
    .product-link a:hover {
      color: #a08030;
    }
    
    .page-nav {
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 20px;
      background: rgba(255, 255, 255, 0.95);
      padding: 12px 24px;
      border-radius: 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      color: #6c757d;
    }
    
    .nav-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #f5f5f5;
      border-radius: 50%;
      font-size: 20px;
      color: #6c757d;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .nav-btn:hover:not(:disabled) {
      background: #c4a35a;
      color: white;
    }
    
    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    .end-page {
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px;
      position: relative;
    }
    
    .end-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3Cpattern id='leaf-pattern-end' patternUnits='userSpaceOnUse' width='100' height='100'%3E%3Cpath d='M50 0 Q75 25 50 50 Q25 75 50 100 Q75 75 50 50 Q25 25 50 0' fill='%23d4d9de' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23leaf-pattern-end)'/%3E%3C/svg%3E");
    }
    
    .end-content {
      position: relative;
      z-index: 1;
    }
    
    .end-title {
      font-size: 48px;
      color: #c4a35a;
      font-weight: 300;
      margin-bottom: 20px;
      letter-spacing: 8px;
    }
    
    .end-slogan {
      font-size: 16px;
      color: #6c757d;
      margin-bottom: 50px;
      letter-spacing: 4px;
    }
    
    .end-button {
      padding: 14px 48px;
      background: #c4a35a;
      color: white;
      border: none;
      border-radius: 30px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .end-button:hover {
      background: #a08030;
      transform: translateY(-2px);
    }
    
    .controls {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 100;
    }
    
    .control-btn {
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 20px;
      font-size: 13px;
      color: #495057;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
    }
    
    .control-btn:hover {
      background: #c4a35a;
      color: white;
    }
    
    @media (max-width: 768px) {
      .product-container {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .cover-title {
        font-size: 28px;
      }
      
      .cover-title-highlight {
        font-size: 36px;
      }
      
      .product-name {
        font-size: 24px;
      }
      
      .price-section {
        flex-wrap: wrap;
        gap: 20px;
      }
      
      .page-nav {
        bottom: 20px;
        padding: 10px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="controls">
    <button class="control-btn" onclick="navigatePage(0)">首页</button>
    <button class="control-btn" onclick="navigatePage(currentPage + 1)">下一页</button>
  </div>

  <div class="page cover-page active" id="page-0">
    <div class="cover-content">
      <p class="cover-subtitle">PRODUCT CATALOG 2026</p>
      <h1 class="cover-title">企业定制礼品</h1>
      <h1 class="cover-title-highlight">系列精选</h1>
      <div class="cover-divider"></div>
      <p class="cover-slogan">专属定制 · 品质之选</p>
      <div class="cover-footer">
        <p>彼岸空间数字科技</p>
        <p>2026年5月</p>
      </div>
    </div>
    <div class="page-nav">
      <button class="nav-btn" disabled>‹</button>
      <span>1 / ${dataRows.length + 2}</span>
      <button class="nav-btn" onclick="navigatePage(1)">›</button>
    </div>
  </div>

  ${productPages}

  <div class="page end-page" id="page-${dataRows.length + 1}">
    <div class="end-content">
      <h1 class="end-title">感谢观看</h1>
      <p class="end-slogan">期待与您合作</p>
      <button class="end-button" onclick="navigatePage(0)">返回首页</button>
    </div>
    <div class="page-nav">
      <button class="nav-btn" onclick="navigatePage(${dataRows.length})">‹</button>
      <span>${dataRows.length + 2} / ${dataRows.length + 2}</span>
      <button class="nav-btn" disabled>›</button>
    </div>
  </div>

  <script>
    let currentPage = 0;
    const totalPages = ${dataRows.length + 2};

    function navigatePage(pageNum) {
      if (pageNum < 0 || pageNum >= totalPages) return;
      
      document.getElementById('page-' + currentPage).classList.remove('active');
      document.getElementById('page-' + pageNum).classList.add('active');
      currentPage = pageNum;
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') {
        navigatePage(currentPage - 1);
      } else if (e.key === 'ArrowRight') {
        navigatePage(currentPage + 1);
      }
    });
  </script>
</body>
</html>`;
}