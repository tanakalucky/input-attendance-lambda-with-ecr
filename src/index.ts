import * as Sentry from '@sentry/aws-serverless';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Browser, Page } from 'playwright';
import { z } from 'zod';
import {
  clearAttendance,
  getBrowser,
  getPage,
  inputAttendance,
  login,
  moveToInputAttendancePage,
  saveAttendance,
  selectMonth,
  selectYear,
} from './playwright';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

export type InputSchema = z.infer<typeof schema>;
const schema = z.object({
  loginId: z.string().min(1),
  loginPw: z.string().min(1),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  attendances: z
    .object({
      date: z
        .string()
        .regex(
          /^\d{4}\/\d{2}\/\d{2}$/,
          'Invalid date format required YYYY/MM/DD',
        ),
      start_time: z.string(),
      end_time: z.string(),
      break_time: z.string(),
    })
    .array(),
});

export const handler: APIGatewayProxyHandlerV2<{
  statusCode: number;
  body: string;
}> = Sentry.wrapHandler(async (event) => {
  const startTime = Date.now();
  let browser: Browser | undefined;
  let page: Page | undefined;

  try {
    console.log('Handler started');
    const httpMethod = event.requestContext.http.method;
    if (httpMethod !== 'POST') {
      throw new Error('Method Not Allowed');
    }

    const body = event.body;

    if (!body) {
      throw new Error('Empty request body');
    }

    const parseData = JSON.parse(body);

    const result = schema.safeParse(parseData);

    if (result.error) {
      console.error('A validate error occured: ', result.error);
      throw new Error('Invalid request');
    }

    browser = await getBrowser();
    console.log(`Browser started: ${Date.now() - startTime}ms`);
    page = await getPage(browser);

    console.log(`Login started: ${Date.now() - startTime}ms`);
    await login(page, result.data.loginId, result.data.loginPw);

    console.log(
      `moveToInputAttendancePage started: ${Date.now() - startTime}ms`,
    );
    await moveToInputAttendancePage(page);

    console.log(`select year and month started: ${Date.now() - startTime}ms`);
    await selectYear(page, result.data.year);
    await selectMonth(page, result.data.month);

    console.log(`clear started: ${Date.now() - startTime}ms`);
    await clearAttendance(page);

    console.log(`input attendance started: ${Date.now() - startTime}ms`);
    await inputAttendance(page, result.data.attendances);

    console.log(`save attendance started: ${Date.now() - startTime}ms`);
    await saveAttendance(page);

    console.log(`Total execution time: ${Date.now() - startTime}ms`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Input attendance success.',
        executionTime: Date.now() - startTime,
      }),
    };
  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
});
