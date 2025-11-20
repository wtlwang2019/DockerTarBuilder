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
        // 等待 10 秒，直到页面高度发生变化，或者超时
        await page.waitForFunction(
          (prevHeight) => document.body.scrollHeight > prevHeight,
          { timeout: 10000 },
          previousHeight
        );
      } catch (error) {
        // 如果 waitForFunction 超时，说明在 10 秒内页面高度没有变化，认为已到底部
        console.log('等待页面高度变化超时，已滚动到底部或内容加载完成。');
        break;
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
    page.setDefaultNavigationTimeout(60000);
    await page.setViewport({ width: 800, height: 600 });
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
    await autoScrollToBottom(page);
    await page.pdf({
    path: 'output/webpage.pdf',
    format: 'A4',
    // landscape: true,
    scale: 0.8,
    printBackground: true
    });
    await browser.close();
})();





