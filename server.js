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
const express = require("express");

const { MongoClient } = require('mongodb');
const atlasURL = "mongodb+srv://DamirKovacevic:djoottvc.sjka@cluster0.sqjqu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(atlasURL, { useNewUrlParser: true, useUnifiedTopology: true });

async function prepareDatabase() {
    await client.connect(); // Connected to the MongoDB cluster
    await client.db("yahooScraperDatabase").collection("companiesData").drop();
    await client.db("yahooScraperDatabase").collection("companiesData").insertOne({type: "New Entry"});
    console.log("Database is Ready!");
}
prepareDatabase();

let app = express();
let port = 3000;
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/sendDate", (req, res) => {
    const providedDate = req.body['date'];
    const date = providedDate.split("-");
    const thisDate = (date[2] + '.' + date[1] + '.' + date[0] + '.');
    const dateData = new Date(providedDate);

    const period1 = dateData.getTime() / 1000 + 3600;
    const period2 = dateData.getTime() / 1000 + 3600 + 86400;
    let descriptionString = '';

    const tickersListDataArray = [];
    let companyOpeningPageDataArray = [];
    let companyProfileTabDataArray = [];
    let companyHistoryTabDataArray = [];
    let allDataArray = [];

async function getTickersData() {
    try {
        const siteUrl = 'https://finance.yahoo.com/trending-tickers'
        const data = await axios({
            method: "GET",
            url: siteUrl,
        })

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
            tickersListDataArray.push(dataObject);
        })

    //------------------------------------------------------ Data retrieved 1/8
    //      tickersListDataArray[companyIDvalue].companyName

    //   BEGINNING OF SELECTION  
        if (tickersListDataArray.length) { 
            console.log("\nAccess to Yahoo Finance Tickers List Status: ONLINE");

            for (let companyIDvalue = 0; companyIDvalue < tickersListDataArray.length; companyIDvalue++) {
            //  BEGINNING OF LOOP

                companyOpeningPageDataArray = [];
                companyProfileTabDataArray = [];
                companyHistoryTabDataArray = [];

                let companyOpeningPageURL = ('https://finance.yahoo.com/quote/'
                    + tickersListDataArray[companyIDvalue].symbol + "?p=" + tickersListDataArray[companyIDvalue].symbol);

                let companyOpeningPageData = await axios({
                    method: "GET",
                    url: companyOpeningPageURL,
                })

                $ = cheerio.load(companyOpeningPageData.data); // OK the Company Summary Page is loaded
                elementSelector = 'div#quote-summary tr'

                keys = [
                    'tab',
                    'value',
                    ];

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

                if (companyOpeningPageDataArray.length) {
                    console.log("\nSummary Page Status for - " + tickersListDataArray[companyIDvalue].companyName + ": ONLINE");

                    for (let i = 0; i < companyOpeningPageDataArray.length; i++) {
                        if (companyOpeningPageDataArray[i].tab === 'Market Cap') {
                            companyOpeningPageDataArray[2].tab === companyOpeningPageDataArray[i].tab;
                            companyOpeningPageDataArray[2].value = companyOpeningPageDataArray[i].value;
                        }
                    } // Fix Market Cap Value for Smaller Opening Page Data Scope
                }

        //------------------------------------------ Data retrieved 4/8
        //      companyOpeningPageDataArray[0].value
        //      companyOpeningPageDataArray[1].value
        //      companyOpeningPageDataArray[2].value

                let companyProfileTabURL = (`https://finance.yahoo.com/quote/${tickersListDataArray[companyIDvalue].symbol}/profile?p=${tickersListDataArray[companyIDvalue].symbol}`);

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
                            let spanValue = $(childElement).text();

                             if (spanValue) {
                                dataObject[keys[keyIndex]] = spanValue;
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
                let dataFromDescriptionString = descriptionString.includes("ounded in ") ? descriptionString.split("ounded in ") : "N/A"
                let yearFounded = descriptionString.includes("ounded in ") ? dataFromDescriptionString[1][0] + dataFromDescriptionString[1][1] + dataFromDescriptionString[1][2] + dataFromDescriptionString[1][3] : "N/A";

                let companyProfileTabEmployeeNumber = "N/A";
                    for (let i = 0; i < companyProfileTabDataArray.length; i++) {
                        if (companyProfileTabDataArray[i].dataField === 'Full Time Employees') {
                            companyProfileTabEmployeeNumber = companyProfileTabDataArray[i + 1].dataField
                        }
                    } // Fix Employee Number Value for Larger Adresses on Profile Page

            //---------------------------------------------------------------- Data retrieved 6/8 
            //      companyProfileTabDataArray[0].dataField  OR  [1].dataField
            //      companyProfileTabEmployeeNumber

                let companyHistoryTab_for_providedDate_Url = (`https://finance.yahoo.com/quote/${tickersListDataArray[companyIDvalue].symbol}/history?period1=${period1}&period2=${period2}&interval=1d&filter=history&frequency=1d&includeAdjustedClose=true`);

                let companyHistoryTabData = await axios({
                    method: "GET",
                    url: companyHistoryTab_for_providedDate_Url,
                })

                $ = cheerio.load(companyHistoryTabData.data);
                elementSelector = 'tr td'

                keys = [
                    'historyData',
                    ];

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

                let historyDataOpen = (companyHistoryTabDataArray[1]) ?
                    companyHistoryTabDataArray[1].historyData : "N/A for: " + thisDate;
                let historyDataClose = (companyHistoryTabDataArray[4]) ?
                    companyHistoryTabDataArray[4].historyData : "N/A for: " + thisDate;
                let historyDataCap = (companyHistoryTabDataArray[2]) ?
                    companyHistoryTabDataArray[2].historyData : "N/A for: " + thisDate;

            //-------------REQUIRED DATA
            /*
                Company Name:           tickersListDataArray[companyIDvalue].companyName
                Previous Close:         historyDataClose
                Open:                   historyDataOpen
                High:                   historyDataCap
                Market Cap:             companyOpeningPageDataArray[2].value
                Year Founded:           yearFounded
                Headquarters:           companyProfileTabDataArray[1].dataField
                Number of Employees:    companyProfileTabEmployeeNumber
                Date:                   provided by user
            */
                const requiredDataforCompany = {
                    companyID: companyIDvalue + 1,
                    companySymbol: tickersListDataArray.length ? tickersListDataArray[companyIDvalue].symbol : 'N/A',
                    companyNAME: tickersListDataArray.length ? tickersListDataArray[companyIDvalue].companyName : 'N/A',
                    companyYEAR_FOUNDED: descriptionString[1].length ? yearFounded : "N/A",
                    companyEmployNUMBER: companyProfileTabEmployeeNumber ? companyProfileTabEmployeeNumber : 'N/A',
                    companyHQ: companyProfileTabDataArray.length ? (companyProfileTabDataArray[1].dataField + ", "
                        + companyProfileTabDataArray[2].dataField) : 'N/A',
                    companyCLOSE_PRICE: (companyHistoryTabDataArray[4]) ? historyDataClose : "N/A for: " + thisDate,
                    companyOPEN_PRICE: (companyHistoryTabDataArray[1]) ? historyDataOpen : "N/A for: " + thisDate,
                    companyHIGH: (companyHistoryTabDataArray[2]) ? historyDataCap : "N/A for: " + thisDate,
                    companyMARKET_CAP: companyOpeningPageDataArray.length ? companyOpeningPageDataArray[2].value : 'N/A',
                    ON_DATE: thisDate,
                    }
                console.log(requiredDataforCompany);
                allDataArray.push(requiredDataforCompany);

    //------------------------------------------------------------
    //------------------------------------------------------------------------------------------
    //              NOW ITS TIME FOR MONGO +++
    //------------------------------------------------------------------------------------------
    //------------------------------------------------------------

                try {
                        
                    await client.connect();         // Connected to the MongoDB cluster

                    async function createCompanyEntry(client, newCompanyEntry) {
                        const result = await client.db("yahooScraperDatabase").collection("companiesData").insertOne(newCompanyEntry);
                        console.log(`Successfully uploaded data for: ${tickersListDataArray[companyIDvalue].companyName} into MongoDB with the following id: ${result.insertedId}`);
                        }
                        await createCompanyEntry(client,
                            {
                            Ticker_List_ID: companyIDvalue + 1,
                            Ticker_List_Symbol: tickersListDataArray.length ? tickersListDataArray[companyIDvalue].symbol : 'N/A',
                            Company_Name: tickersListDataArray.length ? tickersListDataArray[companyIDvalue].companyName : 'N/A',
                            Year_Founded: descriptionString[1].length ? yearFounded : "N/A",
                            Employees_Number: companyProfileTabEmployeeNumber ? companyProfileTabEmployeeNumber : 'N/A',
                            Company_HQ_Adress: companyProfileTabDataArray.length ? (companyProfileTabDataArray[1].dataField + ", "
                                + companyProfileTabDataArray[2].dataField) : 'N/A',
                            On_Given_Date: thisDate,
                            Close_Price: (companyHistoryTabDataArray[4]) ? historyDataClose : "N/A for: " + thisDate,
                            Open_Price: (companyHistoryTabDataArray[1]) ? historyDataOpen : "N/A for: " + thisDate,
                            HIGH: (companyHistoryTabDataArray[2]) ? historyDataCap : "N/A for: " + thisDate,
                            Market_Cap: companyOpeningPageDataArray.length ? companyOpeningPageDataArray[2].value : 'N/A',
                            });
                    } catch (e) {
                        console.error(e);
                    };
                    lastCompanyIDvalue = companyIDvalue + 1;
                    await client.close();
                    
            }; //   END OF LOOP

            console.log("\nEverything is done !")
            console.log("Added " + lastCompanyIDvalue + " entries into yahooScraperDatabase/companiesData.")

        } else {    //   END OF SELLECTION
            console.log("\nAccess to Yahoo Finance Tickers List Status: DENIED!");
            console.log("No data was writtend to MongoDB Database!")
            console.log("BREAKING OPERATION!");
            process.exit();
        } 
        } catch (error) {
            console.error(error);
        }
        res.json(allDataArray); // Send back response with all collected data
    }
getTickersData();
});

app.listen(port, () => {
    console.log("Server listening on port " + port);
});
