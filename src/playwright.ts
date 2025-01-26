import { type Browser, type Page, chromium } from '@playwright/test';
import type { InputSchema } from '.';

export const getBrowser = async (): Promise<Browser> => {
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--disable-web-security',
      '--disable-setuid-sandbox',
      '--single-process',
    ],
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    chromiumSandbox: false,
  });
};

export const getPage = async (browser: Browser): Promise<Page> => {
  try {
    console.log('Creating browser context...');
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
      bypassCSP: true,
    });

    console.log('Creating new page...');
    const page = await context.newPage();

    return page;
  } catch (error) {
    console.error('Failed to create page:', error);
    throw error;
  }
};

export const login = async (
  page: Page,
  loginId: string,
  loginPw: string,
): Promise<void> => {
  try {
    console.log('Waiting for login...');

    await page.goto('https://id.jobcan.jp/users/sign_in');
    await page.fill('#user_email', loginId);
    await page.fill('#user_password', loginPw);
    await page.click('#login_button');
  } catch (error) {
    console.log('Failed to login');
    throw error;
  }
};

export const moveToInputAttendancePage = async (page: Page): Promise<void> => {
  try {
    console.log('Waiting for move to input attendance page...');

    // 勤怠管理ページのURLを取得して移動
    const attendanceUrl = await page
      .locator('xpath=/html/body/div[1]/header/nav/div/div[2]/ul/li[3]/a')
      .getAttribute('href');
    if (!attendanceUrl) throw new Error('Failed to get attendance URL');
    await page.goto(attendanceUrl);

    // 勤怠修正ボタンをクリック
    await page
      .locator('xpath=/html/body/div/div/nav/div[2]/div/div[1]/a')
      .click();

    // 月次勤怠修正ボタンをクリック
    await page
      .locator('xpath=/html/body/div/div/nav/div[2]/div/div[1]/div/a[2]')
      .click();

    // 年月選択フォームが表示されるまで待機
    await page.waitForSelector(
      'xpath=/html/body/div/div/div[2]/main/div/div/div/h5/div/form/div/div[2]/select[1]',
    );
    await page.waitForSelector(
      'xpath=/html/body/div/div/div[2]/main/div/div/div/h5/div/form/div/div[2]/select[2]',
    );
  } catch (error) {
    console.error('Failed to move to input attendance page');
    throw error;
  }
};

export const selectYear = async (page: Page, year: number): Promise<void> => {
  try {
    console.log('Waiting for input year...');

    await page
      .locator(
        'xpath=/html/body/div/div/div[2]/main/div/div/div/h5/div/form/div/div[2]/select[1]',
      )
      .selectOption(year.toString());
  } catch (error) {
    console.error('Failed to select year');
    throw error;
  }
};

export const selectMonth = async (page: Page, month: number): Promise<void> => {
  try {
    console.log('Waiting for input month...');

    await page
      .locator(
        'xpath=/html/body/div/div/div[2]/main/div/div/div/h5/div/form/div/div[2]/select[2]',
      )
      .selectOption(month.toString());
  } catch (error) {
    console.error('Failed to select month');
    throw error;
  }
};

export const clearAttendance = async (page: Page): Promise<void> => {
  try {
    console.log('Waiting for clear attendance...');

    await page.waitForSelector('.form-type-time');
    const timeInputs = await page.locator('.form-type-time').all();
    // Promise.allでやると一部反映されないことがあるため、for文で行う
    for (const input of timeInputs) {
      await input.clear();
    }
  } catch (error) {
    console.error('Failed to clear attendance');
    throw error;
  }
};

export const inputAttendance = async (
  page: Page,
  attendances: InputSchema['attendances'],
): Promise<void> => {
  try {
    console.log('Waiting for input attendance...');

    await page.waitForSelector('.form-type-time');
    const timeInputs = await page.locator('.form-type-time').all();

    for (const attendance of attendances) {
      const day = new Date(attendance.date).getDate();
      const index = (day - 1) * 3;

      if (timeInputs[index]) {
        await timeInputs[index].fill(attendance.start_time);
      }
      if (timeInputs[index + 1]) {
        await timeInputs[index + 1].fill(attendance.end_time);
      }
      if (timeInputs[index + 2]) {
        await timeInputs[index + 2].fill(attendance.break_time);
      }
    }
  } catch (error) {
    console.log('Failed to input attendance');
    throw error;
  }
};

export const saveAttendance = async (page: Page): Promise<void> => {
  try {
    console.log('Waiting for save attendance...');

    await page.waitForSelector(
      'xpath=/html/body/div/div/div[2]/main/div/div/div/div[2]/form/div[1]/div[2]/div[1]',
    );
    // 保存ボタンをクリック
    await page
      .locator(
        'xpath=/html/body/div/div/div[2]/main/div/div/div/div[2]/form/div[1]/div[2]/div[1]',
      )
      .click();
  } catch (error) {
    console.error('Failed to save attendance');
    throw error;
  }
};
