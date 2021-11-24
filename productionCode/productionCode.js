// Create an application that would allow us to scrape information 
// from Yahoo! Finance for a list of tickers on a given date. 
// The information should include:
// the full company name, year founded, number of employees and headquarters city and state. 
// It should also include the date and time, 
// previous close price, open price and market cap for the date provided. 
// This information needs to be stored in a database.

// Number of required data fields : 7
// Full Company Name
// Year Founded
// Number of Employees
// HQ City and State
// Previous Close Price     -FOR-THE-PROVIDED-DATE- 
// Open Price               -FOR-THE-PROVIDED-DATE- 
// Market Cap               -FOR-THE-PROVIDED-DATE- 
//
// DATE                     -PROVIDED-BY-THE-USER- 

const axios = require('axios');
const cheerio = require('cheerio');

const {MongoClient} = require('mongodb');
const mongoose = require('mongoose');

let providedDate = '19.11.2021.' // GET DATE LATER
let descriptionString = '';

const tickersLISTdataArray = [];
let companyOpeningPageDataArray = [];
let companyProfileTabDataArray = [];
let companyHistoryTabDataArray = [];
let companyGooglePageDataArray = [];  // REMOVE THIS METHOD OF GETTING DATA, LATER

async function getTickersData() {
    try {
        const siteUrl = 'https://finance.yahoo.com/trending-tickers'
        const data = await axios({
            method: "GET",
            url: siteUrl,
        })
//        console.log(data.data) // OK, we have the entire html string, now we pass it into cheerio

        let $ = cheerio.load(data.data); // OK its loaded and now we pass it some CSS selectors
        let elementSelector = 'tr.simpTblRow'

        let keys = [
            'symbol',
            'companyName',
            'lastPrice',
            'marketTime',
            'change',
            'changePercent',
            'volume',
            'marketCap',
        ];

        $(elementSelector).each((parentIndex, parentElement) => {
            let keyIndex = 0
            let dataObject = {}

            $(parentElement).children().each((childIndex, childElement) => {
                let tdValue = $(childElement).text(); // value inside td tag

                if (tdValue) {
                    dataObject[keys[keyIndex]] = tdValue;
                    keyIndex++;
                }
            })
            tickersLISTdataArray.push(dataObject);
        }) 

if (tickersLISTdataArray.length) { // BIG IF CONTROL BLOCK
    console.log("\nAccess to Yahoo Finance Tickers List Status: ONLINE");

//        console.log(tickersLISTdataArray);

        console.log("\nSample Data: tickersLISTdataArray[0].companyName: " + tickersLISTdataArray[0].companyName)
        console.log("Sample Data: tickersLISTdataArray[0].lastPrice: " + tickersLISTdataArray[0].lastPrice)

        console.log("\nSample Data: tickersLISTdataArray[3].companyName: " + tickersLISTdataArray[3].companyName)
        console.log("Sample Data: tickersLISTdataArray[3].symbol: " + tickersLISTdataArray[3].symbol)
        console.log("Sample Data: tickersLISTdataArray[3].volume: " + tickersLISTdataArray[3].volume)

        console.log("\nFor the Next step, we need the Company's Ticker Symbol to modify the url")
        console.log("Example: Symbol of the company "
            + tickersLISTdataArray[0].companyName + " is this: " + tickersLISTdataArray[0].symbol);

        // now lets modify that url
        let companyOpeningPageURL = ('https://finance.yahoo.com/quote/'
            + tickersLISTdataArray[0].symbol + "?p=" + tickersLISTdataArray[0].symbol);
        console.log("\nNow lets see if it works:");
        console.log(companyOpeningPageURL);

        // finally lets go to that new page to test this all over again
        //--------------------------------------------------------------------- Data retrieved 1/8
        //      tickersLISTdataArray[0].companyName
    

        let companyOpeningPageData = await axios({
            method: "GET",
            url: companyOpeningPageURL,
        })

        $ = cheerio.load(companyOpeningPageData.data); // OK the Company Summary Page is loaded
        elementSelector = 'div#quote-summary tr'

        keys = [
            'tab',
            'value',
        ] // A Little Messy but I can work with this

        $(elementSelector).each((parentIndex, parentElement) => {
            keyIndex = 0
            dataObject = {}

            $(parentElement).children().each((childIndex, childElement) => {
                let trValue = $(childElement).text(); // value inside tr tag

                if (trValue) {
                    dataObject[keys[keyIndex]] = trValue;
                    keyIndex++;
                }
            })
            companyOpeningPageDataArray.push(dataObject);
        })
//        console.log(companyOpeningPageDataArray); // IT WORKS !!!

        if (companyOpeningPageDataArray.length) {
            console.log("\nSummary Page Status for - " + tickersLISTdataArray[0].companyName + ": ONLINE");

            for (let i = 0; i < companyOpeningPageDataArray.length; i++) {
                if (companyOpeningPageDataArray[i].tab === 'Market Cap') {
                    companyOpeningPageDataArray[2].tab === companyOpeningPageDataArray[i].tab;
                    companyOpeningPageDataArray[2].value = companyOpeningPageDataArray[i].value;
                }
            } // Fix Market Cap Value for Smaller Opening Page Data Scope
        }

        console.log("\nThe data that I need from here is: ")
        console.log("Previous Close, Open, and Market Cap. Lets try to get it for " + tickersLISTdataArray[0].companyName);

        console.log("Previous Close: " + companyOpeningPageDataArray[0].value)
        console.log("Open: " + companyOpeningPageDataArray[1].value)
        console.log("Market Cap: " + companyOpeningPageDataArray[2].value)
        
        // GREAT !!!
        //      companyOpeningPageDataArray[0].value
        //      companyOpeningPageDataArray[1].value
        //      companyOpeningPageDataArray[2].value
        //---------------------------------------------------------------------- Data retrieved 4/8
        // ELHAMDULILLAH
        // Now lets go to the Profile tab of this company
        // Modify the url again
        let companyProfileTabURL = (`https://finance.yahoo.com/quote/${tickersLISTdataArray[0].symbol}/profile?p=${tickersLISTdataArray[0].symbol}`);
        console.log("\nNow lets see if it works for the PROFILE Tab:");
        console.log(companyProfileTabURL);

        let companyProfileTabData = await axios({
            method: "GET",
            url: companyProfileTabURL,
        })

        $ = cheerio.load(companyProfileTabData.data); 
        elementSelector = 'div.asset-profile-container p';

        keys = [
            'dataField',
        ];

        if ($($(elementSelector)[0])[0]) {

            $($(elementSelector)[0])[0].children.filter(node => node.type === 'text').forEach(element => {
               dataObject = {};
               dataObject['dataField'] = element.data;
               companyProfileTabDataArray.push(dataObject);
           }); 

           elementSelector = 'div.asset-profile-container span';
           $(elementSelector).each((parentIndex, parentElement) => {
               keyIndex = 0
               dataObject = {}

               $(parentElement).each((childIndex, childElement) => {
                   let pValue = $(childElement).text(); 
//                   let pValue = $(childElement).html();

                  if (pValue) {
                      dataObject[keys[keyIndex]] = pValue;
                      keyIndex++;
                  }
             })
             companyProfileTabDataArray.push(dataObject);
         });

            descriptionString = '';
            elementSelector = 'section.quote-sub-section p';
            $(elementSelector).each((parentIndex, parentElement) => {
                keyIndex = 0;

                $(parentElement).each((childIndex, childElement) => {
                    let p_Value = $(childElement).text(); 

                if (p_Value) {
                    descriptionString = p_Value;
                    keyIndex++;
                }
            })
            
            });
        }
        let dataFromDescriptionString = descriptionString.includes("ounded in") ? descriptionString.split("ounded in ") : "N/A"
        let yearFounded = descriptionString.includes("ounded in") ? dataFromDescriptionString[1][0] + dataFromDescriptionString[1][1] + dataFromDescriptionString[1][2] + dataFromDescriptionString[1][3] : "N/A";

        let companyProfileTabEmployeeNumber = "N/A";
        for (let i = 0; i < companyProfileTabDataArray.length; i++) {
            if (companyProfileTabDataArray[i].dataField === 'Full Time Employees') {
                companyProfileTabEmployeeNumber = companyProfileTabDataArray[i+1].dataField
            }
        } // Fix Employee Number Value for Larger Adresses on Profile Page

        // GREAT !!!
        //      companyProfileTabDataArray[0].dataField !!! OR  companyProfileTabDataArray[1].dataField
        //      companyProfileTabEmployeeNumber
        //---------------------------------------------------------------------- Data retrieved 6/8 
        //
        console.log("OK This works too,")

//-------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------
/*
        //---------_THE_GOOGLE_SEARCH_PAGE_METHOD_----------

        console.log("Lets go to google and get some of that data. For this, we need the\n");
        console.log("tickersLISTdataArray[0].companyName and tickersLISTdataArray[0].symbol");

        // now lets modify that url
        let companyGooglePageURLtemp = (`https://www.google.com/search?q=${tickersLISTdataArray[0].companyName} ${tickersLISTdataArray[0].symbol}`);
        let companyGooglePageURL = URLify(companyGooglePageURLtemp);
        function URLify(string) {
            return string.trim().replace(/\s/g, '%20'); //Convert String into useable URL
        }
        console.log("\nHere is the Google Search Link: ");
        console.log(companyGooglePageURL);
        console.log("OK lets go to that Google page now");

        const companyGooglePageData = await axios({
            method: "GET",
            url: "https://www.google.com/search?q=Amazon%20USD%20AMZN", // TEMPORARY LINK BECAUSE
        })                                          // CURRENT TOP TICKER HAS VERY FEW DATA ON THIS PAGE
                                                    // companyGooglePageURL SHOULD BE USED HERE INSTEAD
        $ = cheerio.load(companyGooglePageData.data);
        elementSelector = 'div.sATSHe';

        keys = [
            'dataField',
        ] // We have a lot of junk data here but maybe I can get what I need

        $(elementSelector).each((parentIndex, parentElement) => {
            keyIndex = 0
            dataObject = {}

            $(parentElement).each((childIndex, childElement) => {
                let spanValue = $(childElement).text();

                if (spanValue) {
                    dataObject[keys[keyIndex]] = spanValue;
                    keyIndex++;
                }
            })
            companyGooglePageDataArray.push(dataObject);
        })

        console.log("\nThe data that I need from here is:");
        console.log("Date Founded, Headquarters, and Number of Employees.\nLets try to get it for "
         + tickersLISTdataArray[0].companyName);
        console.log(companyGooglePageDataArray); 
*/
//        console.log("\nDate Founded: " + companyGooglePageDataArray[32].dataField);      // OUT OF SCOPE
//        console.log("Headquarters: " + companyGooglePageDataArray[38].dataField);        // OUT OF SCOPE
//        console.log("Number of Employees: " + companyGooglePageDataArray[44].dataField); // OUT OF SCOPE

//-------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------

        console.log("Now to prepare the construction of the history tab Link");
        console.log("Required Timestamp Value:")
        let date = providedDate.split(".");
        let date_Data = new Date( date[2], date[1] - 1, date[0]);
        period1 = date_Data.getTime()/1000 + 3600 - 86400;
        period2 = date_Data.getTime()/1000 + 3600;
//        console.log(period1);

        let companyHistoryTab_for_providedDate_Url = (`https://finance.yahoo.com/quote/${tickersLISTdataArray[0].symbol}/history?period1=${period1}&period2=${period2}&interval=1d&filter=history&frequency=1d&includeAdjustedClose=true`);
        console.log("\nNow lets see that link in action:");
        console.log(companyHistoryTab_for_providedDate_Url);
        console.log("EXCELENT!")

        let companyHistoryTabData = await axios({
            method: "GET",
            url: companyHistoryTab_for_providedDate_Url,
        })

        $ = cheerio.load(companyHistoryTabData.data); 
        elementSelector = 'tr td'

        keys = [
            'historyData',
        ] // A Little Messy but I can work with this

        $(elementSelector).each((parentIndex, parentElement) => {
            keyIndex = 0
            dataObject = {}

            $(parentElement).children().each((childIndex, childElement) => {
                let tr_Value = $(childElement).text(); // value inside tr tag

                if (tr_Value) {
                    dataObject[keys[keyIndex]] = tr_Value;
                    keyIndex++;
                }
            })
            companyHistoryTabDataArray.push(dataObject);
        })
//        console.log(companyHistoryTabDataArray);

        let historyDataOpen = companyHistoryTabDataArray.length ? 
                         companyHistoryTabDataArray[1].historyData : "Not available for date: " + providedDate;
        let historyDataClose = companyHistoryTabDataArray.length ? 
                         companyHistoryTabDataArray[4].historyData : "Not available for date: " + providedDate;
        let historyDataCap = companyHistoryTabDataArray.length ? 
                         companyHistoryTabDataArray[2].historyData : "Not available for date: " + providedDate;


//-------------------REQUIRED DATA
    /*
        Company Name:           tickersLISTdataArray[0].companyName
        Previous Close:         historyDataClose
        Open:                   historyDataOpen
        High:                   historyDataCap
        Market Cap:             companyOpeningPageDataArray[2].value
        Date Founded:           Not Available on Yahoo Finance
        Headquarters:           companyProfileTabDataArray[1].dataField
        Number of Employees:    companyProfileTabEmployeeNumber
        Date:                   provided by user
    */
    console.log("\nAnd here are results of Web Scraping:")
    
    console.log("\nREQUIRED DATA FOR COMPANY:")
        const requiredDataforCompany01 = {
            companyID: 1,
            companyNAME: tickersLISTdataArray.length ? tickersLISTdataArray[0].companyName : 'N/A',
            companyYEAR_FOUNDED: descriptionString[1].length ? yearFounded : "N/A",
            companyEmployNUMBER: companyProfileTabEmployeeNumber ? companyProfileTabEmployeeNumber : 'N/A',
            companyHQ:  companyProfileTabDataArray.length ? (companyProfileTabDataArray[1].dataField + ", " 
                                                            + companyProfileTabDataArray[2].dataField) : 'N/A',
            companyCLOSE_PRICE: companyHistoryTabDataArray.length ? historyDataClose : "Not available for date: " + providedDate,
            companyOPEN_PRICE: companyHistoryTabDataArray.length ? historyDataOpen : "Not available for date: " + providedDate,
            companyHIGH: companyHistoryTabDataArray.length ? historyDataCap : "Not available for date: " + providedDate,
            companyMARKET_CAP: companyOpeningPageDataArray.length ? companyOpeningPageDataArray[2].value : 'N/A',
            ON_DATE: providedDate,
        }
        console.log(requiredDataforCompany01);

        let jsonCompany01 = JSON.stringify(requiredDataforCompany01);
        console.log("And Here we Have the JSON formatted String for use in Database: \n")
        console.log(jsonCompany01);
        console.log("\nNow, to finally add it into my Database:")

//------------------------------------------------------------
//------------------------------------------------------------------------------------------
//              NOW ITS TIME FOR MONGO +++
//------------------------------------------------------------------------------------------
//------------------------------------------------------------

    let atlasURL = "mongodb+srv://DamirKovacevic:djoottvc.sjka@cluster0.sqjqu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
    let client = new MongoClient(atlasURL, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();         // Connected to the MongoDB cluster
//---------------------------
//  Now lets get this done
/*           
        async function listDatabases(client){
            databasesList = await client.db().admin().listDatabases();
         
            console.log("\nAvailable Databases:");
            databasesList.databases.forEach(db => console.log(` - ${db.name}`));
        };
        await  listDatabases(client);   // async funstion to list all current databases
*/
        async function createCompanyEntry(client, newCompanyEntry){
            const result = await client.db("yahooScraperDatabase").collection("companiesData").insertOne(newCompanyEntry);
            console.log(`New entry for ${tickersLISTdataArray[0].companyName} was created with the following id: ${result.insertedId}`);
        }
        await createCompanyEntry(client,
        {
            Ticker_List_ID: 1,
            Ticker_List_Symbol: tickersLISTdataArray.length ? tickersLISTdataArray[0].symbol : 'N/A',
            Company_Name: tickersLISTdataArray.length ? tickersLISTdataArray[0].companyName : 'N/A',
            Year_Founded: descriptionString[1].length ? yearFounded : "N/A",
            Employees_Number: companyProfileTabEmployeeNumber ? companyProfileTabEmployeeNumber : 'N/A',
            Company_HQ_Adress:  companyProfileTabDataArray.length ? (companyProfileTabDataArray[1].dataField + ", " 
                                                            + companyProfileTabDataArray[2].dataField) : 'N/A',
            On_Given_Date: providedDate,
            Close_Price: companyHistoryTabDataArray.length ? historyDataClose : "Not available for date: " + providedDate,
            Open_Price: companyHistoryTabDataArray.length ? historyDataOpen : "Not available for date: " + providedDate,
            HIGH: companyHistoryTabDataArray.length ? historyDataCap : "Not available for date: " + providedDate,
            Market_Cap: companyOpeningPageDataArray.length ? companyOpeningPageDataArray[2].value : 'N/A',
        });
    } catch (e) {
        console.error(e);
    };

//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

//    NOW TO IMPLEMENT A LOOP TO GET THE DATA FOR ALL THE REMAINING TICKERS ON THE PAGE
//-------------------------------------------------------------------------------------
        for (let companyIDvalue = 1; companyIDvalue < tickersLISTdataArray.length; companyIDvalue++) {
            companyOpeningPageDataArray = [];
            companyProfileTabDataArray = [];
            companyHistoryTabDataArray = [];
            companyOpeningPageURL = (`https://finance.yahoo.com/quote/${tickersLISTdataArray[companyIDvalue].symbol}?p=${tickersLISTdataArray[companyIDvalue].symbol}`);

            companyOpeningPageData = await axios({
                method: "GET",
                url: companyOpeningPageURL,
            })
            $ = cheerio.load(companyOpeningPageData.data);
            elementSelector = 'div#quote-summary tr'
            keys = ['tab','value',]

            $(elementSelector).each((parentIndex, parentElement) => {
                keyIndex = 0
                dataObject = {}
    
                $(parentElement).children().each((childIndex, childElement) => {
                    let trValue = $(childElement).text();
                    if (trValue) {
                        dataObject[keys[keyIndex]] = trValue;
                        keyIndex++;
                    }
                })
                companyOpeningPageDataArray.push(dataObject);
            })
    
                console.log("\nSummary Page Status for - " + tickersLISTdataArray[companyIDvalue].companyName + ": ONLINE");
    
                for (let i = 0; i < companyOpeningPageDataArray.length; i++) {
                    if (companyOpeningPageDataArray[i].tab === 'Market Cap') {
                        companyOpeningPageDataArray[2].tab = companyOpeningPageDataArray[i].tab;
                        companyOpeningPageDataArray[2].value = companyOpeningPageDataArray[i].value;
                    }
                }

            companyProfileTabURL = (`https://finance.yahoo.com/quote/${tickersLISTdataArray[companyIDvalue].symbol}/profile?p=${tickersLISTdataArray[companyIDvalue].symbol}`);
            companyProfileTabData = await axios({
                method: "GET",
                url: companyProfileTabURL,
            })
            $ = cheerio.load(companyProfileTabData.data); 
            elementSelector = 'div.asset-profile-container p';
            keys = ['dataField',];
    
            if ($($(elementSelector)[0])[0]) {
                $($(elementSelector)[0])[0].children.filter(node => node.type === 'text').forEach(element => {
                   dataObject = {};
                   dataObject['dataField'] = element.data;
                   companyProfileTabDataArray.push(dataObject);
               }); 
               elementSelector = 'div.asset-profile-container span';
               $(elementSelector).each((parentIndex, parentElement) => {
                   keyIndex = 0
                   dataObject = {}
                   $(parentElement).each((childIndex, childElement) => {
                       let pValue = $(childElement).text(); 
    
                          if (pValue) {
                              dataObject[keys[keyIndex]] = pValue;
                              keyIndex++;
                            }
                        })
                 companyProfileTabDataArray.push(dataObject);
                });

                descriptionString = '';
                elementSelector = 'section.quote-sub-section p';
                $(elementSelector).each((parentIndex, parentElement) => {
                    keyIndex = 0;

                $(parentElement).each((childIndex, childElement) => {
                    let p_Value = $(childElement).text(); 

                if (p_Value) {
                    descriptionString = p_Value;
                    keyIndex++;
                }
            })
            
            });
        }
        dataFromDescriptionString = descriptionString.includes("ounded in") ? descriptionString.split("ounded in ") : "N/A"
        yearFounded = descriptionString.includes("ounded in") ? dataFromDescriptionString[1][0] + dataFromDescriptionString[1][1] + dataFromDescriptionString[1][2] + dataFromDescriptionString[1][3] : "N/A";

        companyProfileTabEmployeeNumber = "N/A";
            for (let i = 0; i < companyProfileTabDataArray.length; i++) {
                if (companyProfileTabDataArray[i].dataField === 'Full Time Employees') {
                    companyProfileTabEmployeeNumber = companyProfileTabDataArray[i+1].dataField
                }
            }

        companyHistoryTab_for_providedDate_Url = (`https://finance.yahoo.com/quote/${tickersLISTdataArray[companyIDvalue].symbol}/history?period1=${period1}&period2=${period2}&interval=1d&filter=history&frequency=1d&includeAdjustedClose=true`);

        companyHistoryTabData = await axios({
            method: "GET",
            url: companyHistoryTab_for_providedDate_Url,
        })

        $ = cheerio.load(companyHistoryTabData.data); 
        elementSelector = 'tr td'

        keys = [
            'historyData',
        ]

        $(elementSelector).each((parentIndex, parentElement) => {
            keyIndex = 0
            dataObject = {}

            $(parentElement).children().each((childIndex, childElement) => {
                let tr_Value = $(childElement).text(); // value inside tr tag

                if (tr_Value) {
                    dataObject[keys[keyIndex]] = tr_Value;
                    keyIndex++;
                }
            })
            companyHistoryTabDataArray.push(dataObject);
        })

        historyDataOpen = companyHistoryTabDataArray.length ? 
                         companyHistoryTabDataArray[1].historyData : "Not available for date: " + providedDate;
        historyDataClose = companyHistoryTabDataArray.length ? 
                         companyHistoryTabDataArray[4].historyData : "Not available for date: " + providedDate;
        historyDataCap = companyHistoryTabDataArray.length ? 
                         companyHistoryTabDataArray[2].historyData : "Not available for date: " + providedDate;

            
    console.log("REQUIRED DATA FOR COMPANY:")
        const requiredDataforCompany02 = {
            companyID: (companyIDvalue + 1),
            companyNAME: tickersLISTdataArray.length ? tickersLISTdataArray[companyIDvalue].companyName : 'N/A',
            companyYEAR_FOUNDED: descriptionString[1].length ? yearFounded : "N/A",
            companyEmployNUMBER: companyProfileTabEmployeeNumber ? companyProfileTabEmployeeNumber : 'N/A',
            companyHQ:  companyProfileTabDataArray.length ? (companyProfileTabDataArray[1].dataField + ", " 
                                                            + companyProfileTabDataArray[2].dataField) : 'N/A',            
            companyCLOSE_PRICE: companyHistoryTabDataArray.length ? historyDataClose : "Not available for date: " + providedDate,
            companyOPEN_PRICE: companyHistoryTabDataArray.length ? historyDataOpen : "Not available for date: " + providedDate,
            companyHIGH: companyHistoryTabDataArray.length ? historyDataCap : "Not available for date: " + providedDate,
            companyMARKET_CAP: companyOpeningPageDataArray.length ? companyOpeningPageDataArray[2].value : 'N/A',
            ON_DATE: providedDate,
        }
        console.log(requiredDataforCompany02);

        let jsonCompany02 = JSON.stringify(requiredDataforCompany02);
        console.log("And Here we Have the JSON formatted String for use in Database: \n")
        console.log(jsonCompany02);

        console.log("\nNow, to finally add it into my Database:")

        try {
            await client.connect();      

            async function createCompanyEntry(client, newCompanyEntry){
                const result = await client.db("yahooScraperDatabase").collection("companiesData").insertOne(newCompanyEntry);
                console.log(`New entry for ${tickersLISTdataArray[companyIDvalue].companyName} was created with the following id: ${result.insertedId}`);
            }
            await createCompanyEntry(client,
                {
                    Ticker_List_ID: (companyIDvalue + 1),
                    Ticker_List_Symbol: tickersLISTdataArray.length ? tickersLISTdataArray[companyIDvalue].symbol : 'N/A',
                    Company_Name: tickersLISTdataArray.length ? tickersLISTdataArray[companyIDvalue].companyName : 'N/A',
                    Year_Founded: descriptionString[1].length ? yearFounded : "N/A",
                    Employees_Number: companyProfileTabEmployeeNumber ? companyProfileTabEmployeeNumber : 'N/A',
                    Company_HQ_Adress:  companyProfileTabDataArray.length ? (companyProfileTabDataArray[1].dataField + ", " 
                                                                + companyProfileTabDataArray[2].dataField) : 'N/A',
                    On_Given_Date: providedDate,
                    Close_Price: companyHistoryTabDataArray.length ? historyDataClose : "Not available for date: " + providedDate,
                    Open_Price: companyHistoryTabDataArray.length ? historyDataOpen : "Not available for date: " + providedDate,
                    HIGH: companyHistoryTabDataArray.length ? historyDataCap : "Not available for date: " + providedDate,
                    Market_Cap: companyOpeningPageDataArray.length ? companyOpeningPageDataArray[2].value : 'N/A',
                });
            } catch (e) {
                console.error(e);
            }
            lastCompanyIDvalue = companyIDvalue + 1;
        };
        
        console.log("\nFINALLY !!!")
        console.log("Everything is done !")
        console.log("Added " + lastCompanyIDvalue + " entries into yahooScraperDatabase/companiesData.")
        await client.close();

// END OF BIG IF CONTROL BLOCK
} else {
    console.log("\nAccess to Yahoo Finance Tickers List Status: DENIED!");
    console.log("BREAKING OPERATION"); 
} // END OF BIG IF CONTROL BLOCK
    } catch (error) {
        console.error(error);
    } 
}
getTickersData();
