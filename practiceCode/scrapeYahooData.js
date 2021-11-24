// Create an application that would allow us to scrape information 
// from Yahoo! Finance for a list of tickers on a given date. 
// The information should include:
// the full company name, year founded, number of employees and headquarters city and state. 
// It should also include the date and time, 
// previous close price, open price and market cap for the date provided. 
// This information needs to be stored in a database.


const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
//const request = require("request");
//const xpath = require("xpath");

(async () => {
    const browser = await puppeteer.launch({headless: false});

    const page = await browser.newPage();
    await page.goto("https://finance.yahoo.com/trending-tickers"); //open page

    await page.waitForSelector("#list-res-table"); //open link
    await page.click("#list-res-table > div.Ovx\\(a\\).Ovx\\(h\\)--print.Ovy\\(h\\).W\\(100\\%\\) > table > tbody > tr:nth-child(1) > td.Va\\(m\\).Ta\\(start\\).Pstart\\(6px\\).Pend\\(15px\\).Start\\(0\\).Pend\\(10px\\).simpTblRow\\:h_Bgc\\(\\$hoverBgColor\\).Pos\\(st\\).Bgc\\(\\$lv3BgColor\\).Z\\(1\\).Bgc\\(\\$lv2BgColor\\).Ta\\(start\\)\\!.Fz\\(s\\) > a");

    await page.waitForSelector("#quote-nav"); //open profile tab
    await page.click("#quote-nav > ul > li:nth-child(6) > a > span");

    const pageData01 = await page.evaluate(() => {
    return {
        html: document.documentElement.innerHTML,
          }  
        }) 

    let $ = cheerio.load(pageData01.html); // Load Page Data into cheerio
    let element = $("h1"); // get full company name
    console.log(element.text());

    $ = cheerio.load('<h3 class="Fz(m) Mb(10px)">Hello world</h3>');


    let element2 = $('h3.Fz(m)').text('Hello there!');
    console.log(element2.text());


  await browser.close();

})()
