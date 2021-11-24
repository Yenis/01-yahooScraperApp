Just some simple documentation on how I ran the application and how it's supposed to behave.
IMPORTANT: Code in the practiceCode and productionCode folders isn't used by the program. It's included only for demonstration purposes, and as an example on how my code evolved during production.

Everything begins with npm install, and npm run start... But wait until the message Database is Ready is returned, before going to localhost:3000

![after it says database ready](https://user-images.githubusercontent.com/22280179/143175011-f2763e10-784a-479f-987e-1b5050042701.png)

The initial page is nothing special really, just provide the date, click submit, and that sets the machine in motion...
![select date to start gathering data](https://user-images.githubusercontent.com/22280179/143175061-97db48f6-e2bb-4331-a0a1-6e2becf4cce6.png)

After the message: Access to Yahoo Finance Tickers List Status: ONLINE, the required data will be gathered and sent to the database. It can take a while... 
![if it says online, it has started](https://user-images.githubusercontent.com/22280179/143175297-43186d99-3123-45a3-9aa7-0cb247ae8cb4.png)

Data is stored in a new database on my profile at MongoDB:
![saple data is stored on mongoDB](https://user-images.githubusercontent.com/22280179/143175445-945ed28b-4a81-4615-a663-9443e1df6168.png)

And a copy of all that data is returned and updated in the table on localhost:3000, after the whole process has finished.
![after its done data is on localhost](https://user-images.githubusercontent.com/22280179/143175536-5d2cc637-9380-44b5-a591-d67489c6599e.png)

That was just a short demonstration, when everything is OK.
A common problem is that Yahoo Tickers Page doesn't load or isn't available for any reason. If that happens, the program would close immediately.

![DENIED](https://user-images.githubusercontent.com/22280179/143175863-b82d772f-029a-40fd-b46f-aebf5ce6a706.png)

