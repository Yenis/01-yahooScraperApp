const puppeteer = require('puppeteer');
puppeteer.launch({headless: false}).then(async browser => {

  // opening a new page and going to target url
  const page = await browser.newPage();
  await page.goto('https://partakefoods.com/products/birthday-cake-cookies-snack-pack');
  await page.waitForSelector('#shopify-section-product-related');

  // now the page is ready and has the info we need loaded
  // accessing the page content now
  let products = await page.evaluate(() => {
    let allProducts = document.body.querySelectorAll('#shopify-section-product-related .single-product-collection');

    // now lets store the product items into an array
    scrapedItemsArray = [];
    allProducts.forEach(element => {
      let productTitle = element.querySelector('h4');
      let productPrice = element.querySelector('.reg-price'); // access via class name

      scrapedItemsArray.push({
        productTitle: productTitle ? productTitle.innerText : null,
        productDescription: productPrice ? productPrice.innert : null,
      });
    });

    let items = {
      relatedProducts: scrapedItemsArray
    };

    return items;

  });

  // output of all scraped data
  console.log(products);

  //closing the browser
  await browser.close();
}).catch(function(e){
  console.log(e);
})

// adding the {headless: false} tag, recommended for development of a scraper
// so when the browser actually opens, we can se what is happening
// Makes debugging a lot easier