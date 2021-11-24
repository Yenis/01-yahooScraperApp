const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');

async function getPriceFeed() {
    try {
        const siteUrl = 'https://coinmarketcap.com/'

        const data = await axios({
            method: "GET",
            url: siteUrl,
        })
//        console.log(data.data) // We got the entire html string, now we pass it into cheerio

        const $ = cheerio.load(data.data); // OK its loaded and now we pass it some CSS selectors
        const elementSelector = '#__next > div > div.main-content > div.sc-57oli2-0.comDeo.cmc-body-wrapper > div > div:nth-child(1) > div.h7vnx2-1.bFzXgL > table > tbody > tr'

        const keys = [
            'rank',
            'name',
            'price',
            'change24h',
            'change7d',
        ]
        const dataArray = [];

        $(elementSelector).each((parentIndex, parentElement) => {
            let keyIndex = 0
            const dataObject = {
     
            }
    
            $(parentElement).children().each((childIndex, childElement) => {
                let tdValue = $(childElement).text(); // value inside td tag

                if (keyIndex === 1 || keyIndex === 6) {
                    tdValue = ($('p:first-child', $(childElement).html()).text());
                } // Used to seperate Bitcoin_1_BTC because theyre in the same selector
    
                if (tdValue) {
                  dataObject[keys[keyIndex]] = tdValue;
                  keyIndex++;
                }
            })
            dataArray.push(dataObject);

          })
          console.log(dataArray);
    
        } catch (error) {
        console.error(error);
    }
}

getPriceFeed();
