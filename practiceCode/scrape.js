const axios = require('axios');     // Loading the dependencies. 
const cheerio = require('cheerio'); // Loading the dependencies. 

axios.get('https://www.forextradingbig.com/instaforex-broker-review/').then(response => {
  const html = response.data;      

  const $ = cheerio.load(html);
  const scrapedata = $('a', '.comment-bubble').text()
    console.log(scrapedata);

}).catch( error => {
   console.log(error);
}); 