import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { text, style, position, offset } = await request.json();

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true
    });
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 1080,
      height: 1920,
      deviceScaleFactor: 2
    });

    // Create HTML content with the hook text
    const html = `
      <html>
        <head>
          <style>
            :root {
              --color-bg: transparent;
              --color-highlight: #fff;
              --font: 'TikTok Display Medium', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            }
            
            @font-face {
              font-family: 'TikTok Display Medium';
              src: url('${path.join(process.cwd(), 'public/fonts/TikTokDisplay-Medium.ttf')}');
            }

            body {
              margin: 0;
              width: 1080px;
              height: 1920px;
              display: flex;
              align-items: ${position === 'top' ? 'flex-start' : position === 'middle' ? 'center' : 'flex-end'};
              justify-content: center;
              padding: ${position === 'top' ? '300px' : position === 'bottom' ? '300px' : '0px'} 0;
              background: var(--color-bg);
              font-family: var(--font);
            }

            h1 {
              width: 100%;
              text-align: center;
            }

            .goo {
              font-size: 75px;
              line-height: 1.2;
              display: inline;
              box-decoration-break: clone;
              background: var(--color-highlight);
              padding: 0.3rem 1.5rem 1rem 1.5rem;
              filter: url('#goo');
              transform: translateY(${offset}px);
              max-width: 85%;
              text-align: center;
              color: #000;
              font-weight: normal;
            }

            .goo:focus {
              outline: 0;
            }
          </style>
        </head>
        <body>
          <h1>
            <div class="goo">${text}</div>
          </h1>

          <svg style="visibility: hidden; position: absolute;" width="0" height="0" xmlns="http://www.w3.org/2000/svg" version="1.1">
            <defs>
              <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />    
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
              </filter>
            </defs>
          </svg>
        </body>
      </html>
    `;

    // Set content
    await page.setContent(html);

    // Take screenshot
    const screenshot = await page.screenshot({
      omitBackground: true,
      type: 'png'
    });

    // Close browser
    await browser.close();

    // Return the image
    return new NextResponse(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="hook-preview.png"'
      }
    });
  } catch (error) {
    console.error('Error generating hook preview:', error);
    return NextResponse.json({ error: 'Failed to generate hook preview' }, { status: 500 });
  }
} 