const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// 允许跨域
app.use(cors({ origin: '*' }));

// 托管静态文件
app.use(express.static('public'));

// 从单个 txt 文件读取随机图片链接（已修复 \r 问题）
const getRandomImage = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return reject(err);

      const lines = data
        .split(/\r?\n/)   // 兼容 Windows/Unix 换行
        .map(l => l.trim())
        .filter(Boolean);

      if (lines.length === 0) return reject(new Error('Empty file'));
      resolve(lines[Math.floor(Math.random() * lines.length)]);
    });
  });
};

// 读取目录下所有 txt 文件并合并后随机返回一条链接
const getRandomImageFromAllFiles = () => {
  return new Promise((resolve, reject) => {
    const dirPath = __dirname;
    fs.readdir(dirPath, (err, files) => {
      if (err) return reject(err);

      const txtFiles = files.filter(f => f.endsWith('.txt'));
      if (txtFiles.length === 0) return reject(new Error('No text files found'));

      const promises = txtFiles.map(f => getRandomImage(path.join(dirPath, f)));
      Promise.all(promises)
        .then(results => {
          const allImages = results.flat();
          resolve(allImages[Math.floor(Math.random() * allImages.length)]);
        })
        .catch(reject);
    });
  });
};

// 随机跳转（所有类别）
app.get('/random', async (req, res) => {
  try {
    const imageUrl = await getRandomImageFromAllFiles();
    res.redirect(imageUrl);
  } catch (e) {
    res.status(404).send('No images found');
  }
});

// 指定类别随机跳转
app.get('/:category', async (req, res) => {
  try {
    const imageUrl = await getRandomImage(path.join(__dirname, `${req.params.category}.txt`));
    res.redirect(imageUrl);
  } catch (e) {
    res.status(404).send('Category not found');
  }
});

// 默认文档
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;