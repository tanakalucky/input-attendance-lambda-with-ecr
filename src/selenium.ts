import {
  Builder,
  By,
  type ThenableWebDriver,
  type WebDriver,
  until,
} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

import { Select } from 'selenium-webdriver/lib/select';
import type { InputSchema } from '.';

export const getDriver = async (): Promise<ThenableWebDriver> => {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--disable-dev-tools');
  options.addArguments('--no-zygote');
  options.addArguments('--single-process');
  options.addArguments('--remote-debugging-pipe');
  options.addArguments('--window-size=1920,1080');

  options.setBinaryPath(
    '/opt/chrome/chrome-headless-shell-linux64/chrome-headless-shell',
  );

  const serviceBuilder = new chrome.ServiceBuilder(
    '/opt/chrome-driver/chromedriver-linux64/chromedriver',
  );

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(serviceBuilder)
    .build();
};

export const moveToLoginPage = async (driver: WebDriver): Promise<void> => {
  console.log('Waiting for move to login page...');

  return driver.get('https://id.jobcan.jp/users/sign_in');
};

export const login = async (
  driver: WebDriver,
  loginId: string,
  loginPw: string,
): Promise<void> => {
  console.log('Waiting for login...');

  const loginIdInput = await driver.findElement(
    By.xpath("//*[@id='user_email']"),
  );
  await loginIdInput.sendKeys(loginId);

  const loginPwInput = await driver.findElement(
    By.xpath("//*[@id='user_password']"),
  );
  await loginPwInput.sendKeys(loginPw);

  const loginBtn = await driver.findElement(
    By.xpath("//*[@id='login_button']"),
  );
  await loginBtn.click();
};

export const moveToInputAttendancePage = async (
  driver: WebDriver,
): Promise<void> => {
  console.log('Waiting for move to input attendance page...');

  // Cannot change the tab in headless mode
  const attendanceUrl = await driver
    .findElement(By.xpath('/html/body/div[1]/header/nav/div/div[2]/ul/li[3]/a'))
    .getAttribute('href');
  await driver.get(attendanceUrl);

  const fixAttendanceBtn = await driver.findElement(
    By.xpath('/html/body/div/div/nav/div[2]/div/div[1]/a'),
  );
  await fixAttendanceBtn.click();

  const fixMonthAttendanceBtn = await driver.findElement(
    By.xpath('/html/body/div/div/nav/div[2]/div/div[1]/div/a[2]'),
  );
  await fixMonthAttendanceBtn.click();

  await driver.wait(
    until.elementLocated(
      By.xpath(
        '/html/body/div/div/div[2]/main/div/div/div/h5/div/form/div/div[2]/select[1]',
      ),
    ),
    5000,
  );
  await driver.wait(
    until.elementLocated(
      By.xpath(
        '/html/body/div/div/div[2]/main/div/div/div/h5/div/form/div/div[2]/select[2]',
      ),
    ),
    5000,
  );
};

export const selectYear = async (
  driver: WebDriver,
  year: number,
): Promise<void> => {
  console.log('Waiting for input year...');

  const selectElement = await driver.findElement(
    By.xpath(
      '/html/body/div/div/div[2]/main/div/div/div/h5/div/form/div/div[2]/select[1]',
    ),
  );
  const select = new Select(selectElement);
  await select.selectByValue(year.toString());
};

export const selectMonth = async (
  driver: WebDriver,
  month: number,
): Promise<void> => {
  console.log('Waiting for input month...');

  const selectElement = await driver.findElement(
    By.xpath(
      '/html/body/div/div/div[2]/main/div/div/div/h5/div/form/div/div[2]/select[2]',
    ),
  );
  const select = new Select(selectElement);
  await select.selectByValue(month.toString());
};

export const clearAttendance = async (driver: WebDriver): Promise<void> => {
  console.log('Waiting for clear attendance...');

  const timeInputs = await driver.findElements(By.className('form-type-time'));

  const promises = [];
  for (const timeInput of timeInputs) {
    promises.push(timeInput.clear());
  }

  await Promise.all(promises);
};

export const inputAttendance = async (
  driver: WebDriver,
  attendances: InputSchema['attendances'],
): Promise<void> => {
  console.log('Waiting for input attendance...');

  const timeInputs = await driver.findElements(By.className('form-type-time'));

  for (const attendance of attendances) {
    const day = new Date(attendance.date).getDate();

    const index = (day - 1) * 3;

    timeInputs[index]?.sendKeys(attendance.start_time);
    timeInputs[index + 1]?.sendKeys(attendance.end_time);
    timeInputs[index + 2]?.sendKeys(attendance.break_time);
  }
};

export const saveAttendance = async (driver: WebDriver): Promise<void> => {
  console.log('Waiting for save attendance...');

  const saveBtn = await driver.findElement(
    By.xpath(
      '/html/body/div/div/div[2]/main/div/div/div/div[2]/form/div[1]/div[2]/div[1]',
    ),
  );
  await driver.executeScript('arguments[0].click();', saveBtn);

  const alert = await driver.switchTo().alert();
  await alert.accept();
};
