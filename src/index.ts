import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { z } from 'zod';
import {
  clearAttendance,
  getDriver,
  inputAttendance,
  login,
  moveToInputAttendancePage,
  moveToLoginPage,
  saveAttendance,
  selectMonth,
  selectYear,
} from './selenium';

import * as Sentry from '@sentry/aws-serverless';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
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
  const httpMethod = event.requestContext.http.method;
  if (httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const body = event.body;

  if (!body) {
    console.error('Empty request body');

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request',
      }),
    };
  }

  const parseData = JSON.parse(body);

  const result = schema.safeParse(parseData);

  if (result.error) {
    console.error('A validate error occured: ', result.error);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request',
      }),
    };
  }

  let driver = undefined;

  try {
    driver = await getDriver();

    await moveToLoginPage(driver);

    await login(driver, result.data.loginId, result.data.loginPw);

    await moveToInputAttendancePage(driver);

    await selectYear(driver, result.data.year);
    await selectMonth(driver, result.data.month);

    await clearAttendance(driver);

    await inputAttendance(driver, result.data.attendances);

    await saveAttendance(driver);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Input attendance success.',
      }),
    };
  } catch (error) {
    console.error('An error occurred:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to input attendance',
      }),
    };
  } finally {
    if (driver) {
      console.log('Quitting the driver...');
      await driver.quit();
      console.log('Driver quit successfully.');
    }
  }
});
