/**
 * Puppeteer-based Unity Asset Store scraper
 * Extracts complete asset information including JavaScript-loaded content
 */

import { PuppeteerCrawler } from 'crawlee';
import puppeteerExtra from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

// Configure puppeteer-extra with stealth plugin
puppeteerExtra.use(stealthPlugin());

// Main scraping function
export async function scrapeAssetWithPuppeteer(url) {
  return new Promise((resolve, reject) => {
    let assetData = null;
    
    const crawler = new PuppeteerCrawler({
      launchContext: {
        launcher: puppeteerExtra,
        launchOptions: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--no-xshm'],
        },
      },
      maxRequestsPerCrawl: 1,
      requestHandler: async ({ request, page, log }) => {
        try {
          log.info(`Scraping: ${request.loadedUrl}`);
          
          // Wait for content to load
          await page.waitForSelector('h1', { timeout: 15000 });
          
          // Extract asset information using the working selectors from main.ts
          const descriptions = await extractDescriptionsPuppeteer(page);
          const asset = {
            id: extractIdFromUrl(request.loadedUrl),
            url: request.loadedUrl,
            title: await extractTitlePuppeteer(page),
            short_description: descriptions.short,
            long_description: descriptions.long,
            tags: await extractTagsPuppeteer(page),
            category: extractCategoryFromUrl(request.loadedUrl),
            price: await extractPricePuppeteer(page),
            images_count: await extractImageCountPuppeteer(page),
            videos_count: await extractVideoCountPuppeteer(page),
            rating: await extractRatingPuppeteer(page),
            reviews_count: await extractReviewsCountPuppeteer(page),
            review_breakdown: await extractReviewBreakdownPuppeteer(page),
            last_update: await extractLastUpdatePuppeteer(page),
            publisher: await extractPublisherPuppeteer(page),
            size: await extractSizePuppeteer(page),
            version: await extractVersionPuppeteer(page),
            favorites: await extractFavoritesPuppeteer(page)
          };
          
          log.info(`Successfully scraped: ${asset.title}`);
          assetData = asset;
        } catch (error) {
          log.error(`Error scraping ${request.loadedUrl}:`, error);
          reject(error);
        }
      },
    });
    
    crawler.run([url]).then(() => {
      if (assetData) {
        resolve(assetData);
      } else {
        reject(new Error('No data extracted'));
      }
    }).catch(reject);
  });
}

// Helper functions for extracting data from Puppeteer page (based on main.ts)
function extractIdFromUrl(url) {
  const match = url.match(/\/packages\/[^\/]+\/[^\/]+\/(\d+)/) || url.match(/-(\d+)$/);
  return match ? match[1] : null;
}

function extractCategoryFromUrl(url) {
  const match = url.match(/\/packages\/([^\/]+)\//);
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Unknown';
}

async function extractTitlePuppeteer(page) {
  try {
    return await page.$eval('.cfm2v', (el) => el.textContent.trim());
  } catch {
    try {
      return await page.$eval('h1', (el) => el.textContent.trim());
    } catch {
      return 'Unknown Title';
    }
  }
}

async function extractDescriptionsPuppeteer(page) {
  try {
    // Get all description elements with ._1rkJa class (short and long descriptions)
    const descriptions = await page.$$eval('._1rkJa', (elements) => 
      elements.map(el => el.innerHTML?.trim()).filter(text => text && text.length > 0)
    );
    
    if (descriptions.length >= 2) {
      // Return both descriptions when we have two elements
      return {
        short: descriptions[0] || 'No short description available',
        long: descriptions[1] || 'No long description available'
      };
    } else if (descriptions.length === 1) {
      // Only one description found - it's the long description, keep short empty
      return {
        short: '',
        long: descriptions[0]
      };
    }
  } catch {}
  
  try {
    // Fallback to meta description
    const metaDesc = await page.$eval('meta[name="description"]', (el) => el.getAttribute('content'));
    return {
      short: '',
      long: metaDesc
    };
  } catch {
    return {
      short: 'No short description available',
      long: 'No long description available'
    };
  }
}

async function extractTagsPuppeteer(page) {
  try {
    // Use the working selector from main.ts - get all tag elements
    const tags = await page.$$eval('._3JkgG ._15pcy', (elements) => 
      elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
    );
    return tags;
  } catch {
    // Fallback approach
    try {
      const tags = await page.$$eval('._15pcy', (elements) => 
        elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
      );
      return tags;
    } catch {
      return [];
    }
  }
}

async function extractPricePuppeteer(page) {
  try {
    const priceText = await page.$eval('._223RA', (el) => el.textContent);
    if (priceText.toLowerCase().includes('free')) {
      return 0;
    }
    const match = priceText.match(/\$?([\d,]+\.?\d*)/);
    return match ? parseFloat(match[1].replace(',', '')) : null;
  } catch {
    return null;
  }
}

async function extractImageCountPuppeteer(page) {
  try {
    const screenshots = await page.$$('._10GvD > .screenshot');
    return screenshots.length;
  } catch {
    return 0;
  }
}

async function extractVideoCountPuppeteer(page) {
  try {
    const videos = await page.$$('._10GvD > .youtube');
    return videos.length;
  } catch {
    return 0;
  }
}

async function extractRatingPuppeteer(page) {
  try {
    const rating = await page.$eval('._31fUb', (el) => el.getAttribute('data-rating'));
    return rating ? parseFloat(rating) : null;
  } catch {
    return null;
  }
}

async function extractReviewsCountPuppeteer(page) {
  try {
    const reviewsText = await page.$eval('._31fUb > .NoXio', (el) => el.textContent);
    const match = reviewsText.match(/([\d,]+)/);
    return match ? parseInt(match[1].replace(',', '')) : 0;
  } catch {
    return 0;
  }
}

async function extractLastUpdatePuppeteer(page) {
  try {
    return await page.$eval('.product-date > .SoNzt', (el) => el.textContent.trim());
  } catch {
    return null;
  }
}

async function extractPublisherPuppeteer(page) {
  try {
    return await page.$eval('.U9Sw1', (el) => el.textContent.trim());
  } catch {
    return 'Unknown Publisher';
  }
}

async function extractSizePuppeteer(page) {
  try {
    return await page.$eval('.product-size > .SoNzt', (el) => el.textContent.trim());
  } catch {
    return null;
  }
}

async function extractVersionPuppeteer(page) {
  try {
    return await page.$eval('.product-version > .SoNzt', (el) => el.textContent.trim());
  } catch {
    return null;
  }
}

async function extractFavoritesPuppeteer(page) {
  try {
    const favText = await page.$eval('._3EMPt', (el) => el.textContent.trim());
    const match = favText.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  } catch {
    return null;
  }
}

async function extractReviewBreakdownPuppeteer(page) {
  try {
    // First try to navigate to the reviews section
    try {
      await page.click('a[href*="#reviews"]');
      // Use page.evaluate with setTimeout instead of waitForTimeout
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
    } catch (e) {
      console.log('Could not navigate to reviews section:', e.message);
    }
    
    // Try to extract review breakdown from the page
    const reviewData = await page.evaluate(() => {
      const breakdown = {
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0
      };
      
      // Get all text content from the page
      const fullText = document.documentElement.textContent || document.documentElement.innerText || '';
      
      // Log sample for debugging
      console.log('Sample text content:', fullText.substring(0, 3000));
      
      // Look for rating patterns based on the fetch_webpage result
      // Try the exact pattern we saw: "5 star123 4 star21 3 star7 2 star4 1 star0"
      const combinedPattern = /5\s*star(\d+).*?4\s*star(\d+).*?3\s*star(\d+).*?2\s*star(\d+).*?1\s*star(\d+)/gi;
      let match = fullText.match(combinedPattern);
      
      if (match) {
        const detailMatch = match[0].match(/5\s*star(\d+).*?4\s*star(\d+).*?3\s*star(\d+).*?2\s*star(\d+).*?1\s*star(\d+)/i);
        if (detailMatch) {
          breakdown.five_star = parseInt(detailMatch[1]) || 0;
          breakdown.four_star = parseInt(detailMatch[2]) || 0;
          breakdown.three_star = parseInt(detailMatch[3]) || 0;
          breakdown.two_star = parseInt(detailMatch[4]) || 0;
          breakdown.one_star = parseInt(detailMatch[5]) || 0;
          console.log('Found combined pattern:', breakdown);
          return breakdown;
        }
      }
      
      // If combined pattern doesn't work, try individual patterns
      const individualPatterns = [
        { regex: /(\d+)\s*5\s*stars?|5\s*stars?\s*(\d+)/gi, field: 'five_star' },
        { regex: /(\d+)\s*4\s*stars?|4\s*stars?\s*(\d+)/gi, field: 'four_star' },
        { regex: /(\d+)\s*3\s*stars?|3\s*stars?\s*(\d+)/gi, field: 'three_star' },
        { regex: /(\d+)\s*2\s*stars?|2\s*stars?\s*(\d+)/gi, field: 'two_star' },
        { regex: /(\d+)\s*1\s*stars?|1\s*stars?\s*(\d+)/gi, field: 'one_star' }
      ];
      
      individualPatterns.forEach(pattern => {
        const matches = [...fullText.matchAll(pattern.regex)];
        for (let match of matches) {
          const count = parseInt(match[1] || match[2]);
          if (count && count > 0) {
            breakdown[pattern.field] = Math.max(breakdown[pattern.field], count);
          }
        }
      });
      
      // Also search for JSON data that might contain rating information
      try {
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
          if (script.textContent && script.textContent.includes('rating')) {
            const scriptText = script.textContent;
            // Look for JSON-like structures
            const jsonMatches = scriptText.match(/\{[^}]*rating[^}]*\}/gi);
            if (jsonMatches) {
              console.log('Found potential rating data in script:', jsonMatches[0].substring(0, 200));
            }
          }
        }
      } catch {}
      
      console.log('Final breakdown extracted:', breakdown);
      return breakdown;
    });
    
    return reviewData;
    
  } catch (error) {
    console.log('Error extracting review breakdown:', error.message);
    return {
      five_star: 0,
      four_star: 0,
      three_star: 0,
      two_star: 0,
      one_star: 0
    };
  }
}