
async function savePageAsMHTML_JS(url, outputPath) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    console.log(`正在加载页面: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    console.log('页面加载完成。');

    // 使用标准的 setTimeout 实现延迟，等待动态内容渲染
    console.log('等待动态内容渲染... (3秒)');
    await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒

    console.log('在浏览器中执行 JS 以生成 MHTML...');
    // 注入并执行JS来获取MHTML内容
    const mhtmlContent = await page.evaluate(async () => {
      // 检查浏览器是否支持这个实验性API
      if (typeof document.documentElement.convertToMHTML !== 'function') {
        throw new Error('当前浏览器不支持 convertToMHTML API');
      }
      
      // 调用浏览器内部方法生成 MHTML Blob
      const mhtmlBlob = await document.documentElement.convertToMHTML();

      // 将 Blob 转换为文本
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(mhtmlBlob, 'UTF-8');
      });
    });

    // 将MHTML内容写入文件
    console.log('正在将 MHTML 内容写入文件');
    fs.writeFileSync(outputPath, mhtmlContent, 'utf8');

    console.log(`成功保存 MHTML 文件到: ${path.resolve(outputPath)}`);

  } catch (error) {
    console.error('保存 MHTML 时发生错误:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// --- 使用示例 ---
const targetUrl = process.env.WEBPAGE_URL;
const outputPath = 'output/webpage.mhtml';

// savePageAsMHTML_JS(targetUrl, outputPath)
//   .then(() => {
//     // 当异步函数成功完成时执行
//     console.log('网页已成功保存。');
//   })
//   .catch((error) => {
//     // 当异步函数内部抛出错误时执行
//     console.error('保存网页时发生错误:', error);
//   });

// // 注意：这行代码会立即执行，不会等待上面的异步操作完成
// console.log('保存任务已启动...');


// ================== mhtml1 ======================================

// (async () => {
//   const browser = await puppeteer.launch({headless: true});
//   const page = await browser.newPage();
//   const targetUrl = process.env.WEBPAGE_URL;
//   await page.goto(targetUrl, {waitUntil: 'networkidle2'});

//   // CDP 命令获取 MHTML
//   const client = await page.target().createCDPSession();
//   const {data} = await client.send('Page.captureSnapshot', {});

//   // const fs = require('fs');
//   fs.writeFileSync('output/webpage.mhtml', data, 'utf8');

//   await browser.close();
// })();


// ================== mhtml2 ======================================
// puppeteer-mhtml-first-iframe.js

(async () => {
  // 1️⃣ 启动浏览器
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // 2️⃣ 打开包含 iframe 的页面
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    
  // 3️⃣ 等待页面出现第一个 iframe（如果页面里有多个，可自行改为更具体的 selector）
  const iframeHandle = await page.waitForSelector('iframe', { timeout: 15000 });
  if (!iframeHandle) {
    console.error('❌ 页面中未找到任何 iframe');
    await browser.close();
    return;
  }

  // 4️⃣ 通过 contentFrame() 直接拿到子帧对象
  const targetFrame = await iframeHandle.contentFrame();
  if (!targetFrame) {
    console.error('❌ contentFrame() 返回 null，iframe 可能尚未加载完成');
    await browser.close();
    return;
  }

  // 5️⃣ 同源检查（跨域 iframe 无法使用 CDP）
  const mainOrigin = new URL(page.url()).origin;
  const iframeUrl = targetFrame.url();               // 已经是加载完成后的 URL
  const iframeOrigin = new URL(iframeUrl).origin;
  if (mainOrigin !== iframeOrigin) {
    console.warn(`❌ iframe 为跨域 (${iframeOrigin})，无法直接在子帧上使用 CDP`);
    console.warn('   请改用方案 B（单独打开 iframe src）');
    const iframeSrc = iframeUrl;
    console.log('✅ 找到 iframe src:', iframeSrc);
    
    // 3️⃣ 在新页面打开该 src
    const iframePage = await browser.newPage();
    await iframePage.goto(iframeSrc, { waitUntil: 'networkidle2' });
    // 4️⃣ 等待表格渲染（同样需要根据实际 selector 调整）
    const TABLE_SELECTOR = 'table';
    await iframePage.waitForSelector(TABLE_SELECTOR, { timeout: 15000 });
    
    // 检查是否已有行
    const hasRows = await iframePage.evaluate((sel) => {
        const tbl = document.querySelector(sel);
        if (!tbl) return false;
        return tbl.querySelectorAll('tbody tr, tr:not(:has(thead))').length > 0;
        }, TABLE_SELECTOR);
    
    if (!hasRows) {
        console.warn('⚠️ 表格仍为空，尝试滚动...');
        await autoScroll(iframePage);
    }
    
    // 5️⃣ 抓取 MHTML（此时只针对 iframe 页面本身）
    const client = await iframePage.target().createCDPSession();
    const { data: mhtml } = await client.send('Page.captureSnapshot', {
        format: 'mhtml'
    });
    
    // 6️⃣ 保存为独立文件
    fs.writeFileSync('output/cross-iframe-table.mhtml', mhtml, 'utf8');
    console.log('✅ 跨域 iframe 表格已保存为 cross-iframe-table.mhtml');
    
    await browser.close(); 
    return
  }

  // 6️⃣ 在子帧内部等待表格渲染完成
  const TABLE_SELECTOR = 'table';   // 根据实际页面自行调整
  await targetFrame.waitForSelector(TABLE_SELECTOR, { timeout: 15000 });

  // 7️⃣ 确认表格已有数据行（防止只渲染空表格）
  const hasRows = await targetFrame.evaluate((sel) => {
    const tbl = document.querySelector(sel);
    if (!tbl) return false;
    // 统计 <tbody> 中的 <tr>，或直接统计所有非 thead 的 <tr>
    return tbl.querySelectorAll('tbody tr, tr:not(:has(thead))').length > 0;
  }, TABLE_SELECTOR);

  if (!hasRows) {
    console.warn('⚠️ 表格仍为空，尝试滚动或等待更多时间...');
    await autoScroll(targetFrame);
  }

  // 8️⃣ 为子帧创建 CDP 会话并抓取 MHTML
  const client = await targetFrame._client;   // 同源帧才有此属性
  const { data: mhtml } = await client.send('Page.captureSnapshot', {
    format: 'mhtml'   // 明确声明，兼容性更好
  });

  // 9️⃣ 保存为本地文件
  const outFile = 'first-iframe-table.mhtml';
  fs.writeFileSync(outFile, mhtml, 'utf8');
  console.log(`✅ MHTML 已保存为 ${outFile}`);

  // 10️⃣ 关闭浏览器
  await browser.close();
})();

/**
 * 自动滚动（适用于懒加载/分页的表格）
 * @param {import('puppeteer').Frame} frame
 */
async function autoScroll(frame) {
  await frame.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 200;
      const timer = setInterval(() => {
        const { scrollHeight } = document.body;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
