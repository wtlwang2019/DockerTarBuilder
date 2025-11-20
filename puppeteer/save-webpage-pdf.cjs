const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function autoScrollToBottom(page) {
    // 滚动间隔（毫秒），避免滚动过快导致内容加载不及时
    const scrollDelay = 1000; 
    // 最大滚动次数（防止无限循环）
    const maxScrollTimes = 20; 
    // 初始页面高度
    let previousHeight = await page.evaluate('document.body.scrollHeight');
    let scrollTimes = 0;
    
    while (scrollTimes < maxScrollTimes) {
      // 模拟鼠标滚轮向下滚动（deltaY 为滚动距离，1000 足够触发懒加载）
      await page.mouse.wheel({ deltaY: 500 });
      // 等待内容加载
      // 等待一小段时间，让内容有机会加载。我们使用 waitForFunction 并设置一个明确的超时。
      try {
        // 等待 60 秒，直到页面高度发生变化，或者超时
        await page.waitForFunction(
          (prevHeight) => document.body.scrollHeight > prevHeight,
          { timeout: 3000 },
          previousHeight
        );
      } catch (error) {
        // 如果 waitForFunction 超时，说明在 60 秒内页面高度没有变化，认为已到底部
        console.log('等待页面高度变化超时，已滚动到底部或内容加载完成。');
      }
      
      // 如果 waitForFunction 成功，则页面高度已变化，更新 previousHeight
      previousHeight = await page.evaluate('document.body.scrollHeight');
      scrollTimes++;
      console.log('已滚动次数:', scrollTimes, '当前页面高度：', previousHeight);
    }
    
    if (scrollTimes >= maxScrollTimes) {
      console.warn('已达到最大滚动次数，可能未完全滚动到底部。');
    }                

} 
async function autoScrollToBottom2(page) {
  const scrollDelay = 1500; // 滚动后等待1.5秒（确保内容加载）
  const maxScrollTimes = 30; // 最大滚动次数（防止无限循环）
  let previousHeight = 0;
  let currentHeight = await page.evaluate(() => document.body.scrollHeight);
  let scrollTimes = 0;

  while (scrollTimes < maxScrollTimes && currentHeight > previousHeight) {
    previousHeight = currentHeight;
    
    // 模拟按 PageDown 键滚动
    await page.keyboard.press('PageDown');
    console.log('已按 PageDown 键: ', scrollTimes + 1, '次');
    
    // 等待内容加载
    await new Promise(resolve => setTimeout(resolve, scrollDelay));
    
    // 更新当前页面高度
    currentHeight = await page.evaluate(() => document.body.scrollHeight);
    scrollTimes++;
  }

  // 最后按 End 键确保滚动到底部
  await page.keyboard.press('End');
  console.log('已按 End 键，确保滚动到底部');
  
  if (scrollTimes >= maxScrollTimes) {
    console.warn('已达到最大滚动次数', maxScrollTimes, '可能未完全加载');
  }
}

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 500 });
  // 从环境变量中读取 URL
  const url = process.env.WEBPAGE_URL;
  if (!url) {
    console.error('错误：环境变量 WEBPAGE_URL 未设置');
    process.exit(1);
  }
  console.info('url 设置了');
  try {
    // 增加 timeout 时间，例如 60000 毫秒（60秒）
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
  } catch (error) {
    console.error('页面加载超时或失败:', error);
    await browser.close();
    process.exit(1);
  }
          
  // await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await autoScrollToBottom2(page);
  await page.pdf({
    path: 'output/webpage.pdf',
    format: 'A4',
    landscape: true,
    scale: 0.8,
    printBackground: true
  });
  await browser.close();
})();

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



