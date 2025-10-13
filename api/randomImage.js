const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// 使用cors中间件
app.use(cors({
  origin: '*'
  // 或者指定特定的域名
  // origin: 'https://www.api1.link'
}));

// Serve static files from the public directory
app.use(express.static('public'));

// 从指定文件中获取随机图像链接的函数
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

// 从所有文本文件中随机获取图片链接的函数
const getRandomImageFromAllFiles = () => {
  return new Promise((resolve, reject) => {
    const dirPath = path.join(__dirname);
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        if (txtFiles.length === 0) {
          reject(new Error('No text files found'));
        } else {
          const promises = txtFiles.map(file => getRandomImage(path.join(dirPath, file)));
          Promise.all(promises)
            .then(results => {
              const allImages = results.flat();
              const randomImage = allImages[Math.floor(Math.random() * allImages.length)];
              resolve(randomImage);
            })
            .catch(reject);
        }
      }
    });
  });
};

// 所有类别随机图像的路由
app.get('/random', async (req, res) => {
  try {
    const imageUrl = await getRandomImageFromAllFiles();
    res.redirect(imageUrl);
  } catch (error) {
    res.status(404).send('No images found');
  }
});

// Default route to serve the documentation
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 指定类别随机图像的路由
app.get('/:category', async (req, res) => {
  const category = req.params.category;
  const filePath = path.join(__dirname, `${category}.txt`);

  try {
    const imageUrl = await getRandomImage(filePath);
    res.redirect(imageUrl);
  } catch (error) {
    res.status(404).send('Category not found');
  }
});

module.exports = app;
