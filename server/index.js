const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

app.post('/api/feishu-sync', upload.single('file'), (req, res) => {
  const { feishuUrl } = req.body;
  const file = req.file;
  
  if (!feishuUrl || !file) {
    return res.status(400).json({ success: false, error: '缺少参数' });
  }

  const scriptPath = path.join(__dirname, '../feishu_excel_sync_api.py');
  const excelPath = file.path;
  
  const command = `python3 "${scriptPath}" "${feishuUrl}" "${excelPath}"`;
  
  exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('执行失败:', error);
      return res.json({ 
        success: false, 
        error: stderr || error.message,
        output: stdout 
      });
    }
    
    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch {
      res.json({
        success: true,
        output: stdout,
        error: stderr
      });
    }
  });
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});